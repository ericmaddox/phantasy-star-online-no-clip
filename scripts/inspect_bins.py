import os
import struct
from pso_format_parser import PrsDecompressor

def inspect_bin_archive(bin_path):
    print(f"\n--- Inspecting {os.path.basename(bin_path)} (Size: {os.path.getsize(bin_path)} bytes) ---")
    with open(bin_path, 'rb') as f:
        data = f.read()

    # Check magic header
    magic = data[:4]
    print(f"Magic header: {magic}")
    
    # Try PRS decompression
    try:
        decomp = PrsDecompressor.decompress(data)
        print(f"PRS decompressed size: {len(decomp)} bytes")
        data = decomp
    except Exception as e:
        print(f"PRS decompress failed: {e}")

    # Check if AFS or GSL or Ninja chunk archive
    if data.startswith(b'AFS\x00'):
        num_files = struct.unpack('<I', data[4:8])[0]
        print(f"AFS Archive with {num_files} subfiles!")
    elif data.startswith(b'GSL\x00') or data.startswith(b'\x00\x00\x00\x00'):
        print(f"Checking potential table at start: {data[:32]}")

    # Scan for float coordinates
    coords = 0
    for i in range(0, len(data) - 12, 4):
        try:
            x, y, z = struct.unpack('<fff', data[i:i+12])
            if -3000 < x < 3000 and -1000 < y < 1000 and -3000 < z < 3000:
                if abs(x) > 1.0 or abs(y) > 1.0 or abs(z) > 1.0:
                    coords += 1
        except Exception:
            pass
    print(f"Found {coords} plausible 3D coordinates in file.")

bins = [
    'pso_raw_data/data/map_city_off_j.bin',
    'pso_raw_data/data/map_forest_j.bin',
    'pso_raw_data/data/map_cave_j.bin',
    'pso_raw_data/data/map_machine_j.bin',
    'pso_raw_data/data/map_ancient_j.bin',
    'pso_raw_data/data/map_jungle_j.bin'
]

for b in bins:
    if os.path.exists(b):
        inspect_bin_archive(b)
