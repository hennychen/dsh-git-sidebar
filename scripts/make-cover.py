#!/usr/bin/env python3
"""Render the social/README cover image for dsh-git-sidebar (1280x640)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys

S = 2
W, H = 1280 * S, 640 * S

PING = "/System/Library/AssetsV2/com_apple_MobileAsset_Font7/3419f2a427639ad8c8e139149a287865a90fa17e.asset/AssetData/PingFang.ttc"
HELV = "/System/Library/Fonts/HelveticaNeue.ttc"
MENLO = "/System/Library/Fonts/Menlo.ttc"

def ping(size, weight="regular"):
    return ImageFont.truetype(PING, size * S, index={"light": 15, "regular": 3, "medium": 7, "semibold": 11}[weight])

def helv(size, bold=False):
    return ImageFont.truetype(HELV, size * S, index=1 if bold else 0)

def menlo(size, bold=False):
    return ImageFont.truetype(MENLO, size * S, index=1 if bold else 0)

BG_TOP, BG_BOTTOM = (10, 14, 21), (13, 21, 32)
CARD, CARD_BORDER = (15, 20, 27), (42, 48, 56)
TEXT, TEXT_DIM, TEXT_FAINT = (201, 209, 217), (139, 148, 158), (110, 118, 129)
BLUE, GREEN, ORANGE, PURPLE, WHITE = (88, 166, 255), (63, 185, 80), (210, 153, 34), (188, 140, 255), (255, 255, 255)

img = Image.new("RGB", (W, H), BG_TOP)
draw = ImageDraw.Draw(img)
for y in range(H):
    t = y / H
    draw.line([(0, y), (W, y)], fill=tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))

glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse([W - 780 * S, -420 * S, W + 160 * S, 420 * S], fill=(31, 111, 235, 46))
img = Image.alpha_composite(img.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(110 * S))).convert("RGB")
draw = ImageDraw.Draw(img)

def text(x, y, s, font, fill, anchor="la"):
    draw.text((x * S, y * S), s, font=font, fill=fill, anchor=anchor)

def rrect(box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle([box[0] * S, box[1] * S, box[2] * S, box[3] * S], radius=radius * S, fill=fill, outline=outline, width=width * S)

def width_of(s, font):
    return draw.textlength(s, font=font) / S

def truncate(s, font, max_width):
    if width_of(s, font) <= max_width:
        return s
    out = ""
    for ch in s:
        if width_of(out + ch + "…", font) > max_width:
            return out + "…"
        out += ch
    return out

def chevron(x, y, size, color):
    draw.polygon([((x) * S, (y - size / 2) * S), ((x + size) * S, (y - size / 2) * S), ((x + size / 2) * S, (y + size / 2) * S)], fill=color)

def chip(x, y, label, font, fg=TEXT):
    w = width_of(label, font)
    rrect((x, y, x + w + 28, y + 30), 15, fill=(18, 24, 33), outline=CARD_BORDER, width=1)
    text(x + 14, y + 15, label, font, fg, anchor="lm")
    return x + w + 38

def branch_glyph(cx, cy, r, color, w=2):
    draw.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=color)
    draw.ellipse([(cx + r * 3.4 - r) * S, (cy - r) * S, (cx + r * 3.4 + r) * S, (cy + r) * S], fill=color)
    draw.ellipse([(cx - r) * S, (cy + r * 3.4 - r) * S, (cx + r) * S, (cy + r * 3.4 + r) * S], fill=color)
    draw.line([(cx) * S, (cy + r) * S, (cx) * S, (cy + r * 2.2) * S], fill=color, width=int(w * S))
    draw.line([(cx + r) * S, (cy + r * 1.1) * S, (cx + r * 3.4) * S, (cy + r * 1.1) * S], fill=color, width=int(w * S))

def doc_glyph(x, y, color):
    rrect((x, y - 6, x + 11, y + 7), 2, outline=color, width=1)

# ---------- left ----------
rrect((72, 62, 122, 112), 13, fill=(31, 111, 235))
branch_glyph(87, 79, 4, WHITE)
text(136, 87, "dsh-git-sidebar", menlo(20), TEXT, anchor="lm")

title_font = ping(54, "semibold")
git_w = width_of("Git", title_font)
text(72, 150, "Git", title_font, BLUE)
text(72 + git_w + 16, 150, "源代码管理", title_font, (240, 246, 252))
text(72, 224, "VS Code 式多存储库 · DeepSeek Harness 右侧边栏", ping(23, "regular"), TEXT_DIM)

y = 286
for row in (["多存储库切换", "内联 diff", "SVG 提交图形"], ["暂存 / 提交 / 分支", "拉取 / 推送 / 同步"]):
    x = 72
    for label in row:
        x = chip(x, y, label, ping(15, "medium"))
    y += 40

rrect((72, 532, 196, 566), 17, fill=(18, 24, 33), outline=CARD_BORDER, width=1)
text(84, 549, "Apache-2.0", helv(13, True), TEXT_DIM, anchor="lm")
rrect((206, 532, 296, 566), 17, fill=(18, 24, 33), outline=CARD_BORDER, width=1)
text(218, 549, "dsh-plugin", helv(13, True), (88, 166, 255), anchor="lm")
text(316, 549, "github.com/hennychen/dsh-git-sidebar", menlo(13), TEXT_FAINT, anchor="lm")
text(72, 600, "dsh plugin add github:hennychen/dsh-git-sidebar", menlo(13), (110, 118, 129))

# ---------- right panel ----------
PX0, PY0, PX1, PY1 = 700, 56, 1210, 584
rrect((PX0, PY0, PX1, PY1), 16, fill=CARD, outline=CARD_BORDER, width=1)
text(PX0 + 22, PY0 + 26, "源代码管理", ping(15, "medium"), TEXT_DIM, anchor="lm")
draw.line([(PX0) * S, (PY0 + 46) * S, (PX1) * S, (PY0 + 46) * S], fill=CARD_BORDER, width=int(1 * S))

def section(y, label, count):
    chevron(PX0 + 24, y, 7, TEXT_DIM)
    text(PX0 + 38, y, label, ping(14, "semibold"), TEXT, anchor="lm")
    text(PX0 + 38 + width_of(label, ping(14, "semibold")) + 8, y, str(count), menlo(11), TEXT_DIM, anchor="lm")

section(PY0 + 72, "存储库", 5)

def repo_row(y, name, branch, ab):
    doc_glyph(PX0 + 28, y, TEXT_DIM)
    text(PX0 + 48, y, name, menlo(13.5), TEXT, anchor="lm")
    bw = width_of(branch, menlo(11))
    pill_x = PX1 - 170 - bw - 40
    rrect((pill_x, y - 10, pill_x + bw + 44, y + 10), 10, fill=(22, 27, 34), outline=CARD_BORDER, width=1)
    branch_glyph(pill_x + 11, y - 4, 2.1, TEXT_DIM, 1.4)
    text(pill_x + 25, y, branch, menlo(11), TEXT_DIM, anchor="lm")
    text(PX1 - 150, y, ab, menlo(10.5), TEXT_FAINT, anchor="lm")
    for k in range(3):
        draw.ellipse([(PX1 - 52 + k * 7) * S, (y - 1.5) * S, (PX1 - 49 + k * 7) * S, (y + 1.5) * S], fill=TEXT_FAINT)

repo_row(PY0 + 100, "PathFinder-Voice-Server", "v1.1.9", "")
repo_row(PY0 + 126, "PathFinder_Single", "v1.1.6", "·2")
repo_row(PY0 + 152, "MapToki", "v1.4.3", "·4")
repo_row(PY0 + 178, "OpenViking", "main", "↓111")

section(PY0 + 208, "更改", 3)

# commit box
rrect((PX0 + 22, PY0 + 226, PX1 - 22, PY0 + 288), 6, fill=(11, 15, 22), outline=(60, 68, 78), width=1)
text(PX0 + 34, PY0 + 244, "消息（按 ⌘Enter 提交到 v1.1.9）", ping(11, "regular"), TEXT_FAINT, anchor="lm")
rrect((PX1 - 96, PY0 + 266, PX1 - 32, PY0 + 282), 4, fill=(31, 111, 235))
text(PX1 - 64, PY0 + 274, "提交", ping(10, "medium"), WHITE, anchor="mm")

def file_row(y, letter, color, name, directory):
    text(PX0 + 26, y, letter, menlo(12, True), color, anchor="lm")
    text(PX0 + 44, y, name, menlo(13), TEXT, anchor="lm")
    text(PX0 + 44 + width_of(name, menlo(13)) + 14, y, directory, menlo(10.5), TEXT_FAINT, anchor="lm")

file_row(PY0 + 310, "M", ORANGE, "client.js", "plugins/dsh-git-sidebar")
file_row(PY0 + 334, "U", GREEN, "docs/panel.png", "")
file_row(PY0 + 358, "M", ORANGE, "index.js", "plugins/dsh-git-sidebar")

section(PY0 + 388, "图形", 80)

graph_rows = [
    (BLUE, "e616150", "docs: v1049 tag 锚点与部署记录", "v1.1.9"),
    (BLUE, "94621f5", "docs: 订正 v1049 活体时间戳", ""),
    (GREEN, "a7296c2", "docs: 现网验证（探针 12/12）", ""),
    (PURPLE, "8090434", "feat(speaker): 删除两段式", ""),
]
gy = PY0 + 402
for index, (color, sha, subject, ref) in enumerate(graph_rows):
    cx = PX0 + 30
    draw.line([(cx) * S, (gy - 11) * S, (cx) * S, (gy + 15) * S], fill=color, width=int(1.8 * S))
    draw.ellipse([(cx - 3.2) * S, (gy - 3.2) * S, (cx + 3.2) * S, (gy + 3.2) * S], fill=color)
    text(PX0 + 46, gy, sha, menlo(10), BLUE, anchor="lm")
    if ref:
        rw = width_of(ref, menlo(9))
        rrect((PX1 - 34 - rw - 14, gy - 8, PX1 - 34, gy + 8), 6, outline=CARD_BORDER, width=1)
        text(PX1 - 41 - rw, gy, ref, menlo(9), TEXT_DIM, anchor="lm")
        subject_width = width_of(subject, ping(10.5))
    else:
        subject_width = 0
    text(PX0 + 104, gy, truncate(subject, ping(10.5), 330), ping(10.5, "regular"), TEXT if index < 3 else TEXT_DIM, anchor="lm")
    gy += 22

rrect((PX0 + 22, PY1 - 40, PX0 + 82, PY1 - 18), 4, outline=CARD_BORDER, width=1)
text(PX0 + 52, PY1 - 29, "获取", ping(10, "regular"), TEXT_DIM, anchor="mm")
rrect((PX0 + 90, PY1 - 40, PX0 + 150, PY1 - 18), 4, outline=CARD_BORDER, width=1)
text(PX0 + 120, PY1 - 29, "拉取", ping(10, "regular"), TEXT_DIM, anchor="mm")
rrect((PX1 - 78, PY1 - 40, PX1 - 22, PY1 - 18), 4, fill=(31, 111, 235))
text(PX1 - 50, PY1 - 29, "推送", ping(10, "medium"), WHITE, anchor="mm")

img = img.resize((1280, 640), Image.LANCZOS)
out = sys.argv[1] if len(sys.argv) > 1 else "cover.png"
img.save(out, "PNG", optimize=True)
print("wrote", out, img.size)
