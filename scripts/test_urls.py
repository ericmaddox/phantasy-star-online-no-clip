import urllib.request

urls = [
    'https://files.pioneer2.net/ephinea/EphineaPSOSetup.exe',
    'https://patch.ephinea.pioneer2.net/patch.txt',
    'https://patch.ephinea.pioneer2.net/data.gsl',
    'https://patch.ephinea.pioneer2.net/data/map_city00_e.rel',
    'https://patch.ephinea.pioneer2.net/patchlist.txt'
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"{u}: {res.status}, Length: {res.headers.get('Content-Length', 'unknown')}")
    except Exception as e:
        print(f"{u}: Error -> {e}")
