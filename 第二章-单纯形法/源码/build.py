"""把 index.html + engine.js + problems.js + Tailwind/Lucide 打包成一个可离线双击打开的 HTML。
用法：python build.py [输出路径]   默认输出 dist/单纯形法习题演算.html
"""
import pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).parent
CACHE = ROOT / "vendor"
VENDOR = {
    "https://cdn.tailwindcss.com/3.4.17": "tailwind-3.4.17.js",
    "https://unpkg.com/lucide@0.344.0/dist/umd/lucide.min.js": "lucide-0.344.0.min.js",
}


def fetch(url, name):
    f = CACHE / name
    if not f.exists():
        CACHE.mkdir(exist_ok=True)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http": "http://127.0.0.1:7897", "https": "http://127.0.0.1:7897"}))
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        f.write_bytes(opener.open(req, timeout=60).read())
    return f.read_text(encoding="utf-8")


def inline(code):
    return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"


html = (ROOT / "index.html").read_text(encoding="utf-8")
for url, name in VENDOR.items():
    html = html.replace(f'<script src="{url}"></script>', inline(fetch(url, name)))
for name in ("engine.js", "problems.js"):
    html = html.replace(f'<script src="{name}"></script>', inline((ROOT / name).read_text(encoding="utf-8")))
assert not re.search(r'<script src=', html), "还有未内联的脚本"
head = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
html = head + html.replace("<style>", "<style>\n[hidden]{display:none!important}\nbody{margin:0}", 1) + "\n</html>\n"
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "单纯形法习题演算.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, f"{out.stat().st_size / 1024:.0f} KB")
