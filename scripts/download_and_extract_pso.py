import os
import sys
import subprocess
import urllib.request
import struct

INSTALLER_URL = "https://files.pioneer2.net/Ephinea_PSOBB_Installer.exe"
DEST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pso_raw_data")
INSTALLER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Ephinea_PSOBB_Installer.exe")

def download_file(url: str, dest: str):
    if os.path.exists(dest) and os.path.getsize(dest) > 800 * 1024 * 1024:
        print(f"Installer already downloaded at {dest} ({os.path.getsize(dest)/(1024*1024):.1f} MB)")
        return

    print(f"Downloading PSOBB client from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(dest, 'wb') as out_f:
        total_size = int(response.headers.get('Content-Length', 0))
        downloaded = 0
        chunk_size = 1024 * 1024 # 1MB
        last_percent = -1
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            out_f.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                percent = int(downloaded * 100 / total_size)
                if percent != last_percent and percent % 10 == 0:
                    print(f"Download Progress: {percent}% ({downloaded/(1024*1024):.1f} MB / {total_size/(1024*1024):.1f} MB)")
                    last_percent = percent
    print("Download completed successfully!")

def extract_nsis(installer_path: str, target_dir: str):
    os.makedirs(target_dir, exist_ok=True)
    print(f"Extracting NSIS installer to {target_dir}...")
    # NSIS silent extraction: /S /D=target_dir (Note: /D must be the last argument and have no quotes)
    cmd = [installer_path, "/S", f"/D={target_dir}"]
    print("Running:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Installer finished with returncode:", res.returncode)

if __name__ == '__main__':
    print("=== Phantasy Star Online Client Fetcher ===")
    os.makedirs(os.path.dirname(INSTALLER_PATH), exist_ok=True)
    download_file(INSTALLER_URL, INSTALLER_PATH)
    extract_nsis(INSTALLER_PATH, os.path.abspath(DEST_DIR))
