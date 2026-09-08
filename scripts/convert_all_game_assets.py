import os
import glob
from pso_format_parser import PrsDecompressor, NinjaChunkParser

def inspect_and_convert():
    models_dir = os.path.join("public", "models", "zones")
    os.makedirs(models_dir, exist_ok=True)

    # 1. Convert authentic visual lobbies (map_lobby_01n.rel, etc.)
    lobby_files = glob.glob(os.path.join("pso_raw_data", "**", "map_lobby_*n.rel"), recursive=True)
    print(f"Found {len(lobby_files)} lobby render geometry files.")
    for lf in lobby_files:
        name = os.path.basename(lf).replace("n.rel", "")
        with open(lf, 'rb') as f:
            data = f.read()
        verts, normals, indices = NinjaChunkParser.parse_rel(data)
        out_path = os.path.join(models_dir, f"{name}.obj")
        NinjaChunkParser.export_obj(verts, normals, indices, out_path)

    # 2. Also map standard zone files
    zone_mappings = [
        ("map_lobby_01n.rel", "visual-lobby.obj"),
        ("map_lobby_02n.rel", "visual-lobby-festive.obj"),
        ("map_city", "pioneer2-city.obj"),
        ("map_forest", "forest-01.obj"),
        ("map_cave", "caves-01.obj"),
        ("map_ancient", "ruins-01.obj"),
        ("map_labo", "pioneer2-lab.obj"),
        ("map_jungle", "cca-jungle-mountain.obj"),
    ]

    all_raw = list(glob.glob(os.path.join("pso_raw_data", "**", "*.*"), recursive=True))
    for pattern, out_name in zone_mappings:
        matches = [f for f in all_raw if pattern in os.path.basename(f)]
        if matches:
            target = matches[0]
            print(f"Converting {pattern} ({target}) -> {out_name}")
            with open(target, 'rb') as f:
                raw_bytes = f.read()
            verts, normals, indices = NinjaChunkParser.parse_rel(raw_bytes)
            if verts:
                out_p = os.path.join(models_dir, out_name)
                NinjaChunkParser.export_obj(verts, normals, indices, out_p)

if __name__ == '__main__':
    inspect_and_convert()
