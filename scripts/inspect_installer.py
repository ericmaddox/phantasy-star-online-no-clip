import urllib.request

url = "https://files.pioneer2.net/Ephinea_PSOBB_Installer.exe"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-65535'})
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        data = response.read()
        print(f"Read {len(data)} bytes")
        if b"Inno Setup" in data:
            print("Detected: Inno Setup Installer!")
        elif b"Nullsoft" in data:
            print("Detected: NSIS Installer!")
        elif b"7z" in data or b"7-Zip" in data:
            print("Detected: 7-Zip SFX Archive!")
        else:
            print("First 100 bytes ascii:", bytes([b if 32 <= b < 127 else 46 for b in data[:100]]).decode('ascii'))
except Exception as e:
    print("Error:", e)
