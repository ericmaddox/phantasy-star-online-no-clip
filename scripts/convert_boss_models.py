import os
import glob
from pso_format_parser import NinjaChunkParser

def convert_bosses():
    models_dir = os.path.join("public", "models", "zones")
    unpacked = os.path.join("pso_raw_data", "unpacked")

    boss_files = glob.glob(os.path.join(unpacked, "bm_boss*.bml"))
    print(f"Found {len(boss_files)} boss BML files.")
    for bf in boss_files:
        name = os.path.basename(bf).replace(".bml", "")
        with open(bf, 'rb') as f:
            data = f.read()
        verts, normals, indices = NinjaChunkParser.parse_rel(data)
        if verts:
            out_path = os.path.join(models_dir, f"{name}.obj")
            NinjaChunkParser.export_obj(verts, normals, indices, out_path)

if __name__ == '__main__':
    convert_bosses()
