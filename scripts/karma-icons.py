#!/usr/bin/env python3
"""KARMA brand asset generator — extracts the bronze medallion from the client's
logo photo and produces header/splash art + full PWA icon set."""
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import os

ROOT = "/home/z/my-project"
SRC = os.path.join(ROOT, "upload", "pasted_image_1794062747214.png")
ICONS = os.path.join(ROOT, "public", "icons")
IMAGES = os.path.join(ROOT, "public", "images")

# --- medallion geometry in the source photo (1380x752) ---
CX, CY, R = 695, 380, 360  # circle center + radius (outer rope ring)

NAVY_CENTER = (20, 41, 79)    # #14294F
NAVY_EDGE = (8, 20, 44)       # #08142C
GOLD = (201, 162, 39)         # #C9A227
GOLD_LIGHT = (232, 200, 96)


def radial_bg(size: int) -> Image.Image:
    """Deep navy radial gradient square."""
    img = Image.new("RGB", (size, size), NAVY_EDGE)
    px = img.load()
    c = (size - 1) / 2
    maxd = (size * 0.7071) ** 0.5
    for y in range(size):
        for x in range(size):
            d = (((x - c) ** 2 + (y - c) ** 2) ** 0.5) / (size * 0.7071)
            d = min(1.0, d) ** 1.1
            px[x, y] = tuple(int(NAVY_CENTER[i] + (NAVY_EDGE[i] - NAVY_CENTER[i]) * d) for i in range(3))
    return img


def extract_medallion(out_size: int = 512) -> Image.Image:
    """Crop the medallion circle from the photo, mask to RGBA circle."""
    im = Image.open(SRC).convert("RGB")
    box = (CX - R, CY - R, CX + R, CY + R)
    medal = im.crop(box).resize((out_size * 2, out_size * 2), Image.LANCZOS)  # supersample
    # anti-aliased circular mask (supersampled, slight edge feather)
    mask = Image.new("L", (out_size * 2, out_size * 2), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((3, 3, out_size * 2 - 3, out_size * 2 - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    medal.putalpha(mask)
    return medal.resize((out_size, out_size), Image.LANCZOS)


def draw_rings(img: Image.Image, outer_frac: float, width_frac: float, color, w: int) -> None:
    d = ImageDraw.Draw(img)
    s = img.size[0]
    pad = int(s * (1 - outer_frac) / 2)
    d.ellipse((pad, pad, s - pad, s - pad), outline=color, width=w)
    # thin inner accent ring
    pad2 = pad + int(s * width_frac)
    d.ellipse((pad2, pad2, s - pad2, s - pad2), outline=color + (90,) if len(color) == 3 else color, width=max(1, w // 3))


def make_icon(size: int, medal_frac: float, rings: bool) -> Image.Image:
    bg = radial_bg(size).convert("RGBA")
    medal = extract_medallion(512)
    mw = int(size * medal_frac)
    m = medal.resize((mw, mw), Image.LANCZOS)
    # soft drop shadow under the medal
    sh = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shd = ImageDraw.Draw(sh)
    mpad = (size - mw) // 2
    shd.ellipse((mpad + 6, mpad + 10, mpad + mw + 6, mpad + mw + 10), fill=(0, 0, 0, 140))
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    bg = Image.alpha_composite(bg, sh)
    bg.alpha_composite(m, (mpad, mpad))
    if rings:
        draw_rings(bg, 0.97, 0.028, GOLD, max(3, int(size * 0.012)))
    return bg


def quantize_save(img: Image.Image, path: str, colors: int = 256) -> None:
    """Palette-quantize to keep PWA icons light (RGBA-safe)."""
    if img.mode == "RGBA":
        a = img.getchannel("A")
        rgb = img.convert("RGB")
        # quantize on a white-composite to avoid palette alpha (PA) issues
        comp = Image.composite(rgb, Image.new("RGB", rgb.size, (255, 255, 255)), a)
        q = comp.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).convert("RGB")
        q.putalpha(a)
        q.save(path, optimize=True)
    else:
        img.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT).save(path, optimize=True)


def main():
    os.makedirs(ICONS, exist_ok=True)
    os.makedirs(IMAGES, exist_ok=True)

    # 1) transparent medallion for header chip + splash animation
    quantize_save(extract_medallion(512), os.path.join(IMAGES, "karma-medal.png"))
    quantize_save(extract_medallion(192), os.path.join(IMAGES, "karma-medal-192.png"))

    # 2) PWA icons
    quantize_save(make_icon(512, 0.84, True), os.path.join(ICONS, "icon-512.png"))
    quantize_save(make_icon(192, 0.84, True), os.path.join(ICONS, "icon-192.png"))
    quantize_save(make_icon(512, 0.66, False), os.path.join(ICONS, "icon-512-maskable.png"))
    quantize_save(make_icon(180, 0.84, True), os.path.join(ICONS, "apple-touch-icon.png"))

    # 3) favicon (32 + 16 combined ico)
    fav32 = make_icon(32, 0.9, False).convert("RGBA")
    fav16 = make_icon(16, 0.9, False).convert("RGBA")
    fav32.save(os.path.join(ROOT, "src", "app", "icon.png"), optimize=True)  # Next auto-favicon

    print("KARMA assets written:")
    for p in ["public/images/karma-medal.png", "public/images/karma-medal-192.png",
              "public/icons/icon-512.png", "public/icons/icon-192.png",
              "public/icons/icon-512-maskable.png", "public/icons/apple-touch-icon.png",
              "src/app/icon.png"]:
        fp = os.path.join(ROOT, p)
        print(f"  {p} — {os.path.getsize(fp)//1024} KB")


if __name__ == "__main__":
    main()
