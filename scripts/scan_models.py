import os
import glob
import struct

def scan_all_for_models():
    all_files = glob.glob(os.path.join("pso_raw_data", "**", "*.*"), recursive=True)
    print(f"Scanning {len(all_files)} total files for 3D model geometry...")

    model_files = []
    for path in all_files:
        try:
            with open(path, 'rb') as f:
                head = f.read(128)
                if any(sig in head for sig in [b'NJST', b'NMDM', b'XJ', b'NJ', b'POF0', b'PVRT', b'GBIX']):
                    model_files.append((path, "Ninja Header", os.path.getsize(path)))
                elif path.endswith('.rel') or path.endswith('.bml') or path.endswith('.tam') or path.endswith('.xvm'):
                    model_files.append((path, "Model Archive", os.path.getsize(path)))
        except Exception:
            pass

    print(f"Found {len(model_files)} 3D model & asset files:")
    for path, kind, size in sorted(model_files, key=lambda x: x[2], reverse=True)[:50]:
        print(f" - [{kind}] {os.path.relpath(path)} ({size/1024:.1f} KB)")

if __name__ == '__main__':
    scan_all_for_models()
