import urllib.request
import re

url = "https://ephinea.pioneer2.net/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', html)
    print("Found links:")
    for l in set(links):
        if any(w in l.lower() for w in ['download', 'setup', 'exe', 'zip', 'file', 'register', 'pioneer']):
            print(" ->", l)
except Exception as e:
    print("Error:", e)
