# Generates icon-180.png and icon-512.png: a white podium on teal. Run: python3 make_icons.py
from PIL import Image, ImageDraw
for size in (180, 512):
    img = Image.new('RGB', (size, size), '#0b6e8a')
    d = ImageDraw.Draw(img)
    u = size / 18
    base = size * 0.76
    for x0, h in ((3, 4), (7, 7), (11, 2.6)):   # 2nd, 1st, 3rd
        d.rectangle([x0 * u, base - h * u, (x0 + 4) * u - u * 0.3, base], fill='white')
    d.rounded_rectangle([size * 0.42, size * 0.18, size * 0.58, size * 0.27], radius=size * 0.03, fill='#f6c453')
    img.save(f'icon-{size}.png')
