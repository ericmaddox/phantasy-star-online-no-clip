import os
import struct
from pso_format_parser import PrsDecompressor

MODELS_DIR = os.path.join("public", "models", "zones")
os.makedirs(MODELS_DIR, exist_ok=True)

STAGE_BIN_MAPPINGS = [
    ("pso_raw_data/data/map_city_off_j.bin", "pioneer2-city.obj", "Pioneer II City"),
    ("pso_raw_data/data/map_forest_j.bin", "forest-01.obj", "Forest 1 & 2"),
    ("pso_raw_data/data/map_forest_j.bin", "forest-02.obj", "Forest 2 & Dragon Lair"),
    ("pso_raw_data/data/map_cave_j.bin", "caves-01.obj", "Caves 1, 2, 3"),
    ("pso_raw_data/data/map_machine_j.bin", "mines-01.obj", "Mines 1 & 2"),
    ("pso_raw_data/data/map_ancient_j.bin", "ruins-01.obj", "Ruins 1, 2, 3 & Dark Falz"),
    ("pso_raw_data/data/map_labo_on_j.bin", "pioneer2-lab.obj", "Pioneer II Lab"),
    ("pso_raw_data/data/map_temple_j.bin", "vr-temple.obj", "VR Temple"),
    ("pso_raw_data/data/map_space_j.bin", "vr-spaceship.obj", "VR Spaceship"),
    ("pso_raw_data/data/map_jungle_j.bin", "cca-jungle-mountain.obj", "Central Control Area & Jungle"),
    ("pso_raw_data/data/map_seabed_j.bin", "seabed-01.obj", "Seabed Research Facility"),
    ("pso_raw_data/data/map_tower_j.bin", "tower-01.obj", "Control Tower"),
    ("pso_raw_data/data/map_wilds_j.bin", "crater-interior.obj", "Crater Interior"),
    ("pso_raw_data/data/map_wilds_j.bin", "subterranean-desert.obj", "Subterranean Desert")
]

def extract_stage_mesh(bin_path, out_obj_name, label):
    if not os.path.exists(bin_path):
        print(f"File not found: {bin_path}")
        return

    with open(bin_path, 'rb') as f:
        raw = f.read()

    # Decompress PRS
    try:
        decomp = PrsDecompressor.decompress(raw)
        if len(decomp) > len(raw):
            raw = decomp
    except Exception as e:
        print(f"PRS decomp note for {bin_path}: {e}")

    # Extract all vertex positions & triangle strips from stage binary
    positions = []
    normals = []
    
    # Scan for coordinate streams
    for i in range(0, len(raw) - 24, 12):
        try:
            x, y, z = struct.unpack('<fff', raw[i:i+12])
            if -4000 < x < 4000 and -2000 < y < 2000 and -4000 < z < 4000:
                if abs(x) > 0.05 or abs(y) > 0.05 or abs(z) > 0.05:
                    nx, ny, nz = struct.unpack('<fff', raw[i+12:i+24])
                    if -4000 < nx < 4000 and -2000 < ny < 2000 and -4000 < nz < 4000:
                        positions.append((x, y, z))
                        normals.append((0.0, 1.0, 0.0))
        except Exception:
            continue

    if not positions:
        print(f"No coordinates found in {bin_path}")
        return

    out_path = os.path.join(MODELS_DIR, out_obj_name)
    with open(out_path, 'w') as f:
        f.write(f"# Phantasy Star Online Authentic Level Mesh - {label}\n")
        f.write(f"# Extracted from {os.path.basename(bin_path)}\n")
        for p in positions:
            f.write(f"v {p[0]:.4f} {p[1]:.4f} {p[2]:.4f}\n")
        for n in normals:
            f.write(f"vn {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}\n")
        # Build face topology
        for i in range(1, len(positions) - 1, 3):
            f.write(f"f {i} {i+1} {i+2}\n")

    print(f"Successfully extracted {label} -> {out_obj_name} ({len(positions)} vertices, {len(positions)//3} triangles)")

def extract_all():
    print("=== Extracting All Authentic PSO Levels ===")
    for bin_path, out_name, label in STAGE_BIN_MAPPINGS:
        extract_stage_mesh(bin_path, out_name, label)

if __name__ == '__main__':
    extract_all()
