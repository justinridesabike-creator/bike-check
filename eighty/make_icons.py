# Generates icon-180.png and icon-512.png: "80%" in white on purple. Run: python3 make_icons.py
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for f in ['/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default(size)

for size in (180, 512):
    img = Image.new('RGB', (size, size), '#6d28d9')
    d = ImageDraw.Draw(img)
    f = font(int(size * 0.36))
    box = d.textbbox((0, 0), '80%', font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((size - w) / 2 - box[0], (size - h) / 2 - box[1] - size * 0.04), '80%', font=f, fill='white')
    # A short bar under the text, like the zone line.
    y = size * 0.72
    d.rounded_rectangle([size * 0.25, y, size * 0.75, y + size * 0.05], radius=size * 0.025, fill='#f87171')
    img.save(f'icon-{size}.png')
