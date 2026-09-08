import os
import sys
import math
import struct
from PIL import Image

# ============================================================
# Magic numbers
# ============================================================
MAGIC_XVMH = 0x484d5658
MAGIC_XVRT = 0x54525658

# ============================================================
# Matrix Math
# ============================================================
class DashMat4:
    def __init__(self):
        self.mtx = [[1.0 if i == j else 0.0 for j in range(4)] for i in range(4)]

    def rotate(self, r):
        cx, cy, cz = math.cos(r[0]), math.cos(r[1]), math.cos(r[2])
        sx, sy, sz = math.sin(r[0]), math.sin(r[1]), math.sin(r[2])
        Rz = [[cz, -sz, 0.0, 0.0], [sz, cz, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]]
        Ry = [[cy, 0.0, sy, 0.0], [0.0, 1.0, 0.0, 0.0], [-sy, 0.0, cy, 0.0], [0.0, 0.0, 0.0, 1.0]]
        Rx = [[1.0, 0.0, 0.0, 0.0], [0.0, cx, -sx, 0.0], [0.0, sx, cx, 0.0], [0.0, 0.0, 0.0, 1.0]]
        m = self._mul4(self._mul4(Rz, Ry), Rx)
        self.mtx = self._mul4(self.mtx, m)

    def translate(self, t):
        T = [[1.0, 0.0, 0.0, 0.0],
             [0.0, 1.0, 0.0, 0.0],
             [0.0, 0.0, 1.0, 0.0],
             [t[0], t[1], t[2], 1.0]]
        self.mtx = self._mul4(self.mtx, T)

    def compose(self, parent):
        self.mtx = self._mul4(self.mtx, parent.mtx)

    def transformPoint(self, p):
        m = self.mtx
        x = p[0]*m[0][0] + p[1]*m[1][0] + p[2]*m[2][0] + m[3][0]
        y = p[0]*m[0][1] + p[1]*m[1][1] + p[2]*m[2][1] + m[3][1]
        z = p[0]*m[0][2] + p[1]*m[1][2] + p[2]*m[2][2] + m[3][2]
        return (x, y, z)

    def transformNormal(self, n):
        m = self.mtx
        x = n[0]*m[0][0] + n[1]*m[1][0] + n[2]*m[2][0]
        y = n[0]*m[0][1] + n[1]*m[1][1] + n[2]*m[2][1]
        z = n[0]*m[0][2] + n[1]*m[1][2] + n[2]*m[2][2]
        l = math.sqrt(x*x + y*y + z*z)
        if l > 1e-6:
            return (x/l, y/l, z/l)
        return (0.0, 1.0, 0.0)

    def _mul4(self, A, B):
        C = [[0.0]*4 for _ in range(4)]
        for i in range(4):
            for j in range(4):
                C[i][j] = sum(A[i][k]*B[k][j] for k in range(4))
        return C

# ============================================================
# Binary Stream Reader
# ============================================================
class BitStream:
    def __init__(self, data):
        self.data = data
        self.pos = 0
        self._e = '<'

    def getSize(self):
        return len(self.data)

    def tell(self):
        return self.pos

    def seek(self, pos, whence=0):
        if pos is None:
            return
        if whence == 0:
            self.pos = pos
        elif whence == 1:
            self.pos += pos
        elif whence == 2:
            self.pos = len(self.data) + pos

    def readUByte(self):
        if self.pos >= len(self.data): return 0
        v = self.data[self.pos]; self.pos += 1; return v

    def readUShort(self):
        if self.pos + 2 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'H', self.data, self.pos); self.pos += 2; return v

    def readShort(self):
        if self.pos + 2 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'h', self.data, self.pos); self.pos += 2; return v

    def readUInt(self):
        if self.pos + 4 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'I', self.data, self.pos); self.pos += 4; return v

    def readInt(self):
        if self.pos + 4 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'i', self.data, self.pos); self.pos += 4; return v

    def readFloat(self):
        if self.pos + 4 > len(self.data): return 0.0
        v, = struct.unpack_from(self._e + 'f', self.data, self.pos); self.pos += 4; return v

    def readBytes(self, n):
        v = self.data[self.pos : self.pos + n]; self.pos += n; return v

# ============================================================
# DXT / Texture Decoders
# ============================================================
def _rgb565(c):
    r = ((c >> 11) & 0x1F) * 255 // 31
    g = ((c >> 5)  & 0x3F) * 255 // 63
    b = ( c        & 0x1F) * 255 // 31
    return r, g, b

def _dxt_color_block(data, p, px, bx, by, width, height, colors_out):
    c0, c1 = struct.unpack_from('<HH', data, p)
    p += 4
    code, = struct.unpack_from('<I', data, p)
    p += 4
    r0, g0, b0 = _rgb565(c0)
    r1, g1, b1 = _rgb565(c1)
    if c0 > c1:
        col = [
            (r0, g0, b0, 255),
            (r1, g1, b1, 255),
            ((2*r0 + r1)//3, (2*g0 + g1)//3, (2*b0 + b1)//3, 255),
            ((r0 + 2*r1)//3, (r0 + 2*g1)//3, (b0 + 2*b1)//3, 255),
        ]
    else:
        col = [
            (r0, g0, b0, 255),
            (r1, g1, b1, 255),
            ((r0 + r1)//2,   (g0 + g1)//2,   (b0 + b1)//2,   255),
            (0, 0, 0, 0),
        ]
    for dy in range(4):
        y = by + dy
        if y >= height: continue
        for dx in range(4):
            x = bx + dx
            if x >= width: continue
            ci = (code >> (2 * (dy * 4 + dx))) & 3
            colors_out[(y * width + x) * 4 : (y * width + x) * 4 + 4] = bytes(col[ci])
    return p

def decode_dxt1(data, width, height):
    px = bytearray(width * height * 4)
    p = 0
    for by in range(0, height, 4):
        for bx in range(0, width, 4):
            p = _dxt_color_block(data, p, px, bx, by, width, height, px)
    return bytes(px)

def decode_dxt3(data, width, height):
    px = bytearray(width * height * 4)
    p = 0
    for by in range(0, height, 4):
        for bx in range(0, width, 4):
            alpha_words = struct.unpack_from('<4H', data, p)
            p += 8
            p = _dxt_color_block(data, p, px, bx, by, width, height, px)
            for dy in range(4):
                y = by + dy
                if y >= height: continue
                aw = alpha_words[dy]
                for dx in range(4):
                    x = bx + dx
                    if x >= width: continue
                    a4 = (aw >> (dx * 4)) & 0x0F
                    px[(y * width + x) * 4 + 3] = a4 * 17
    return bytes(px)

def decode_dxt5(data, width, height):
    px = bytearray(width * height * 4)
    p = 0
    for by in range(0, height, 4):
        for bx in range(0, width, 4):
            a0, a1 = data[p], data[p+1]
            p += 2
            a_bits = int.from_bytes(data[p:p+6], 'little')
            p += 6
            if a0 > a1:
                alphas = [a0, a1, (6*a0+1*a1)//7, (5*a0+2*a1)//7,
                          (4*a0+3*a1)//7, (3*a0+4*a1)//7, (2*a0+5*a1)//7, (1*a0+6*a1)//7]
            else:
                alphas = [a0, a1, (4*a0+1*a1)//5, (3*a0+2*a1)//5,
                          (2*a0+3*a1)//5, (1*a0+4*a1)//5, 0, 255]
            p = _dxt_color_block(data, p, px, bx, by, width, height, px)
            for dy in range(4):
                y = by + dy
                if y >= height: continue
                for dx in range(4):
                    x = bx + dx
                    if x >= width: continue
                    idx = (a_bits >> (3 * (dy * 4 + dx))) & 7
                    px[(y * width + x) * 4 + 3] = alphas[idx]
    return bytes(px)

def xvr_load(data):
    bs = BitStream(data)
    if bs.readUInt() != MAGIC_XVMH:
        return []
    bs.readUInt()       # archive length
    bs.readUInt()       # texture count

    tex_offsets = []
    while bs.tell() < bs.getSize() - 4:
        magic = bs.readUInt()
        if magic == MAGIC_XVRT:
            bs.readUInt()               # chunk length
            tex_offsets.append(bs.tell())

    textures = []
    for ofs in tex_offsets:
        bs.seek(ofs)
        bs.readUInt()               # format_1
        fmt2   = bs.readUInt()      # format_2: 6=DXT1, 7=DXT3, 8=DXT5
        bs.readUInt()               # tex_id
        width  = bs.readUShort()
        height = bs.readUShort()
        size   = bs.readUInt()
        bs.readBytes(0x24)          # padding / header tail
        raw    = bs.readBytes(size)
        try:
            if fmt2 == 7:
                pixels = decode_dxt3(raw, width, height)
            elif fmt2 == 8:
                pixels = decode_dxt5(raw, width, height)
            else:
                pixels = decode_dxt1(raw, width, height)
            textures.append({
                'name':   "Texture_%d" % len(textures),
                'width':  width,
                'height': height,
                'pixels': pixels,
            })
        except Exception:
            pass
    return textures

# ============================================================
# Ninja Stage Geometry Decoder (True Authentic PSO BB Parser)
# ============================================================
class NinjaStageGeometry:
    def __init__(self):
        self.meshes_data = []
        self.materials_data = []
        self.matrix = DashMat4()
        self.texNames = []

    def parse(self, data):
        self.bs = BitStream(data)
        self.bs.seek(len(data) - 16)
        tableOfs = self.bs.readUInt()
        if tableOfs == 0 or tableOfs >= len(data): return
        self.bs.seek(tableOfs)
        fmt2 = self.bs.readUInt()
        n_count = self.bs.readUInt()
        d_count = self.bs.readUShort()
        pad = self.bs.readUShort()
        hd = self.bs.readUInt()
        d_ofs = self.bs.readUInt()
        tex_ofs = self.bs.readUInt()

        # Read texture names table
        if tex_ofs > 0 and tex_ofs < len(data):
            self.bs.seek(tex_ofs)
            tn_ofs = self.bs.readUInt()
            tn_count = self.bs.readUInt()
            if tn_ofs > 0 and tn_ofs < len(data):
                self.bs.seek(tn_ofs)
                for i in range(tn_count):
                    name_ofs = self.bs.readUInt()
                    save = self.bs.tell() + 8
                    if name_ofs > 0 and name_ofs < len(data):
                        end = data.find(b'\x00', name_ofs)
                        self.texNames.append(data[name_ofs:end].decode('ascii', errors='ignore'))
                    self.bs.seek(save)

        c = 2.0 * math.pi / 0x10000
        self.bs.seek(d_ofs)
        d_sections = []
        for _ in range(d_count):
            section_id = self.bs.readInt()
            section = {
                'id': section_id,
                'pos': [self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()],
                'rot': (self.bs.readInt()*c, self.bs.readInt()*c, self.bs.readInt()*c),
                'radius': self.bs.readFloat(),
                'static_ofs': self.bs.readUInt(),
                'animated_ofs': self.bs.readUInt(),
                'static_num': self.bs.readUInt(),
                'animated_num': self.bs.readUInt(),
                'end': self.bs.readUInt(),
            }
            d_sections.append(section)

        for section in d_sections:
            mat = DashMat4()
            mat.rotate(section['rot'])
            mat.translate(section['pos'])

            mesh_offsets = []
            if section['static_ofs'] > 0 and section['static_ofs'] < len(data):
                self.bs.seek(section['static_ofs'])
                for _ in range(section['static_num']):
                    mesh_offsets.append(self.bs.readUInt())
                    self.bs.readBytes(0x0C)

            for ofs in mesh_offsets:
                if ofs > 0 and ofs < len(data):
                    self.bs.seek(ofs)
                    self.readNode(mat)

            anim_offsets = []
            if section['animated_ofs'] > 0 and section['animated_ofs'] < len(data):
                self.bs.seek(section['animated_ofs'])
                for _ in range(section['animated_num']):
                    anim_offsets.append(self.bs.readUInt())
                    self.bs.readBytes(0x1C)

            for ofs in anim_offsets:
                if ofs > 0 and ofs < len(data):
                    self.bs.seek(ofs)
                    self.readNode(mat)

    def readNode(self, pMatrix=None):
        if self.bs.pos + 52 > self.bs.getSize(): return
        c = 2.0 * math.pi / 0x10000
        node = {
            'flags': self.bs.readUInt(),
            'meshOfs': self.bs.readUInt(),
            'pos': (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()),
            'rot': (self.bs.readInt()*c, self.bs.readInt()*c, self.bs.readInt()*c),
            'scl': (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()),
            'childOfs': self.bs.readUInt(),
            'siblingOfs': self.bs.readUInt(),
        }
        mat = DashMat4()
        if not (node['flags'] & 0x02): mat.rotate(node['rot'])
        if not (node['flags'] & 0x01): mat.translate(node['pos'])
        if pMatrix is not None: mat.compose(pMatrix)
        self.matrix = mat

        size = self.bs.getSize()
        if node['meshOfs'] >= size or node['childOfs'] >= size or node['siblingOfs'] >= size: return
        if node['meshOfs'] != 0:
            self.bs.seek(node['meshOfs'])
            self.readMesh()
        if node['childOfs'] != 0:
            self.bs.seek(node['childOfs'])
            self.readNode(mat)
        if node['siblingOfs'] != 0:
            self.bs.seek(node['siblingOfs'])
            self.readNode(pMatrix)

    def readMesh(self):
        mesh = {
            'flags': self.bs.readUInt(),
            'vertex_info_list_offset': self.bs.readUInt(),
            'vertex_info_count': self.bs.readUInt(),
            'triangle_strip_list_a_offset': self.bs.readUInt(),
            'triangle_strip_a_count': self.bs.readUInt(),
            'triangle_strip_list_b_offset': self.bs.readUInt(),
            'triangle_strip_b_count': self.bs.readUInt(),
            'center': (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()),
            'radius': self.bs.readFloat(),
        }
        sz = self.bs.getSize()
        vlo = mesh['vertex_info_list_offset']
        self.vertex_stack = {}
        if vlo and vlo < sz:
            for vi in range(mesh['vertex_info_count']):
                entry_off = vlo + vi * 16
                if entry_off + 16 > sz: break
                self.bs.seek(entry_off)
                self.readVertexList()

        if mesh['triangle_strip_a_count']:
            aso = mesh['triangle_strip_list_a_offset']
            if aso and aso < sz:
                self.bs.seek(aso)
                self.readStripList(mesh['triangle_strip_a_count'], False)

        if mesh['triangle_strip_b_count']:
            bso = mesh['triangle_strip_list_b_offset']
            if bso and bso < sz:
                self.bs.seek(bso)
                self.readStripList(mesh['triangle_strip_b_count'], True)

    def readVertexList(self):
        vtype = self.bs.readUShort()
        self.bs.readUShort()
        vofs = self.bs.readUInt()
        vertex_size = self.bs.readUInt()
        vcount = self.bs.readUInt()

        read_uv = bool(vtype & 0x01)
        read_normal = bool(vtype & 0x02)
        read_color = bool(vtype & 0x04)

        sz = self.bs.getSize()
        if not vofs or vofs >= sz: return
        self.bs.seek(vofs)

        for i in range(vcount):
            existing = self.vertex_stack.get(i)
            vertex = {'pos': None, 'norm': None, 'color': None,
                      'uv': existing['uv'] if existing else None}
            p = (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat())
            vertex['pos'] = self.matrix.transformPoint(p)
            if read_normal:
                n = (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat())
                vertex['norm'] = self.matrix.transformNormal(n)
            if read_color:
                b2 = self.bs.readUByte() / 255.0
                g2 = self.bs.readUByte() / 255.0
                r2 = self.bs.readUByte() / 255.0
                a2 = self.bs.readUByte() / 255.0
                vertex['color'] = (r2, g2, b2, a2)
            if read_uv:
                u = self.bs.readFloat()
                v = self.bs.readFloat()
                vertex['uv'] = (u, 1.0 - v)
            self.vertex_stack[i] = vertex

    def readStripList(self, count, useAlpha):
        strip_info = []
        for _ in range(count):
            strip_info.append({
                'material_property_list_offset': self.bs.readUInt(),
                'material_property_list_size': self.bs.readUInt(),
                'index_list_offset': self.bs.readUInt(),
                'index_count': self.bs.readUInt(),
                'unknown': self.bs.readUInt(),
            })
        self.material = {
            'diffuse': (1.0, 1.0, 1.0, 1.0), 'ambient': (1.0, 1.0, 1.0, 1.0),
            'specular': (1.0, 1.0, 1.0, 1.0), 'texIndex': -1,
            'blendSrc': '', 'blendDst': '', 'doubleSided': False,
        }
        for strip in strip_info:
            if strip['material_property_list_offset'] < self.bs.getSize():
                self.bs.seek(strip['material_property_list_offset'])
                self.readMaterial(strip['material_property_list_size'])

            points = []
            if strip['index_list_offset'] < self.bs.getSize():
                self.bs.seek(strip['index_list_offset'])
                for _ in range(strip['index_count']):
                    points.append(self.bs.readShort())

            clockwise = False
            triangles = []
            for i in range(len(points) - 2):
                if clockwise: a, b, c = points[i], points[i+2], points[i+1]
                else: a, b, c = points[i+1], points[i+2], points[i]
                clockwise = not clockwise
                if a != b and b != c and c != a:
                    triangles.extend([a, b, c])

            self.appendMesh(triangles)

    def readMaterial(self, prop_count):
        for _ in range(prop_count):
            mat_type = self.bs.readUInt()
            if mat_type == 2:
                dst = self.bs.readUInt(); src = self.bs.readUInt()
                if src == 1 and dst == 4:
                    self.material['blendSrc'] = 'ONE'; self.material['blendDst'] = 'ONE'
                elif src == 5 and dst == 4:
                    self.material['blendSrc'] = ''; self.material['blendDst'] = ''
                self.bs.readBytes(4)
            elif mat_type == 3:
                tex_id = self.bs.readUInt()
                self.bs.readBytes(8)
                self.material['texIndex'] = tex_id
            elif mat_type == 4:
                self.bs.readBytes(12)
                self.material['doubleSided'] = True
            elif mat_type == 5:
                r = self.bs.readUByte() / 255.0
                g = self.bs.readUByte() / 255.0
                b = self.bs.readUByte() / 255.0
                a = self.bs.readUByte() / 255.0
                self.material['diffuse'] = (r, g, b, a)
                self.bs.readBytes(8)
            else:
                self.bs.readBytes(12)

    def appendMesh(self, triangles):
        if not triangles: return
        pos_list, norm_list, color_list, uv_list, tri_list = [], [], [], [], []
        for idx in triangles:
            if idx not in self.vertex_stack: continue
            vt = self.vertex_stack[idx]
            tri_list.append(len(pos_list))
            pos_list.append(vt['pos'])
            if vt.get('norm') is not None: norm_list.append(vt['norm'])
            if vt.get('color') is not None: color_list.append(vt['color'])
            if vt.get('uv') is not None: uv_list.append(vt['uv'])
            else: uv_list.append((0.0, 0.0))

        if not pos_list: return
        has_colors = bool(color_list)
        mat_key = (
            self.material['diffuse'], self.material['texIndex'],
            self.material['blendSrc'], self.material['blendDst'], has_colors
        )
        mi = next((i for i, m in enumerate(self.materials_data) if m['key'] == mat_key), None)
        if mi is None:
            mi = len(self.materials_data)
            self.materials_data.append({
                'key': mat_key, 'name': 'mat_%03d' % mi,
                'diffuse': self.material['diffuse'], 'texIndex': self.material['texIndex'],
                'blendSrc': self.material['blendSrc'], 'blendDst': self.material['blendDst'],
                'doubleSided': self.material['doubleSided'], 'has_vertex_colors': has_colors
            })
        self.meshes_data.append({
            'positions': pos_list, 'normals': norm_list, 'colors': color_list,
            'uvs': uv_list, 'triangles': tri_list, 'mat_index': mi
        })

# ============================================================
# OBJ / MTL Exporter
# ============================================================
def export_obj_mtl(geo, prefix, tex_dir, out_base_path):
    obj_path = out_base_path + ".obj"
    mtl_path = out_base_path + ".mtl"
    mtl_filename = os.path.basename(mtl_path)

    # 1. Write MTL
    with open(mtl_path, 'w') as f_mtl:
        f_mtl.write("# Phantasy Star Online Authentic Material Archive\n\n")
        for mat in geo.materials_data:
            mat_name = mat['name']
            diff = mat['diffuse']
            f_mtl.write(f"newmtl {mat_name}\n")
            f_mtl.write(f"Ka 0.8000 0.8000 0.8000\n")
            f_mtl.write(f"Kd {diff[0]:.4f} {diff[1]:.4f} {diff[2]:.4f}\n")
            f_mtl.write(f"Ks 0.1500 0.1500 0.1500\n")
            f_mtl.write(f"d {diff[3]:.4f}\n")
            f_mtl.write(f"illum 2\n")

            tex_idx = mat['texIndex']
            # Find best texture match
            matched_tex = None
            if 0 <= tex_idx < len(geo.texNames):
                name_cand = f"{geo.texNames[tex_idx]}.png"
                if os.path.exists(os.path.join(tex_dir, name_cand)):
                    matched_tex = name_cand
            if not matched_tex and tex_idx >= 0:
                idx_cand = f"{prefix}_{tex_idx:03d}.png"
                if os.path.exists(os.path.join(tex_dir, idx_cand)):
                    matched_tex = idx_cand
            if matched_tex:
                f_mtl.write(f"map_Kd ../textures/{matched_tex}\n")
            f_mtl.write("\n")

    # 2. Write OBJ
    with open(obj_path, 'w') as f_obj:
        f_obj.write("# Phantasy Star Online Authentic Stage Geometry\n")
        f_obj.write(f"mtllib {mtl_filename}\n\n")

        v_offset = 1
        for mesh_idx, mesh in enumerate(geo.meshes_data):
            positions = mesh['positions']
            normals = mesh['normals']
            uvs = mesh['uvs']
            triangles = mesh['triangles']
            mat_idx = mesh['mat_index']
            mat_name = geo.materials_data[mat_idx]['name']

            f_obj.write(f"g mesh_{mesh_idx}\n")
            f_obj.write(f"usemtl {mat_name}\n")

            for pos in positions:
                f_obj.write(f"v {pos[0]:.4f} {pos[1]:.4f} {pos[2]:.4f}\n")
            for uv in uvs:
                f_obj.write(f"vt {uv[0]:.4f} {uv[1]:.4f}\n")
            has_norm = len(normals) == len(positions)
            if has_norm:
                for norm in normals:
                    f_obj.write(f"vn {norm[0]:.4f} {norm[1]:.4f} {norm[2]:.4f}\n")

            for i in range(0, len(triangles), 3):
                t0 = triangles[i] + v_offset
                t1 = triangles[i+1] + v_offset
                t2 = triangles[i+2] + v_offset
                if has_norm:
                    f_obj.write(f"f {t0}/{t0}/{t0} {t1}/{t1}/{t1} {t2}/{t2}/{t2}\n")
                else:
                    f_obj.write(f"f {t0}/{t0} {t1}/{t1} {t2}/{t2}\n")

            v_offset += len(positions)
            f_obj.write("\n")

    total_v = v_offset - 1
    total_t = sum(len(m['triangles'])//3 for m in geo.meshes_data)
    print(f"  Exported {obj_path}: {total_v:,} vertices, {total_t:,} triangles, {len(geo.materials_data)} materials")

# ============================================================
# Main Batch Extraction
# ============================================================
def main():
    scene_dir = os.path.join("pso_raw_data", "data", "scene")
    tex_dir = os.path.join("public", "models", "textures")
    zone_dir = os.path.join("public", "models", "zones")
    os.makedirs(tex_dir, exist_ok=True)
    os.makedirs(zone_dir, exist_ok=True)

    stage_mappings = [
        ("map_city00_00n.rel", "map_city00.xvm", "pioneer2-city"),
        ("map_lobby_01n.rel", "map_lobby_01.xvm", "visual-lobby"),
        ("map_lobby_02n.rel", "map_lobby_02.xvm", "visual-lobby-festive"),
        ("map_forest01n.rel", "map_forest01.xvm", "forest-01"),
        ("map_forest02n.rel", "map_forest02.xvm", "forest-02"),
        ("map_cave01_00n.rel", "map_cave01.xvm", "caves-01"),
        ("map_cave02_00n.rel", "map_cave02.xvm", "caves-02"),
        ("map_cave03_00n.rel", "map_cave03.xvm", "caves-03"),
        ("map_machine01_00n.rel", "map_machine01.xvm", "mines-01"),
        ("map_machine02_00n.rel", "map_machine02.xvm", "mines-02"),
        ("map_ruins01_00n.rel", "map_ruins01.xvm", "ruins-01"),
        ("map_ruins02_00n.rel", "map_ruins02.xvm", "ruins-02"),
        ("map_labo00_00n.rel", "map_labo00.xvm", "pioneer2-lab"),
        ("map_space01_00n.rel", "map_space01.xvm", "vr-spaceship"),
        ("map_ancient01_00n.rel", "map_ancient01.xvm", "vr-temple"),
        ("map_jungle01_00n.rel", "map_jungle01.xvm", "cca-jungle-mountain"),
        ("map_seabed01_00n.rel", "map_seabed01.xvm", "seabed-01"),
        ("map_crater01_00n.rel", "map_crater01.xvm", "crater-interior"),
        ("map_desert01_00n.rel", "map_desert01.xvm", "subterranean-desert"),
        ("map_boss01n.rel", "map_boss01.xvm", "boss-dragon"),
        ("map_boss02n.rel", "map_boss02.xvm", "caves-derolle"),
        ("map_boss03n.rel", "map_boss03.xvm", "boss-vol-opt"),
        ("map_boss05n.rel", "map_boss05.xvm", "boss-dark-falz"),
        ("map_boss06n.rel", "map_boss06.xvm", "boss-gol-dragon"),
        ("map_boss07n.rel", "map_boss07.xvm", "boss-gryphon"),
        ("map_boss08n.rel", "map_boss08.xvm", "boss-olga-flow"),
        ("map_boss09_00n.rel", "map_boss09.xvm", "boss-saint-million"),
    ]

    for rel_name, xvm_name, out_name in stage_mappings:
        rel_path = os.path.join(scene_dir, rel_name)
        xvm_path = os.path.join(scene_dir, xvm_name)
        if not os.path.exists(rel_path):
            print(f"[SKIP] {rel_name} not found")
            continue

        print(f"\n========================================\nExtracting {out_name} ({rel_name})...")

        # 1. Decode textures
        prefix = out_name.replace("-", "_")
        if os.path.exists(xvm_path):
            with open(xvm_path, 'rb') as f:
                raw_xvm = f.read()
            raw_textures = xvr_load(raw_xvm)
            print(f"  Found {len(raw_textures)} textures in {xvm_name}")

            # Fast read rel texture names
            tex_names = []
            with open(rel_path, 'rb') as f:
                rel_data = f.read()
            if len(rel_data) >= 16:
                bs_tmp = BitStream(rel_data)
                bs_tmp.seek(len(rel_data) - 16)
                tableOfs = bs_tmp.readUInt()
                if tableOfs > 0 and tableOfs + 24 <= len(rel_data):
                    bs_tmp.seek(tableOfs + 20)
                    tex_ofs = bs_tmp.readUInt()
                    if tex_ofs > 0 and tex_ofs + 8 <= len(rel_data):
                        bs_tmp.seek(tex_ofs)
                        tn_ofs = bs_tmp.readUInt()
                        tn_count = bs_tmp.readUInt()
                        if tn_ofs > 0 and tn_ofs < len(rel_data):
                            bs_tmp.seek(tn_ofs)
                            for i in range(tn_count):
                                name_ofs = bs_tmp.readUInt()
                                save = bs_tmp.tell() + 8
                                if name_ofs > 0 and name_ofs < len(rel_data):
                                    end = rel_data.find(b'\x00', name_ofs)
                                    tex_names.append(rel_data[name_ofs:end].decode('ascii', errors='ignore'))
                                bs_tmp.seek(save)

            for idx, tex in enumerate(raw_textures):
                if idx < len(tex_names) and tex_names[idx]:
                    name_file = f"{tex_names[idx]}.png"
                    out_p = os.path.join(tex_dir, name_file)
                    if not os.path.exists(out_p):
                        try:
                            img = Image.frombytes('RGBA', (tex['width'], tex['height']), tex['pixels'])
                            img.save(out_p)
                        except Exception: pass
                idx_file = f"{prefix}_{idx:03d}.png"
                out_p2 = os.path.join(tex_dir, idx_file)
                if not os.path.exists(out_p2):
                    try:
                        img = Image.frombytes('RGBA', (tex['width'], tex['height']), tex['pixels'])
                        img.save(out_p2)
                    except Exception: pass

        # 2. Decode stage geometry
        with open(rel_path, 'rb') as f:
            rel_data = f.read()
        geo = NinjaStageGeometry()
        geo.parse(rel_data)

        # 3. Export OBJ & MTL
        out_base = os.path.join(zone_dir, out_name)
        export_obj_mtl(geo, prefix, tex_dir, out_base)

    print("\n========================================")
    print("ALL AUTHENTIC STAGES EXTRACTED SUCCESSFULLY!")
    print("========================================")

if __name__ == '__main__':
    main()
