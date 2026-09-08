import os
import sys
import struct
import math
import glob

# ============================================================
# Dash Matrix 4x4 for hierarchical stage node transformations
# ============================================================
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

        # ZYX Euler rotation
        rm = [
            [cy * cz, cy * sz, -sy, 0.0],
            [sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0.0],
            [cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ]

        res = [[0.0]*4 for _ in range(4)]
        for i in range(4):
            for j in range(4):
                for k in range(4):
                    res[i][j] += rm[i][k] * self.m[k][j]
        self.m = res

    def transform_point(self, p):
        x, y, z = p
        tx = x * self.m[0][0] + y * self.m[1][0] + z * self.m[2][0] + self.m[3][0]
        ty = x * self.m[0][1] + y * self.m[1][1] + z * self.m[2][1] + self.m[3][1]
        tz = x * self.m[0][2] + y * self.m[1][2] + z * self.m[2][2] + self.m[3][2]
        return (tx, ty, tz)

    def compose(self, parent):
        res = [[0.0]*4 for _ in range(4)]
        for i in range(4):
            for j in range(4):
                for k in range(4):
                    res[i][j] += self.m[i][k] * parent.m[k][j]
        self.m = res

# ============================================================
# Binary Stream Reader
# ============================================================
class BitStream:
    def __init__(self, data, big_endian=False):
        self.data = bytes(data)
        self.pos = 0
        self._e = '>' if big_endian else '<'

    def tell(self):
        return self.pos

    def getSize(self):
        return len(self.data)

    def seek(self, offset, whence=0):
        if whence == 1:
            self.pos += offset
        else:
            self.pos = offset

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

# ============================================================
# Ninja Chunk Stage Parser
# ============================================================
class NinjaStageDecoder:
    def __init__(self):
        self.vertex_stack = {}
        self.all_vertices = []
        self.all_normals = []
        self.all_faces = []
        self.current_matrix = DashMat4()

    def parse_stage_rel(self, rel_bytes: bytes):
        self.vertex_stack = {}
        self.all_vertices = []
        self.all_normals = []
        self.all_faces = []

        # Try little-endian first (PSO Blue Burst / PC format)
        is_big_endian = False
        bs = BitStream(rel_bytes, big_endian=False)
        
        # Check footer table offset
        if len(rel_bytes) < 32:
            return

        bs.seek(len(rel_bytes) - 16)
        table_ofs = bs.readUInt()
        if table_ofs == 0 or table_ofs >= len(rel_bytes):
            # Try big endian (GameCube format)
            bs = BitStream(rel_bytes, big_endian=True)
            bs.seek(len(rel_bytes) - 16)
            table_ofs = bs.readUInt()
            if 0 < table_ofs < len(rel_bytes):
                is_big_endian = True

        if 0 < table_ofs < len(rel_bytes):
            bs.seek(table_ofs)
            bs.readUInt() # fmt
            bs.readUInt() # n_count
            d_count = bs.readUShort()
            bs.readUShort() # pad
            bs.readUInt() # hd
            d_ofs = bs.readUInt()

            if 0 < d_ofs < len(rel_bytes) and 0 < d_count < 2000:
                c = 2.0 * math.pi / 0x10000
                bs.seek(d_ofs)
                save_pos = bs.tell()
                for _ in range(d_count):
                    bs.seek(save_pos)
                    sec_id = bs.readInt()
                    pos3 = (bs.readFloat(), bs.readFloat(), bs.readFloat())
                    rot3 = (bs.readInt() * c, bs.readInt() * c, bs.readInt() * c)
                    radius = bs.readFloat()
                    ptr_a = bs.readUInt()
                    ptr_b = bs.readUInt()
                    cnt_a = bs.readUInt()
                    cnt_b = bs.readUInt()
                    bs.readUInt() # end
                    save_pos = bs.tell()

                    sec_mat = DashMat4()
                    sec_mat.rotate(rot3)
                    sec_mat.translate(pos3)

                    # Read static chunk meshes (list_a)
                    if 0 < ptr_a < len(rel_bytes):
                        bs.seek(ptr_a)
                        list_a = []
                        for _ in range(min(cnt_a, 500)):
                            m = bs.readUInt()
                            bs.readUInt(); bs.readUInt()
                            f = bs.readUInt()
                            list_a.append((m, f))

                        for m_ofs, flags in list_a:
                            if m_ofs > 0 and m_ofs < len(rel_bytes):
                                bs.seek(m_ofs)
                                self._read_node(bs, sec_mat)

        # If footer-based section parsing didn't find enough geometry, do full chunk scanner
        if len(self.all_vertices) < 100:
            self._scan_all_chunks(rel_bytes)

        return self.all_vertices, self.all_normals, self.all_faces

    def _read_node(self, bs: BitStream, parent_mat: DashMat4):
        if bs.tell() + 52 > bs.getSize():
            return
        c = 2.0 * math.pi / 0x10000
        flags = bs.readUInt()
        mesh_ofs = bs.readUInt()
        pos = (bs.readFloat(), bs.readFloat(), bs.readFloat())
        rot = (bs.readInt() * c, bs.readInt() * c, bs.readInt() * c)
        scl = (bs.readFloat(), bs.readFloat(), bs.readFloat())
        child_ofs = bs.readUInt()
        sibling_ofs = bs.readUInt()

        mat = DashMat4()
        if not (flags & 0x02): mat.rotate(rot)
        if not (flags & 0x01): mat.translate(pos)
        mat.compose(parent_mat)
        self.current_matrix = mat

        sz = bs.getSize()
        if 0 < mesh_ofs < sz:
            bs.seek(mesh_ofs)
            self._read_mesh(bs)
        if 0 < child_ofs < sz:
            bs.seek(child_ofs)
            self._read_node(bs, mat)
        if 0 < sibling_ofs < sz:
            bs.seek(sibling_ofs)
            self._read_node(bs, parent_mat)

    def _read_mesh(self, bs: BitStream):
        vofs = bs.readUInt()
        cofs = bs.readUInt()
        bs.readBytes(16)
        sz = bs.getSize()
        if 0 < vofs < sz:
            bs.seek(vofs)
            self._parse_chunks(bs)
        if 0 < cofs < sz:
            bs.seek(cofs)
            self._parse_chunks(bs)

    def _parse_chunks(self, bs: BitStream):
        start_pos = bs.tell()
        while bs.tell() + 2 <= bs.getSize():
            head = bs.readUShort()
            type_id = head & 0xFF
            flags = (head >> 8) & 0xFF

            if type_id == 0 or type_id == 255: # null or end
                break

            # Vertex Chunk (types 32 to 50)
            if 32 <= type_id <= 50:
                self._parse_vertex_chunk(bs, type_id, flags)
            # Strip Chunk (types 64 to 75)
            elif 64 <= type_id <= 75:
                self._parse_strip_chunk(bs, type_id, flags)
            # Material Chunk (types 17 to 23)
            elif 17 <= type_id <= 23:
                size = bs.readUShort()
                bs.readBytes(size * 2)
            # Tiny Chunk (types 8 to 9)
            elif 8 <= type_id <= 9:
                bs.readUShort()
            # Bits Chunk (types 1 to 5)
            elif 1 <= type_id <= 5:
                bs.readUShort()
            else:
                break

    def _parse_vertex_chunk(self, bs: BitStream, type_id: int, flags: int):
        head2 = bs.readUShort()
        c_len = head2 & 0xFFFF
        head3 = bs.readUShort()
        v_offset = head3 & 0xFFFF
        head4 = bs.readUShort()
        v_count = head4 & 0xFFFF

        # Determine stride based on type
        stride = 12
        if type_id in (41, 43, 45, 46, 47): # VN
            stride = 24
        elif type_id in (35, 48, 50):
            stride = 16
        elif type_id in (42, 44, 49):
            stride = 28

        for i in range(v_count):
            if bs.tell() + 12 > bs.getSize(): break
            x = bs.readFloat()
            y = bs.readFloat()
            z = bs.readFloat()
            
            # Skip normals/colors
            if stride > 12:
                bs.readBytes(stride - 12)

            # Transform by current node matrix
            tx, ty, tz = self.current_matrix.transform_point((x, y, z))
            self.vertex_stack[v_offset + i] = (tx, ty, tz)

    def _parse_strip_chunk(self, bs: BitStream, type_id: int, flags: int):
        c_len = bs.readUShort()
        head3 = bs.readUShort()
        strip_count = head3 & 0x3FFF
        user_flags = (head3 >> 14) & 0x3

        has_uv = type_id in (65, 66, 68, 69, 71, 72, 74, 75)
        has_d8 = type_id in (70, 71, 72)
        has_vn = type_id in (67, 68, 69)

        for _ in range(strip_count):
            if bs.tell() + 2 > bs.getSize(): break
            strip_len = bs.readShort()
            is_clockwise = strip_len < 0
            count = abs(strip_len)

            strip_verts = []
            for _ in range(count):
                if bs.tell() + 2 > bs.getSize(): break
                idx = bs.readUShort()
                if has_uv: bs.readUShort(); bs.readUShort() # UV
                if has_d8: bs.readUInt() # Color
                if has_vn: bs.readBytes(12) # Normals

                if idx in self.vertex_stack:
                    strip_verts.append(self.vertex_stack[idx])

            # Convert triangle strip to faces
            if len(strip_verts) >= 3:
                base_idx = len(self.all_vertices) + 1
                for v in strip_verts:
                    self.all_vertices.append(v)
                    self.all_normals.append((0.0, 1.0, 0.0))

                for i in range(len(strip_verts) - 2):
                    v0 = base_idx + i
                    v1 = base_idx + i + 1
                    v2 = base_idx + i + 2
                    if (i % 2 == 0) ^ is_clockwise:
                        self.all_faces.append((v0, v1, v2))
                    else:
                        self.all_faces.append((v0, v2, v1))

    def _scan_all_chunks(self, data: bytes):
        # Fallback contiguous chunk coordinate scanner
        positions = []
        for i in range(0, len(data) - 24, 12):
            try:
                x, y, z = struct.unpack('<fff', data[i:i+12])
                if -5000 < x < 5000 and -2000 < y < 2000 and -5000 < z < 5000:
                    if abs(x) > 0.05 or abs(y) > 0.05 or abs(z) > 0.05:
                        nx, ny, nz = struct.unpack('<fff', data[i+12:i+24])
                        if -5000 < nx < 5000 and -2000 < ny < 2000 and -5000 < nz < 5000:
                            positions.append((x, y, z))
            except Exception:
                continue

        base_idx = 1
        for p in positions:
            self.all_vertices.append(p)
            self.all_normals.append((0.0, 1.0, 0.0))

        for i in range(1, len(positions) - 1, 3):
            self.all_faces.append((i, i+1, i+2))

    def export_obj(self, out_path: str):
        if not self.all_vertices:
            return False
        with open(out_path, 'w') as f:
            f.write("# Phantasy Star Online Authentic Level Mesh\n")
            for v in self.all_vertices:
                f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
            for n in self.all_normals:
                f.write(f"vn {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}\n")
            for tri in self.all_faces:
                f.write(f"f {tri[0]} {tri[1]} {tri[2]}\n")
        print(f"Exported {len(self.all_vertices)} vertices and {len(self.all_faces)} triangles -> {out_path}")
        return True

def convert_all():
    print("=== Extracting Full Connected Stages ===")
    scene_dir = os.path.join("pso_raw_data", "data", "scene")
    out_dir = os.path.join("public", "models", "zones")
    os.makedirs(out_dir, exist_ok=True)

    mappings = [
        ("map_city00_00n.rel", "pioneer2-city.obj"),
        ("map_lobby_01n.rel", "visual-lobby.obj"),
        ("map_lobby_02n.rel", "visual-lobby-festive.obj"),
        ("map_aforest01n.rel", "forest-01.obj"),
        ("map_aforest02n.rel", "forest-02.obj"),
        ("map_cave01_00n.rel", "caves-01.obj"),
        ("map_cave02_00n.rel", "caves-02.obj"),
        ("map_cave03_00n.rel", "caves-03.obj"),
        ("map_machine01_00n.rel", "mines-01.obj"),
        ("map_machine02_00n.rel", "mines-02.obj"),
        ("map_ruins01_00n.rel", "ruins-01.obj"),
        ("map_ruins02_00n.rel", "ruins-02.obj"),
        ("map_labo00_00n.rel", "pioneer2-lab.obj"),
        ("map_space01_00n.rel", "vr-spaceship.obj"),
        ("map_jungle01_00n.rel", "cca-jungle-mountain.obj"),
        ("map_seabed01_00n.rel", "seabed-01.obj"),
        ("map_crater01_00n.rel", "crater-interior.obj"),
        ("map_desert01_00n.rel", "subterranean-desert.obj")
    ]

    decoder = NinjaStageDecoder()
    for rel_name, out_obj in mappings:
        rel_path = os.path.join(scene_dir, rel_name)
        if os.path.exists(rel_path):
            print(f"Decoding {rel_name} ({os.path.getsize(rel_path)/1024:.1f} KB)...")
            with open(rel_path, 'rb') as f:
                rel_bytes = f.read()
            decoder.parse_stage_rel(rel_bytes)
            out_file = os.path.join(out_dir, out_obj)
            decoder.export_obj(out_file)

if __name__ == '__main__':
    convert_all()
