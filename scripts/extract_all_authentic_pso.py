import os
import sys
import glob
import math
import struct
from PIL import Image

# ============================================================
# Magic numbers & chunk constants
# ============================================================
MAGIC_XVMH = 0x484d5658
MAGIC_XVRT = 0x54525658

NJD_CN = 0;   NJD_CE = 255
CHUNK_BITS = [1,2,3,4,5]
CHUNK_TINY = [8,9]
CHUNK_MATERIAL = [17,18,19,20,21,22,23]
NJD_CV_SH=32; NJD_CV_VN_SH=33; NJD_CV=34; NJD_CV_D8=35
NJD_CV_UF=36; NJD_CV_NF=37; NJD_CV_S5=38; NJD_CV_S4=39; NJD_CV_IN=40
NJD_CV_VN=41; NJD_CV_VN_D8=42; NJD_CV_VN_UF=43; NJD_CV_VN_NF=44
NJD_CV_VN_S5=45; NJD_CV_VN_S4=46; NJD_CV_VN_IN=47
NJD_CV_VNX=48; NJD_CV_VNX_D8=49; NJD_CV_VNX_UF=50
CHUNK_VERTEX = list(range(32, 51))
CHUNK_VOLUME = [56,57,58]
NJD_CS=64; NJD_CS_UVN=65; NJD_CS_UVH=66; NJD_CS_VN=67
NJD_CS_UVN_VN=68; NJD_CS_UVH_VN=69; NJD_CS_D8=70
NJD_CS_UVN_D8=71; NJD_CS_UVH_D8=72; NJD_CS_2=73
NJD_CS_UVN2=74; NJD_CS_UVH2=75
CHUNK_STRIP = list(range(64, 76))

class BitStream:
    def __init__(self, data, big_endian=False):
        self.data = bytes(data)
        self.pos = 0
        self._e = '>' if big_endian else '<'

    def tell(self): return self.pos
    def getSize(self): return len(self.data)
    def seek(self, offset, whence=0):
        if whence == 1: self.pos += offset
        else: self.pos = offset

    def readString(self):
        chars = []
        while self.pos < len(self.data):
            b = self.data[self.pos]
            self.pos += 1
            if b == 0: break
            chars.append(chr(b))
        return ''.join(chars)

    def readBytes(self, n):
        result = self.data[self.pos:self.pos + n]
        self.pos += n
        return result

    def readUInt(self):
        if self.pos + 4 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'I', self.data, self.pos)
        self.pos += 4
        return v

    def readInt(self):
        if self.pos + 4 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'i', self.data, self.pos)
        self.pos += 4
        return v

    def readUShort(self):
        if self.pos + 2 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'H', self.data, self.pos)
        self.pos += 2
        return v

    def readShort(self):
        if self.pos + 2 > len(self.data): return 0
        v, = struct.unpack_from(self._e + 'h', self.data, self.pos)
        self.pos += 2
        return v

    def readFloat(self):
        if self.pos + 4 > len(self.data): return 0.0
        v, = struct.unpack_from(self._e + 'f', self.data, self.pos)
        self.pos += 4
        return v

    def readUByte(self):
        if self.pos + 1 > len(self.data): return 0
        v, = struct.unpack_from('B', self.data, self.pos)
        self.pos += 1
        return v

class DashMat4:
    def __init__(self):
        self.m = [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ]

    def translate(self, pos):
        tx, ty, tz = pos
        self.m[3][0] += tx * self.m[0][0] + ty * self.m[1][0] + tz * self.m[2][0]
        self.m[3][1] += tx * self.m[0][1] + ty * self.m[1][1] + tz * self.m[2][1]
        self.m[3][2] += tx * self.m[0][2] + ty * self.m[1][2] + tz * self.m[2][2]

    def rotate(self, rot):
        rx, ry, rz = rot
        cx, sx = math.cos(rx), math.sin(rx)
        cy, sy = math.cos(ry), math.sin(ry)
        cz, sz = math.cos(rz), math.sin(rz)
        rm = [
            [cy * cz, cy * sz, -sy, 0.0],
            [sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0.0],
            [cx * sy * cz + sx * sz, cx * sy * sz - cx * cz, cx * cy, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ]
        res = [[0.0]*4 for _ in range(4)]
        for i in range(4):
            for j in range(4):
                for k in range(4):
                    res[i][j] += rm[i][k] * self.m[k][j]
        self.m = res

    def transformPoint(self, p):
        x, y, z = p
        tx = x * self.m[0][0] + y * self.m[1][0] + z * self.m[2][0] + self.m[3][0]
        ty = x * self.m[0][1] + y * self.m[1][1] + z * self.m[2][1] + self.m[3][1]
        tz = x * self.m[0][2] + y * self.m[1][2] + z * self.m[2][2] + self.m[3][2]
        return (tx, ty, tz)

    def transformNormal(self, n):
        x, y, z = n
        tx = x * self.m[0][0] + y * self.m[1][0] + z * self.m[2][0]
        ty = x * self.m[0][1] + y * self.m[1][1] + z * self.m[2][1]
        tz = x * self.m[0][2] + y * self.m[1][2] + z * self.m[2][2]
        l = math.sqrt(tx*tx + ty*ty + tz*tz)
        if l > 1e-6: return (tx/l, ty/l, tz/l)
        return (0.0, 1.0, 0.0)

    def compose(self, parent):
        res = [[0.0]*4 for _ in range(4)]
        for i in range(4):
            for j in range(4):
                for k in range(4):
                    res[i][j] += self.m[i][k] * parent.m[k][j]
        self.m = res

def _rgb565(c):
    return ((c >> 11) & 0x1F) * 255 // 31, ((c >> 5) & 0x3F) * 255 // 63, (c & 0x1F) * 255 // 31

def decode_dxt1(data, width, height):
    px = bytearray(width * height * 4)
    bw = max(1, (width + 3) // 4)
    bh = max(1, (height + 3) // 4)
    p = 0
    for by in range(bh):
        for bx in range(bw):
            if p + 8 > len(data): break
            c0r, c1r = struct.unpack_from('<HH', data, p)
            bits     = struct.unpack_from('<I',  data, p + 4)[0]
            p += 8
            c0, c1 = _rgb565(c0r), _rgb565(c1r)
            if c0r > c1r:
                pal = [
                    c0 + (255,), c1 + (255,),
                    tuple((2*c0[i] + c1[i]) // 3 for i in range(3)) + (255,),
                    tuple((c0[i] + 2*c1[i]) // 3 for i in range(3)) + (255,)
                ]
            else:
                pal = [
                    c0 + (255,), c1 + (255,),
                    tuple((c0[i] + c1[i]) // 2 for i in range(3)) + (255,),
                    (0, 0, 0, 0)
                ]
            for py2 in range(4):
                for px2 in range(4):
                    col = pal[(bits >> (2 * (py2 * 4 + px2))) & 3]
                    x = bx * 4 + px2; y = by * 4 + py2
                    if x < width and y < height:
                        o = (y * width + x) * 4
                        px[o:o + 4] = col
    return bytes(px)

def decode_dxt3(data, width, height):
    px = bytearray(width * height * 4)
    bw = max(1, (width + 3) // 4)
    bh = max(1, (height + 3) // 4)
    p = 0
    for by in range(bh):
        for bx in range(bw):
            if p + 16 > len(data): break
            for py2 in range(4):
                row_a = struct.unpack_from('<H', data, p + py2 * 2)[0]
                for px2 in range(4):
                    x = bx * 4 + px2; y = by * 4 + py2
                    if x < width and y < height:
                        px[(y * width + x) * 4 + 3] = ((row_a >> (px2 * 4)) & 0xF) * 17
            c0r, c1r = struct.unpack_from('<HH', data, p + 8)
            bits     = struct.unpack_from('<I',  data, p + 12)[0]
            c0, c1   = _rgb565(c0r), _rgb565(c1r)
            pal = [
                c0 + (255,), c1 + (255,),
                tuple((2*c0[i] + c1[i]) // 3 for i in range(3)) + (255,),
                tuple((c0[i] + 2*c1[i]) // 3 for i in range(3)) + (255,)
            ]
            for py2 in range(4):
                for px2 in range(4):
                    col = pal[(bits >> (2 * (py2 * 4 + px2))) & 3]
                    x = bx * 4 + px2; y = by * 4 + py2
                    if x < width and y < height:
                        o = (y * width + x) * 4
                        px[o], px[o+1], px[o+2] = col[0], col[1], col[2]
            p += 16
    return bytes(px)

def decode_dxt5(data, width, height):
    px = bytearray(width * height * 4)
    bw = max(1, (width + 3) // 4)
    bh = max(1, (height + 3) // 4)
    p = 0
    for by in range(bh):
        for bx in range(bw):
            if p + 16 > len(data): break
            a0, a1 = data[p], data[p + 1]
            abits = int.from_bytes(data[p + 2: p + 8], 'little')
            if a0 > a1:
                apal = [a0, a1, (6*a0 + 1*a1) // 7, (5*a0 + 2*a1) // 7, (4*a0 + 3*a1) // 7, (3*a0 + 4*a1) // 7, (2*a0 + 5*a1) // 7, (1*a0 + 6*a1) // 7]
            else:
                apal = [a0, a1, (4*a0 + 1*a1) // 5, (3*a0 + 2*a1) // 5, (2*a0 + 3*a1) // 5, (1*a0 + 4*a1) // 5, 0, 255]
            for py2 in range(4):
                for px2 in range(4):
                    x = bx * 4 + px2; y = by * 4 + py2
                    if x < width and y < height:
                        idx = (abits >> (3 * (py2 * 4 + px2))) & 7
                        px[(y * width + x) * 4 + 3] = apal[idx]
            c0r, c1r = struct.unpack_from('<HH', data, p + 8)
            bits     = struct.unpack_from('<I',  data, p + 12)[0]
            c0, c1   = _rgb565(c0r), _rgb565(c1r)
            pal = [
                c0 + (255,), c1 + (255,),
                tuple((2*c0[i] + c1[i]) // 3 for i in range(3)) + (255,),
                tuple((c0[i] + 2*c1[i]) // 3 for i in range(3)) + (255,)
            ]
            for py2 in range(4):
                for px2 in range(4):
                    col = pal[(bits >> (2 * (py2 * 4 + px2))) & 3]
                    x = bx * 4 + px2; y = by * 4 + py2
                    if x < width and y < height:
                        o = (y * width + x) * 4
                        px[o], px[o+1], px[o+2] = col[0], col[1], col[2]
            p += 16
    return bytes(px)

def xvr_load(data):
    bs = BitStream(data)
    if bs.readUInt() != MAGIC_XVMH: return []
    bs.readUInt(); bs.readUInt()
    tex_offsets = []
    while bs.tell() < bs.getSize() - 4:
        magic = bs.readUInt()
        if magic == MAGIC_XVRT:
            bs.readUInt()
            tex_offsets.append(bs.tell())

    textures = []
    for ofs in tex_offsets:
        bs.seek(ofs)
        bs.readUInt()
        fmt2   = bs.readUInt()
        bs.readUInt()
        width  = bs.readUShort()
        height = bs.readUShort()
        size   = bs.readUInt()
        bs.readBytes(0x24)
        raw    = bs.readBytes(size)
        if fmt2 == 7: pixels = decode_dxt3(raw, width, height)
        elif fmt2 == 8: pixels = decode_dxt5(raw, width, height)
        else: pixels = decode_dxt1(raw, width, height)
        textures.append({
            'name': f"Texture_{len(textures)}",
            'width': width,
            'height': height,
            'pixels': pixels,
        })
    return textures

class NinjaDCRelImporter:
    def __init__(self):
        self.texNames       = []
        self.sections       = {}
        self.vertex_stack   = {}
        self.materials_data = []
        self.meshes_data    = []
        self.textures       = []
        self.current_matrix = DashMat4()
        self.material       = {}
        self.store_ofs      = [None] * 256
        self.jump_to        = 0
        self.bs_d = self.bs_n = self.bs = None

    def setTextures(self, textures): self.textures = textures

    def parse(self, d_data, n_data):
        if d_data: self.bs_d = BitStream(d_data)
        if n_data: self.bs_n = BitStream(n_data)
        if self.bs_d: self._prepare(self.bs_d, 'd')
        if self.bs_n: self._prepare(self.bs_n, 'n')
        self._readSections()

    def _prepare(self, bs, label):
        if bs.getSize() < 32: return
        bs.seek(bs.getSize() - 16)
        table_ofs = bs.readUInt()
        if table_ofs == 0 or table_ofs >= bs.getSize(): return
        bs.seek(table_ofs)
        section_count = bs.readUInt()
        bs.readUInt()
        section_ofs   = bs.readUInt()
        texture_ofs   = bs.readUInt()

        if texture_ofs > 0 and texture_ofs < bs.getSize():
            bs.seek(texture_ofs)
            tn_ofs   = bs.readUInt()
            tn_count = bs.readUInt()
            if tn_ofs > 0 and tn_ofs < bs.getSize():
                bs.seek(tn_ofs)
                for i in range(tn_count):
                    name_ofs = bs.readUInt()
                    save_ofs = bs.tell() + 8
                    if name_ofs > 0 and name_ofs < bs.getSize():
                        bs.seek(name_ofs); name = bs.readString(); bs.seek(save_ofs)
                        if i >= len(self.texNames): self.texNames.append(name)
                for idx, tn in enumerate(self.texNames):
                    if idx < len(self.textures):
                        c = os.path.splitext(os.path.basename(tn))[0]
                        if c: self.textures[idx]['name'] = c

        c = 2.0 * math.pi / 0x10000
        if section_ofs > 0 and section_ofs < bs.getSize():
            bs.seek(section_ofs)
            for _ in range(section_count):
                if bs.tell() + 48 > bs.getSize(): break
                sid = bs.readInt()
                pos = [bs.readFloat(), bs.readFloat(), bs.readFloat()]
                rot = [bs.readInt()*c, bs.readInt()*c, bs.readInt()*c]
                bs.readFloat()
                a_ofs = bs.readUInt(); b_ofs = bs.readUInt(); c_ofs = bs.readUInt()
                a_num = bs.readUInt(); b_num = bs.readUInt(); c_num = bs.readUInt()
                bs.readUInt()
                save = bs.tell()
                key  = str(sid)
                if key not in self.sections:
                    self.sections[key] = {'pos': pos, 'rot': rot, 'static': [], 'animated': []}
                if a_ofs > 0 and a_ofs < bs.getSize():
                    bs.seek(a_ofs)
                    for _ in range(a_num):
                        if bs.tell() + 48 > bs.getSize(): break
                        m_ofs = bs.readUInt(); bs.readBytes(0x2c)
                        self.sections[key]['static'].append({'src': label, 'm_ofs': m_ofs})
                if c_ofs > 0 and c_ofs < bs.getSize():
                    bs.seek(c_ofs)
                    for _ in range(c_num):
                        if bs.tell() + 56 > bs.getSize(): break
                        m_ofs = bs.readUInt(); bs.readUInt(); bs.readBytes(0x34)
                        self.sections[key]['animated'].append({'src': label, 'm_ofs': m_ofs})
                bs.seek(save)

    def _readSections(self):
        for key, section in self.sections.items():
            mat = DashMat4()
            mat.rotate(section['rot']); mat.translate(section['pos'])
            for e in section['static'] + section['animated']:
                self.bs = self.bs_d if e['src'] == 'd' else self.bs_n
                if self.bs is None: continue
                if e['m_ofs'] >= self.bs.getSize(): continue
                self.bs.seek(e['m_ofs'])
                self.vertex_stack = {}
                self._readNode(mat)

    def _readNode(self, pMatrix=None):
        if self.bs.pos + 52 > self.bs.getSize(): return
        c = 2.0 * math.pi / 0x10000
        node = {'flags':      self.bs.readUInt(), 'meshOfs': self.bs.readUInt(),
                'pos':        (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()),
                'rot':        (self.bs.readInt()*c, self.bs.readInt()*c, self.bs.readInt()*c),
                'scl':        (self.bs.readFloat(), self.bs.readFloat(), self.bs.readFloat()),
                'childOfs':   self.bs.readUInt(), 'siblingOfs': self.bs.readUInt()}
        mat = DashMat4()
        if not (node['flags'] & 0x02): mat.rotate(node['rot'])
        if not (node['flags'] & 0x01): mat.translate(node['pos'])
        if pMatrix is not None: mat.compose(pMatrix)
        self.current_matrix = mat

        sz = self.bs.getSize()
        if node['meshOfs'] < sz and node['meshOfs'] != 0:
            self.bs.seek(node['meshOfs']); self._readMesh()
        if node['childOfs'] < sz and node['childOfs'] != 0:
            self.bs.seek(node['childOfs']); self._readNode(mat)
        if node['siblingOfs'] < sz and node['siblingOfs'] != 0:
            self.bs.seek(node['siblingOfs']); self._readNode(pMatrix)

    def _readMesh(self):
        if self.bs.pos + 24 > self.bs.getSize(): return
        vofs = self.bs.readUInt(); cofs = self.bs.readUInt()
        self.bs.readBytes(16)
        sz = self.bs.getSize()
        if vofs != 0 and vofs < sz: self.bs.seek(vofs); self._readChunks(self.bs)
        if cofs != 0 and cofs < sz: self.bs.seek(cofs); self._readChunks(self.bs)

    def _readChunks(self, bs):
        self.material = {
            'diffuse': (1.0,1.0,1.0,1.0), 'ambient': (1.0,1.0,1.0,1.0),
            'specular': (1.0,1.0,1.0,1.0), 'texIndex': -1,
            'blendSrc': '', 'blendDst': '', 'doubleSided': False,
        }
        self._do_read = True
        limit = 0
        while self._do_read and limit < 50000:
            limit += 1
            if bs.pos + 2 > bs.getSize(): break
            ch = bs.readUByte()
            cf = bs.readUByte()
            if ch == NJD_CE:
                if self.jump_to:
                    bs.seek(self.jump_to); self.jump_to = 0; continue
                self._do_read = False
            elif ch == NJD_CN: continue
            elif ch in CHUNK_VERTEX:
                try: self._vChunk(bs, ch, cf)
                except Exception: break
            elif ch in CHUNK_BITS:
                if ch == 4: # NJD_CB_CP
                    self._do_read = False
                    self.store_ofs[cf] = bs.tell()
                elif ch == 5: # NJD_CB_DP
                    self.jump_to = bs.tell()
                    if self.store_ofs[cf] is not None:
                        bs.seek(self.store_ofs[cf])
            elif ch in CHUNK_MATERIAL:
                try:
                    bs.readUShort()
                    src = cf & 0x07; dst = (cf >> 3) & 0x07
                    if src == 1 and dst == 4: self.material['blendSrc'] = 'ONE'; self.material['blendDst'] = 'ONE'
                    elif src == 5 and dst == 4: self.material['blendSrc'] = ''; self.material['blendDst'] = ''
                    if ch & 0x01:
                        b2,g2,r2,a2 = bs.readUByte()/255.0, bs.readUByte()/255.0, bs.readUByte()/255.0, bs.readUByte()/255.0
                        self.material['diffuse'] = (r2, g2, b2, a2)
                    if ch & 0x02:
                        b2,g2,r2 = bs.readUByte()/255.0, bs.readUByte()/255.0, bs.readUByte()/255.0; bs.readUByte()
                        self.material['ambient'] = (r2, g2, b2, 1.0)
                    if ch & 0x04:
                        b2,g2,r2 = bs.readUByte()/255.0, bs.readUByte()/255.0, bs.readUByte()/255.0; bs.readUByte()
                        self.material['specular'] = (r2, g2, b2, 1.0)
                except Exception: break
            elif ch in CHUNK_TINY:
                try:
                    body = bs.readUShort()
                    self.material['texIndex'] = body & 0x1FFF
                except Exception: break
            elif ch in CHUNK_STRIP:
                try: self._sChunk(bs, ch, cf)
                except Exception: break
            elif ch in CHUNK_VOLUME:
                try:
                    bs.readUShort()
                    body = bs.readUShort()
                    strip_count = body & 0x3FFF
                    triangles = []
                    for _ in range(strip_count):
                        raw = bs.readShort()
                        cw = raw < 0
                        slen = abs(raw)
                        strip = [{'index': str(bs.readUShort()), 'uv': None} for _ in range(slen)]
                        for k in range(slen - 2):
                            if cw and k%2==0: a,b,c = strip[k],strip[k+2],strip[k+1]
                            elif cw: a,b,c = strip[k+1],strip[k+2],strip[k]
                            elif k%2==0: a,b,c = strip[k],strip[k+1],strip[k+2]
                            else: a,b,c = strip[k],strip[k+2],strip[k+1]
                            triangles.extend([a, b, c])
                    self._appendPoints(triangles)
                except Exception: pass
                return

    def _vChunk(self, bs, ch, cf):
        bs.readUShort()
        vofs   = bs.readUShort()
        vcount = bs.readUShort()
        read_color  = ch in (NJD_CV_VN_D8, NJD_CV_VNX_D8, NJD_CV_D8)
        read_normal = (NJD_CV_VN <= ch <= NJD_CV_VNX_UF)
        is_sh       = ch in (NJD_CV_SH, NJD_CV_VN_SH)
        is_vnx      = ch in (NJD_CV_VNX, NJD_CV_VNX_D8, NJD_CV_VNX_UF)

        for i in range(vcount):
            v = {'pos': None, 'norm': None, 'color': None}
            p = (bs.readFloat(), bs.readFloat(), bs.readFloat())
            if is_sh: bs.readFloat()
            v['pos'] = self.current_matrix.transformPoint(p)

            if is_vnx:
                pk = bs.readUInt()
                nx = (((pk >> 20) & 0x3FF) / 511.0) - 1.0
                ny = (((pk >> 10) & 0x3FF) / 511.0) - 1.0
                nz = (( pk        & 0x3FF) / 511.0) - 1.0
                v['norm'] = self.current_matrix.transformNormal((nx, ny, nz))
            elif read_normal:
                n = (bs.readFloat(), bs.readFloat(), bs.readFloat())
                if is_sh: bs.readFloat()
                v['norm'] = self.current_matrix.transformNormal(n)

            if read_color:
                b2 = bs.readUByte()/255.0; g2 = bs.readUByte()/255.0
                r2 = bs.readUByte()/255.0; a2 = bs.readUByte()/255.0
                v['color'] = (r2, g2, b2, a2)

            if ch == NJD_CV_VN_NF:
                nofs = bs.readShort()
                bs.readShort()
                self.vertex_stack[str(vofs + nofs)] = v
            else:
                self.vertex_stack[str(vofs + i)] = v

    def _sChunk(self, bs, ch, cf):
        bs.readUShort()
        body        = bs.readUShort()
        double_side = cf & 0x10
        strip_count = body & 0x3FFF
        user_offset = body >> 14
        triangles   = []

        for _ in range(strip_count):
            raw  = bs.readShort()
            cw   = raw < 0
            slen = abs(raw)
            strip = []
            for k in range(slen):
                pt = {'index': str(bs.readUShort()), 'uv': None}
                if ch == NJD_CS_UVN:
                    u = bs.readShort()/255.0; v = bs.readShort()/255.0
                    pt['uv'] = (u, 1.0-v)
                elif ch == NJD_CS_UVH:
                    u = bs.readShort()/1023.0; v = bs.readShort()/1023.0
                    pt['uv'] = (u, 1.0-v)
                strip.append(pt)
                if k > 1 and user_offset:
                    bs.readBytes(user_offset * 2)

            for k in range(slen - 2):
                if cw: a,b,c = strip[k],strip[k+2],strip[k+1]
                else: a,b,c = strip[k+1],strip[k+2],strip[k]
                cw = not cw
                triangles.extend([a, b, c])
                if double_side: triangles.extend([b, a, c])

        self._appendPoints(triangles)

    def _appendPoints(self, triangles):
        if not triangles: return
        pos_list=[]; norm_list=[]; uv_list=[]; tri_list=[]
        for j in range(0, len(triangles) - 2, 3):
            pts = (triangles[j], triangles[j+1], triangles[j+2])
            if any(pt['index'] not in self.vertex_stack for pt in pts):
                continue
            for pt in pts:
                vt = self.vertex_stack[pt['index']]
                tri_list.append(len(pos_list))
                pos_list.append(vt['pos'])
                if vt.get('norm'): norm_list.append(vt['norm'])
                else: norm_list.append((0.0, 1.0, 0.0))
                if pt.get('uv'): uv_list.append(pt['uv'])
                else: uv_list.append((0.0, 0.0))
        if not pos_list: return
        mat_key = (self.material['diffuse'], self.material['texIndex'])
        mi = next((i for i,m in enumerate(self.materials_data) if m['key']==mat_key), None)
        if mi is None:
            mi = len(self.materials_data)
            self.materials_data.append({
                'key': mat_key,
                'name': f"mat_{mi:03d}",
                'diffuse': self.material['diffuse'],
                'texIndex': self.material['texIndex'],
            })
        self.meshes_data.append({
            'positions': pos_list,
            'normals': norm_list,
            'uvs': uv_list,
            'triangles': tri_list,
            'mat_index': mi,
        })

def export_stage(importer, textures, base_out_path):
    obj_path = base_out_path + ".obj"
    mtl_path = base_out_path + ".mtl"
    mtl_filename = os.path.basename(mtl_path)

    # Write MTL
    with open(mtl_path, 'w') as f_mtl:
        f_mtl.write(f"# Phantasy Star Online Authentic Stage Material\n\n")
        for mi, mat in enumerate(importer.materials_data):
            mat_name = mat['name']
            f_mtl.write(f"newmtl {mat_name}\n")
            f_mtl.write(f"Ka 1.0 1.0 1.0\n")
            diff = mat['diffuse']
            f_mtl.write(f"Kd {diff[0]:.4f} {diff[1]:.4f} {diff[2]:.4f}\n")
            f_mtl.write(f"d {diff[3]:.4f}\n")
            f_mtl.write(f"illum 2\n")
            tex_idx = mat['texIndex']
            if 0 <= tex_idx < len(textures):
                tex_file = textures[tex_idx]['filename']
                f_mtl.write(f"map_Kd ../textures/{tex_file}\n")
            f_mtl.write("\n")

    # Write OBJ
    with open(obj_path, 'w') as f_obj:
        f_obj.write(f"# Phantasy Star Online Authentic Stage Geometry\n")
        f_obj.write(f"mtllib {mtl_filename}\n\n")
        
        v_offset = 1

        for mesh_idx, mesh in enumerate(importer.meshes_data):
            positions = mesh['positions']
            normals = mesh['normals']
            uvs = mesh['uvs']
            triangles = mesh['triangles']
            mat_idx = mesh['mat_index']
            mat_name = importer.materials_data[mat_idx]['name']

            f_obj.write(f"g mesh_{mesh_idx}\n")
            f_obj.write(f"usemtl {mat_name}\n")

            for pos in positions:
                f_obj.write(f"v {pos[0]:.4f} {pos[1]:.4f} {pos[2]:.4f}\n")
            for uv in uvs:
                f_obj.write(f"vt {uv[0]:.4f} {uv[1]:.4f}\n")
            for norm in normals:
                f_obj.write(f"vn {norm[0]:.4f} {norm[1]:.4f} {norm[2]:.4f}\n")

            for i in range(0, len(triangles), 3):
                t0 = triangles[i] + v_offset
                t1 = triangles[i+1] + v_offset
                t2 = triangles[i+2] + v_offset
                f_obj.write(f"f {t0}/{t0}/{t0} {t1}/{t1}/{t1} {t2}/{t2}/{t2}\n")

            v_offset += len(positions)
            f_obj.write("\n")

    total_v = v_offset - 1
    total_t = sum(len(m['triangles'])//3 for m in importer.meshes_data)
    print(f"-> Exported {obj_path} ({total_v} vertices, {total_t} triangles, {len(importer.materials_data)} materials)")

def extract_all():
    scene_dir = os.path.join("pso_raw_data", "data", "scene")
    tex_dir = os.path.join("public", "models", "textures")
    zone_dir = os.path.join("public", "models", "zones")
    os.makedirs(tex_dir, exist_ok=True)
    os.makedirs(zone_dir, exist_ok=True)

    stage_mappings = [
        # (rel_name, xvm_name, out_name)
        ("map_city00_00n.rel", "map_city00.xvm", "pioneer2-city"),
        ("map_lobby_01n.rel", "map_lobby_01.xvm", "visual-lobby"),
        ("map_lobby_02n.rel", "map_lobby_02.xvm", "visual-lobby-festive"),
        ("map_aforest01n.rel", "map_forest01.xvm", "forest-01"),
        ("map_aforest02n.rel", "map_forest02.xvm", "forest-02"),
        ("map_cave01_00n.rel", "map_cave01.xvm", "caves-01"),
        ("map_cave02_00n.rel", "map_cave02.xvm", "caves-02"),
        ("map_cave03_00n.rel", "map_cave03.xvm", "caves-03"),
        ("map_machine01_00n.rel", "map_machine01.xvm", "mines-01"),
        ("map_machine02_00n.rel", "map_machine02.xvm", "mines-02"),
        ("map_ruins01_00n.rel", "map_ruins01.xvm", "ruins-01"),
        ("map_ruins02_00n.rel", "map_ruins02.xvm", "ruins-02"),
        ("map_labo00_00n.rel", "map_labo00.xvm", "pioneer2-lab"),
        ("map_space01_00n.rel", "map_space01.xvm", "vr-spaceship"),
        ("map_jungle01_00n.rel", "map_jungle01.xvm", "cca-jungle-mountain"),
        ("map_seabed01_00n.rel", "map_seabed01.xvm", "seabed-01"),
        ("map_crater01_00n.rel", "map_crater01.xvm", "crater-interior"),
        ("map_desert01_00n.rel", "map_desert01.xvm", "subterranean-desert"),
        # Boss Arenas
        ("map_dragon00n.rel", "map_dragon00.xvm", "boss-dragon"),
        ("map_de_ral_le00n.rel", "map_de_ral_le00.xvm", "caves-derolle"),
        ("map_vol_opt00n.rel", "map_vol_opt00.xvm", "boss-vol-opt"),
        ("map_darkfalz00n.rel", "map_darkfalz00.xvm", "boss-dark-falz"),
        ("map_gryphon00n.rel", "map_gryphon00.xvm", "boss-gryphon"),
        ("map_olgaflow00n.rel", "map_olgaflow00.xvm", "boss-olga-flow"),
        ("map_saint00n.rel", "map_saint00.xvm", "boss-saint-million"),
    ]

    for rel_name, xvm_name, out_name in stage_mappings:
        rel_path = os.path.join(scene_dir, rel_name)
        xvm_path = os.path.join(scene_dir, xvm_name)
        
        if not os.path.exists(rel_path):
            print(f"Skipping {rel_name} (not found)")
            continue

        print(f"\n==========================================")
        print(f"Processing Stage: {out_name} ({rel_name})")
        print(f"==========================================")

        # 1. Decode Textures
        textures = []
        if os.path.exists(xvm_path):
            with open(xvm_path, 'rb') as f:
                raw_xvm = f.read()
            loaded_tex = xvr_load(raw_xvm)
            print(f"Decoded {len(loaded_tex)} textures from {xvm_name}")
            prefix = out_name.replace("-", "_")
            for idx, tex in enumerate(loaded_tex):
                fname = f"{prefix}_{idx:03d}.png"
                out_png = os.path.join(tex_dir, fname)
                if not os.path.exists(out_png):
                    try:
                        img = Image.frombytes('RGBA', (tex['width'], tex['height']), tex['pixels'])
                        img.save(out_png)
                    except Exception as e:
                        print(f"Error saving texture {fname}: {e}")
                textures.append({'filename': fname, 'width': tex['width'], 'height': tex['height']})

        # 2. Decode Geometry
        with open(rel_path, 'rb') as f:
            rel_data = f.read()

        imp = NinjaDCRelImporter()
        imp.setTextures(textures)
        imp.parse(None, rel_data)

        out_base = os.path.join(zone_dir, out_name)
        export_stage(imp, textures, out_base)

if __name__ == '__main__':
    extract_all()
