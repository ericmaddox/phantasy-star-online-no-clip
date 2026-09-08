import os
import glob
import struct
from pso_format_parser import NinjaChunkParser, PrsDecompressor

SCENE_DIR = os.path.join("pso_raw_data", "data", "scene")
OUTPUT_DIR = os.path.join("public", "models", "zones")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ZONE_MAP = {
    "pioneer2-city": ["map_city00_00n.rel", "map_acity00_00n.rel"],
    "visual-lobby": ["map_lobby_01n.rel"],
    "visual-lobby-festive": ["map_lobby_02n.rel"],
    "forest-01": ["map_forest01_00n.rel", "map_aforest01n.rel"],
    "forest-02": ["map_forest02_00n.rel", "map_aforest02n.rel"],
    "caves-01": ["map_cave01_00n.rel", "map_acave01_00n.rel"],
    "caves-02": ["map_cave02_00n.rel", "map_acave02_00n.rel"],
    "caves-03": ["map_cave03_00n.rel", "map_acave03_00n.rel"],
    "mines-01": ["map_machine01_00n.rel", "map_amachine01_00n.rel"],
    "mines-02": ["map_machine02_00n.rel", "map_amachine02_00n.rel"],
    "ruins-01": ["map_ruins01_00n.rel", "map_ancient01_00n.rel", "map_aancient01_00n.rel"],
    "ruins-02": ["map_ruins02_00n.rel", "map_ancient02_00n.rel", "map_aancient02_00n.rel"],
    "pioneer2-lab": ["map_labo00_00n.rel"],
    "vr-spaceship": ["map_space01_00n.rel"],
    "cca-jungle-mountain": ["map_jungle01_00n.rel", "map_jungle02_00n.rel", "map_jungle05_00n.rel"],
    "seabed-01": ["map_seabed01_00n.rel", "map_seabed02_00n.rel"],
    "crater-interior": ["map_crater01_00n.rel", "map_wilds01_00n.rel"],
    "subterranean-desert": ["map_desert01_00n.rel", "map_desert03_00n.rel"],
}

def convert_all():
    print("=== Converting All Real PSO Levels from data/scene ===")
    
    # 1. Convert all named zone targets
    for zone_id, rel_candidates in ZONE_MAP.items():
        converted = False
        for candidate in rel_candidates:
            rel_path = os.path.join(SCENE_DIR, candidate)
            if not os.path.exists(rel_path):
                # Search recursively in SCENE_DIR or raw data
                matches = glob.glob(os.path.join("pso_raw_data", "**", candidate), recursive=True)
                if matches:
                    rel_path = matches[0]

            if os.path.exists(rel_path):
                print(f"Parsing authentic level: {zone_id} from {os.path.basename(rel_path)} ({os.path.getsize(rel_path)/1024:.1f} KB)...")
                with open(rel_path, 'rb') as f:
                    data = f.read()
                
                verts, normals, indices = NinjaChunkParser.parse_rel(data)
                if verts:
                    out_obj = os.path.join(OUTPUT_DIR, f"{zone_id}.obj")
                    NinjaChunkParser.export_obj(verts, normals, indices, out_obj)
                    converted = True
                    break

        if not converted:
            print(f"Warning: could not find candidate for {zone_id}")

    # 2. Convert all remaining scene rels so every single room variant is available
    all_scene_rels = glob.glob(os.path.join(SCENE_DIR, "*n.rel"))
    print(f"\nExporting all {len(all_scene_rels)} individual room variants...")
    for rel_path in all_scene_rels:
        base_name = os.path.basename(rel_path).replace(".rel", "")
        out_path = os.path.join(OUTPUT_DIR, f"{base_name}.obj")
        if not os.path.exists(out_path):
            with open(rel_path, 'rb') as f:
                data = f.read()
            verts, normals, indices = NinjaChunkParser.parse_rel(data)
            if verts:
                NinjaChunkParser.export_obj(verts, normals, indices, out_path)

if __name__ == '__main__':
    convert_all()
