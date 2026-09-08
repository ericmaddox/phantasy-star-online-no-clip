import os
import struct
import math
from PIL import Image
from extract_all_authentic_stages_full import xvr_load, BitStream

SCENE_DIR = os.path.join("pso_raw_data", "data", "scene")
TEX_DIR = os.path.join("public", "models", "textures")
ZONE_DIR = os.path.join("public", "models", "zones")

os.makedirs(TEX_DIR, exist_ok=True)
os.makedirs(ZONE_DIR, exist_ok=True)

CHUNK_VERTEX = list(range(32, 51))
CHUNK_STRIP = list(range(64, 76))
CHUNK_MATERIAL = list(range(17, 24))
CHUNK_TINY = [8, 9]

def parse_nj_sky(nj_data, tex_names=[]):
    """Parses authentic Sega Ninja Chunk model (*.nj, *.xj) sky geometry"""
    njcm_idx = nj_data.find(b'NJCM')
    if njcm_idx < 0:
        return None, None, None

    chunk_data = nj_data[njcm_idx + 8:]
    if len(chunk_data) < 52:
        return None, None, None

    # Read root NJS_OBJECT
    evalflags, model_ptr, px, py, pz, ax, ay, az, sx, sy, sz, child_ptr, sibling_ptr = struct.unpack_from('<IIfffiiifffII', chunk_data, 0)
    if model_ptr == 0 or model_ptr >= len(chunk_data):
        return None, None, None

    # Read NJS_MODEL
    vlist_ptr, plist_ptr, cx, cy, cz, radius = struct.unpack_from('<IIffff', chunk_data, model_ptr)
    
    vertices = []
    normals = []
    
    # 1. Parse Vertex Chunks
    if vlist_ptr > 0 and vlist_ptr < len(chunk_data):
        vpos = vlist_ptr
        while vpos + 4 < len(chunk_data):
            ch = chunk_data[vpos]
            if ch == 255: # End
                break
            cf = chunk_data[vpos+1]
            if ch in CHUNK_VERTEX:
                vsize, vofs, vcnt = struct.unpack_from('<HHH', chunk_data, vpos+2)
                vpos += 8
                has_norm = (ch in [41, 42, 43, 44, 45, 46, 47, 48, 49, 50])
                is_sh = (ch in [32, 33])
                has_color = (ch in [35, 42, 49])
                
                for _ in range(vcnt):
                    if vpos + 12 > len(chunk_data): break
                    x, y, z = struct.unpack_from('<fff', chunk_data, vpos); vpos += 12
                    if is_sh: vpos += 4
                    if has_color: vpos += 4
                    
                    vertices.append((x + px, y + py, z + pz))
                    if has_norm:
                        if vpos + 12 <= len(chunk_data):
                            nx, ny, nz = struct.unpack_from('<fff', chunk_data, vpos); vpos += 12
                            normals.append((nx, ny, nz))
                        else:
                            normals.append((0.0, 1.0, 0.0))
                    else:
                        normals.append((0.0, 1.0, 0.0))
            else:
                vpos += 2

    # 2. Parse Strip / Polygon Chunks
    meshes = []
    current_mat = {'tex_id': 0, 'diffuse': (1.0, 1.0, 1.0, 1.0)}

    if plist_ptr > 0 and plist_ptr < len(chunk_data):
        ppos = plist_ptr
        while ppos + 4 < len(chunk_data):
            ch = chunk_data[ppos]
            cf = chunk_data[ppos+1]
            if ch == 255: # End
                break
            if ch in CHUNK_TINY:
                body, = struct.unpack_from('<H', chunk_data, ppos+2)
                current_mat['tex_id'] = body & 0x1fff
                ppos += 4
            elif ch in CHUNK_MATERIAL:
                size, = struct.unpack_from('<H', chunk_data, ppos+2)
                ppos += 4 + size * 2
            elif ch in CHUNK_STRIP:
                body, = struct.unpack_from('<H', chunk_data, ppos+2)
                strip_cnt = body & 0x3fff
                user_ofs = body >> 14
                has_uv = (ch in [65, 66, 68, 69, 71, 72, 74, 75])
                has_norm = (ch in [67, 68, 69])
                ppos += 4

                tri_indices = []
                tri_uvs = []
                for _ in range(strip_cnt):
                    if ppos + 2 > len(chunk_data): break
                    slen_raw, = struct.unpack_from('<h', chunk_data, ppos); ppos += 2
                    cw = slen_raw < 0
                    slen = abs(slen_raw)
                    strip_verts = []
                    for _ in range(slen):
                        if ppos + 2 > len(chunk_data): break
                        v_idx, = struct.unpack_from('<H', chunk_data, ppos); ppos += 2
                        u, v = 0.0, 0.0
                        if has_uv:
                            if ppos + 4 <= len(chunk_data):
                                u_raw, v_raw = struct.unpack_from('<hh', chunk_data, ppos); ppos += 4
                                u, v = u_raw / 256.0, 1.0 - (v_raw / 256.0)
                        if has_norm:
                            ppos += 12
                        if user_ofs > 0:
                            ppos += user_ofs * 2
                        strip_verts.append((v_idx, (u, v)))

                    for k in range(len(strip_verts) - 2):
                        if cw and k % 2 == 0:
                            a, b, c = strip_verts[k], strip_verts[k+2], strip_verts[k+1]
                        elif cw:
                            a, b, c = strip_verts[k+1], strip_verts[k+2], strip_verts[k]
                        elif k % 2 == 0:
                            a, b, c = strip_verts[k], strip_verts[k+1], strip_verts[k+2]
                        else:
                            a, b, c = strip_verts[k], strip_verts[k+2], strip_verts[k+1]
                        tri_indices.extend([a[0], b[0], c[0]])
                        tri_uvs.extend([a[1], b[1], c[1]])

                if tri_indices:
                    meshes.append({
                        'indices': tri_indices,
                        'uvs': tri_uvs,
                        'tex_id': current_mat['tex_id']
                    })
            else:
                ppos += 2

    return vertices, normals, meshes

def export_sky_obj_mtl(vertices, normals, meshes, tex_names, out_base_path):
    obj_path = f"{out_base_path}.obj"
    mtl_path = f"{out_base_path}.mtl"
    mtl_filename = os.path.basename(mtl_path)

    # 1. Write MTL
    with open(mtl_path, 'w', encoding='utf-8') as f_mtl:
        f_mtl.write("# Phantasy Star Online Authentic Sky Material\n\n")
        seen_mats = set()
        for m in meshes:
            tid = m['tex_id']
            mat_name = f"mat_sky_{tid:02d}"
            if mat_name in seen_mats: continue
            seen_mats.add(mat_name)
            
            f_mtl.write(f"newmtl {mat_name}\n")
            f_mtl.write("Ka 1.0 1.0 1.0\n")
            f_mtl.write("Kd 1.0 1.0 1.0\n")
            f_mtl.write("Ks 0.0 0.0 0.0\n")
            f_mtl.write("d 1.0\n")
            f_mtl.write("illum 1\n")
            
            if tid < len(tex_names) and tex_names[tid]:
                tex_file = tex_names[tid]
                f_mtl.write(f"map_Kd ../textures/{tex_file}\n")
            f_mtl.write("\n")

    # 2. Write OBJ
    with open(obj_path, 'w', encoding='utf-8') as f_obj:
        f_obj.write("# Phantasy Star Online Authentic Sky Geometry\n")
        f_obj.write(f"mtllib {mtl_filename}\n\n")

        for v in vertices:
            f_obj.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        for n in normals:
            f_obj.write(f"vn {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}\n")

        # Collect all UVs
        all_uvs = []
        for m in meshes:
            all_uvs.extend(m['uvs'])
        for uv in all_uvs:
            f_obj.write(f"vt {uv[0]:.4f} {uv[1]:.4f}\n")

        uv_cursor = 1
        for m_idx, m in enumerate(meshes):
            tid = m['tex_id']
            mat_name = f"mat_sky_{tid:02d}"
            f_obj.write(f"\ng mesh_sky_{m_idx}\n")
            f_obj.write(f"usemtl {mat_name}\n")

            indices = m['indices']
            for i in range(0, len(indices), 3):
                i0 = indices[i] + 1
                i1 = indices[i+1] + 1
                i2 = indices[i+2] + 1
                u0 = uv_cursor
                u1 = uv_cursor + 1
                u2 = uv_cursor + 2
                uv_cursor += 3
                f_obj.write(f"f {i0}/{u0}/{i0} {i1}/{u1}/{i1} {i2}/{u2}/{i2}\n")

    total_tris = sum(len(m['indices'])//3 for m in meshes)
    print(f"Exported {obj_path}: {len(vertices)} verts, {total_tris} tris, {len(meshes)} meshes")

def main():
    sky_mappings = [
        ("map_forest01s.nj", "map_forest01s.xvm", "sky-forest-01"),
        ("map_forest02s.nj", "map_forest02s.xvm", "sky-forest-02"),
        ("map_ancient01_00s.nj", "map_ancient01_00s.xvm", "sky-vr-temple"),
        ("map_space01_00s.nj", "map_space01_00s.xvm", "sky-vr-spaceship"),
        ("map_jungle01_00s.nj", "map_jungle01_00s.xvm", "sky-cca-jungle-mountain"),
        ("map_seabed01_00s.nj", "map_seabed01_00s.xvm", "sky-seabed-01"),
        ("map_crater01_00s.nj", "map_crater01_00s.xvm", "sky-crater-interior"),
        ("map_wilds01_00s.nj", "map_wilds01_00s.xvm", "sky-subterranean-desert"),
        ("map_boss05s.nj", "map_boss05s.xvm", "sky-boss-dark-falz"),
        ("map_boss08s.nj", "map_boss08s.xvm", "sky-boss-olga-flow"),
        ("map_cave01_00s.nj", "map_cave01_00s.xvm", "sky-caves-01"),
        ("map_cave02_00s.nj", "map_cave02_00s.xvm", "sky-caves-02"),
        ("map_cave03_00s.nj", "map_cave03_00s.xvm", "sky-caves-03"),
        ("map_machine01_00s.nj", "map_machine01_00s.xvm", "sky-mines-01"),
        ("map_machine02_00s.nj", "map_machine02_00s.xvm", "sky-mines-02"),
        ("map_ruins02_00s.nj", "map_ruins02_00s.xvm", "sky-ruins-01"),
        ("map_ruins02_00s.nj", "map_ruins02_00s.xvm", "sky-ruins-02"),
        ("map_forest01s.nj", "map_boss01.xvm", "sky-boss-dragon"),
        ("map_cave01_00s.nj", "map_boss02.xvm", "sky-caves-derolle"),
        ("map_machine01_00s.nj", "map_boss03.xvm", "sky-boss-vol-opt"),
        ("map_ancient01_00s.nj", "map_boss06.xvm", "sky-boss-gol-dragon"),
        ("map_jungle01_00s.nj", "map_boss07.xvm", "sky-boss-gryphon"),
        ("map_crater01_00s.nj", "map_boss09.xvm", "sky-boss-saint-million"),
        ("map_forest01s.nj", "map_city00.xvm", "sky-pioneer2-city"),
        ("map_space01_00s.nj", "map_lobby_01.xvm", "sky-visual-lobby"),
        ("map_ancient01_00s.nj", "map_lobby_02.xvm", "sky-visual-lobby-festive"),
        ("map_space01_00s.nj", "map_labo00.xvm", "sky-pioneer2-lab"),
    ]

    print("=== Extracting 100% Authentic PSO 3D Sky Meshes & Textures ===")
    for nj_name, xvm_name, out_name in sky_mappings:
        nj_p = os.path.join(SCENE_DIR, nj_name)
        xvm_p = os.path.join(SCENE_DIR, xvm_name)
        if not os.path.exists(nj_p):
            print(f"[SKIP] {nj_name} not found")
            continue

        with open(nj_p, 'rb') as f:
            nj_data = f.read()

        # Extract textures
        tex_names = []
        if os.path.exists(xvm_p):
            with open(xvm_p, 'rb') as f:
                xvm_data = f.read()
            raw_texs = xvr_load(xvm_data)
            for idx, tex in enumerate(raw_texs[:12]):
                tex_file = f"sky_{out_name.replace('-', '_')}_{idx:02d}.png"
                out_tex_path = os.path.join(TEX_DIR, tex_file)
                if not os.path.exists(out_tex_path):
                    try:
                        img = Image.frombytes('RGBA', (tex['width'], tex['height']), tex['pixels'])
                        img.save(out_tex_path)
                    except Exception as e:
                        print(f"Error saving texture: {e}")
                tex_names.append(tex_file)

        # Parse geometry
        verts, norms, meshes = parse_nj_sky(nj_data, tex_names)
        if verts and meshes:
            out_base = os.path.join(ZONE_DIR, out_name)
            export_sky_obj_mtl(verts, norms, meshes, tex_names, out_base)

if __name__ == '__main__':
    main()
