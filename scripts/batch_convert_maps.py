import os
import glob
from pso_format_parser import GslArchive, NinjaChunkParser, PrsDecompressor

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pso_raw_data")
OUTPUT_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "models", "zones")

MAP_IDS = [
    ("map_city00", "pioneer2-city"),
    ("map_forest01", "forest-01"),
    ("map_forest02", "forest-02"),
    ("map_cave01", "caves-01"),
    ("map_cave02", "caves-02"),
    ("map_cave03", "caves-03"),
    ("map_derolle", "caves-derolle"),
    ("map_machine01", "mines-01"),
    ("map_machine02", "mines-02"),
    ("map_volopt", "volopt"),
    ("map_ruin01", "ruins-01"),
    ("map_ruin02", "ruins-02"),
    ("map_ruin03", "ruins-03"),
    ("map_falz", "falz"),
    ("map_labo00", "pioneer2-lab"),
    ("map_temple01", "vr-temple"),
    ("map_space01", "vr-spaceship"),
    ("map_jungle01", "cca-jungle"),
    ("map_seabed01", "seabed-01"),
    ("map_tower01", "tower-01"),
    ("map_crater01", "crater-interior"),
    ("map_desert01", "subterranean-desert")
]

def process_all_maps():
    os.makedirs(OUTPUT_MODELS_DIR, exist_ok=True)

    # 1. Check if data.gsl exists
    gsl_path = os.path.join(RAW_DATA_DIR, "data.gsl")
    if not os.path.exists(gsl_path):
        # Look in subdirectories
        gsl_matches = glob.glob(os.path.join(RAW_DATA_DIR, "**", "data.gsl"), recursive=True)
        if gsl_matches:
            gsl_path = gsl_matches[0]

    unpacked_dir = os.path.join(RAW_DATA_DIR, "unpacked")
    if os.path.exists(gsl_path):
        print(f"Found GSL archive at {gsl_path}, extracting...")
        GslArchive.extract_all(gsl_path, unpacked_dir)

    # 2. Scan all .rel files in raw data and unpacked folders
    search_dirs = [RAW_DATA_DIR, unpacked_dir]
    for prefix, zone_key in MAP_IDS:
        found = False
        for sdir in search_dirs:
            if not os.path.exists(sdir):
                continue
            rel_files = glob.glob(os.path.join(sdir, "**", f"{prefix}*n.rel"), recursive=True)
            if not rel_files:
                rel_files = glob.glob(os.path.join(sdir, "**", f"{prefix}*.rel"), recursive=True)

            if rel_files:
                target_rel = rel_files[0]
                print(f"Converting authentic map {prefix} -> {target_rel}")
                with open(target_rel, 'rb') as f:
                    rel_data = f.read()

                verts, normals, indices = NinjaChunkParser.parse_rel(rel_data)
                out_obj = os.path.join(OUTPUT_MODELS_DIR, f"{zone_key}.obj")
                if NinjaChunkParser.export_obj(verts, normals, indices, out_obj):
                    found = True
                    break

        if not found:
            print(f"Notice: Map {prefix} not yet extracted, will use procedural geometry fallback.")

if __name__ == '__main__':
    process_all_maps()
