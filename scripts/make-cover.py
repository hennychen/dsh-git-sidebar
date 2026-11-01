#!/usr/bin/env python3
"""Render README/social covers for dsh-git-sidebar.

Outputs (1280-wide or square):
  docs/cover.png         1280x640   GitHub social preview / README banner
  docs/cover-3x2.png     1200x800   3:2 (press, slides, marketplace cards)
  docs/cover-square.png  1080x1080  square (social avatars, chat previews)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys

S = 2  # supersample factor

PING = "/System/Library/AssetsV2/com_apple_MobileAsset_Font7/3419f2a427639ad8c8e139149a287865a90fa17e.asset/AssetData/PingFang.ttc"
HELV = "/System/Library/Fonts/HelveticaNeue.ttc"
MENLO = "/System/Library/Fonts/Menlo.ttc"

BG_TOP, BG_BOTTOM = (10, 14, 21), (13, 21, 32)
CARD, CARD_BORDER = (15, 20, 27), (42, 48, 56)
TEXT, TEXT_DIM, TEXT_FAINT = (201, 209, 217), (139, 148, 158), (110, 118, 129)
BLUE, GREEN, ORANGE, PURPLE, WHITE = (88, 166, 255), (63, 185, 80), (210, 153, 34), (188, 140, 255), (255, 255, 255)
CHIP_BG = (18, 24, 33)


def ping(size, weight="regular"):
    return ImageFont.truetype(PING, max(1, round(size * S)), index={"light": 15, "regular": 3, "medium": 7, "semibold": 11}[weight])


def helv(size, bold=False):
    return ImageFont.truetype(HELV, max(1, round(size * S)), index=1 if bold else 0)


def menlo(size, bold=False):
    return ImageFont.truetype(MENLO, max(1, round(size * S)), index=1 if bold else 0)


class Canvas:
    def __init__(self, width, height):
        self.w, self.h = width, height
        self.img = Image.new("RGB", (width * S, height * S), BG_TOP)
        self.draw = ImageDraw.Draw(self.img)
        for y in range(height * S):
            t = y / (height * S)
            self.draw.line([(0, y), (width * S, y)],
                           fill=tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))
        glow = Image.new("RGBA", (width * S, height * S), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse(
            [width * S - 0.61 * width * S, -0.66 * height * S, width * S + 0.12 * width * S, 0.66 * height * S],
            fill=(31, 111, 235, 46))
        self.img = Image.alpha_composite(self.img.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(0.086 * width * S))).convert("RGB")
        self.draw = ImageDraw.Draw(self.img)

    def text(self, x, y, s, font, fill, anchor="la"):
        self.draw.text((x * S, y * S), s, font=font, fill=fill, anchor=anchor)

    def rrect(self, box, radius, fill=None, outline=None, width=1):
        self.draw.rounded_rectangle([box[0] * S, box[1] * S, box[2] * S, box[3] * S],
                                    radius=radius * S, fill=fill, outline=outline, width=max(1, int(width * S)))

    def width(self, s, font):
        return self.draw.textlength(s, font=font) / S

    def truncate(self, s, font, max_width):
        if self.width(s, font) <= max_width:
            return s
        out = ""
        for ch in s:
            if self.width(out + ch + "…", font) > max_width:
                return out + "…"
            out += ch
        return out

    def chevron(self, x, y, size, color):
        self.draw.polygon([(x * S, (y - size / 2) * S), ((x + size) * S, (y - size / 2) * S), ((x + size / 2) * S, (y + size / 2) * S)], fill=color)

    def line(self, x0, y0, x1, y1, color, width=1):
        self.draw.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=color, width=max(1, int(width * S)))

    def ellipse(self, cx, cy, r, color):
        self.draw.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=color)

    def save(self, path):
        out = self.img.resize((self.w, self.h), Image.LANCZOS)
        out.save(path, "PNG", optimize=True)
        print("wrote", path, out.size)


def branch_glyph(c, cx, cy, r, color, width=2):
    c.ellipse(cx, cy, r, color)
    c.ellipse(cx + r * 3.4, cy, r, color)
    c.ellipse(cx, cy + r * 3.4, r, color)
    c.line(cx, cy + r, cx, cy + r * 2.2, color, width)
    c.line(cx + r, cy + r * 1.1, cx + r * 3.4, cy + r * 1.1, color, width)


def brand(c, x, y, logo=44):
    c.rrect((x, y, x + logo, y + logo), round(logo * 0.3), fill=(31, 111, 235))
    branch_glyph(c, x + logo * 0.33, y + logo * 0.38, logo * 0.09, WHITE)
    c.text(x + logo + 20, y + logo / 2, "dsh-git-sidebar", menlo(logo * 0.45), TEXT, anchor="lm")


def headline(c, x, y, size):
    font = ping(size, "semibold")
    c.text(x, y, "Git", font, BLUE)
    c.text(x + c.width("Git", font) + size * 0.3, y, "源代码管理", font, (240, 246, 252))


def subtitle(c, x, y, size, lines):
    font = ping(size, "regular")
    for index, line in enumerate(lines):
        c.text(x, y + index * size * 1.45, line, font, TEXT_DIM)


def chips(c, x, y, rows, size, gap_x=10, gap_y=10):
    font = ping(size, "medium")
    for row in rows:
        cx = x
        for label in row:
            w = c.width(label, font)
            c.rrect((cx, y, cx + w + size * 1.9, y + size * 2), size, fill=CHIP_BG, outline=CARD_BORDER, width=1)
            c.text(cx + size * 0.95, y + size, label, font, TEXT, anchor="lm")
            cx += w + size * 1.9 + gap_x
        y += size * 2 + gap_y


def badges(c, x, y, items):
    font = helv(13, True)
    cx = x
    for label, color in items:
        w = c.width(label, font)
        c.rrect((cx, y, cx + w + 28, y + 34), 17, fill=CHIP_BG, outline=CARD_BORDER, width=1)
        c.text(cx + 14, y + 17, label, font, color, anchor="lm")
        cx += w + 28 + 10
    return cx


def panel(c, x0, y0, k=1.0):
    """The SCM panel mock, authored at 510x528 and scaled by k."""
    W, H = 510 * k, 528 * k

    def X(v):
        return x0 + v * k

    def Y(v):
        return y0 + v * k

    c.rrect((X(0), Y(0), X(510), Y(528)), 16 * k, fill=CARD, outline=CARD_BORDER, width=1)
    c.text(X(22), Y(26), "源代码管理", ping(15 * k, "medium"), TEXT_DIM, anchor="lm")
    c.line(X(0), Y(46), X(510), Y(46), CARD_BORDER, 1)

    def section(y, label, count):
        c.chevron(X(24), Y(y), 7 * k, TEXT_DIM)
        font = ping(14 * k, "semibold")
        c.text(X(38), Y(y), label, font, TEXT, anchor="lm")
        c.text(X(38) + c.width(label, font) + 8 * k, Y(y), str(count), menlo(11 * k), TEXT_DIM, anchor="lm")

    section(72, "存储库", 5)

    def repo_row(y, name, branch, ab):
        c.rrect((X(28), Y(y) - 6 * k, X(39), Y(y) + 7 * k), 2 * k, outline=TEXT_DIM, width=1)
        c.text(X(48), Y(y), name, menlo(13.5 * k), TEXT, anchor="lm")
        bw = c.width(branch, menlo(11 * k))
        pill_x = X(510 - 170 - 40) - bw
        c.rrect((pill_x, Y(y) - 10 * k, pill_x + bw + 44 * k, Y(y) + 10 * k), 10 * k, fill=(22, 27, 34), outline=CARD_BORDER, width=1)
        branch_glyph(c, pill_x + 11 * k, Y(y) - 4 * k, 2.1 * k, TEXT_DIM, 1.4 * k)
        c.text(pill_x + 25 * k, Y(y), branch, menlo(11 * k), TEXT_DIM, anchor="lm")
        c.text(X(510 - 150), Y(y), ab, menlo(10.5 * k), TEXT_FAINT, anchor="lm")
        for index in range(3):
            c.ellipse(X(510 - 52 + index * 7), Y(y), 1.5 * k, TEXT_FAINT)

    repo_row(100, "PathFinder-Voice-Server", "v1.1.9", "")
    repo_row(126, "PathFinder_Single", "v1.1.6", "·2")
    repo_row(152, "MapToki", "v1.4.3", "·4")
    repo_row(178, "OpenViking", "main", "↓111")

    section(208, "更改", 3)
    c.rrect((X(22), Y(226), X(488), Y(288)), 6 * k, fill=(11, 15, 22), outline=(60, 68, 78), width=1)
    c.text(X(34), Y(244), "消息（按 ⌘Enter 提交到 v1.1.9）", ping(11 * k, "regular"), TEXT_FAINT, anchor="lm")
    c.rrect((X(414), Y(266), X(478), Y(282)), 4 * k, fill=(31, 111, 235))
    c.text(X(446), Y(274), "提交", ping(10 * k, "medium"), WHITE, anchor="mm")

    def file_row(y, letter, color, name, directory):
        c.text(X(26), Y(y), letter, menlo(12 * k, True), color, anchor="lm")
        c.text(X(44), Y(y), name, menlo(13 * k), TEXT, anchor="lm")
        c.text(X(44) + c.width(name, menlo(13 * k)) + 14 * k, Y(y), directory, menlo(10.5 * k), TEXT_FAINT, anchor="lm")

    file_row(310, "M", ORANGE, "client.js", "plugins/dsh-git-sidebar")
    file_row(334, "U", GREEN, "docs/panel.png", "")
    file_row(358, "M", ORANGE, "index.js", "plugins/dsh-git-sidebar")

    section(388, "图形", 80)
    graph = [
        (BLUE, "e616150", "docs: v1049 tag 锚点与部署记录", "v1.1.9"),
        (BLUE, "94621f5", "docs: 订正 v1049 活体时间戳", ""),
        (GREEN, "a7296c2", "docs: 现网验证（探针 12/12）", ""),
        (PURPLE, "8090434", "feat(speaker): 删除两段式", ""),
    ]
    gy = 402
    for index, (color, sha, subject, ref) in enumerate(graph):
        cx = X(30)
        c.line(cx, Y(gy - 11), cx, Y(gy + 11), color, 1.8 * k)
        c.ellipse(X(30), Y(gy), 3.2 * k, color)
        c.text(X(46), Y(gy), sha, menlo(10 * k), BLUE, anchor="lm")
        if ref:
            rw = c.width(ref, menlo(9 * k))
            c.rrect((X(510 - 34) - rw - 14 * k, Y(gy) - 8 * k, X(476), Y(gy) + 8 * k), 6 * k, outline=CARD_BORDER, width=1)
            c.text(X(510 - 41) - rw, Y(gy), ref, menlo(9 * k), TEXT_DIM, anchor="lm")
        c.text(X(104), Y(gy), c.truncate(subject, ping(10.5 * k), 330 * k), ping(10.5 * k, "regular"),
               TEXT if index < 3 else TEXT_DIM, anchor="lm")
        gy += 22

    for label, bx in (("获取", (22, 82)), ("拉取", (90, 150))):
        c.rrect((X(bx[0]), Y(488), X(bx[1]), Y(510)), 4 * k, outline=CARD_BORDER, width=1)
        c.text(X((bx[0] + bx[1]) / 2), Y(499), label, ping(10 * k, "regular"), TEXT_DIM, anchor="mm")
    c.rrect((X(432), Y(488), X(488), Y(510)), 4 * k, fill=(31, 111, 235))
    c.text(X(460), Y(499), "推送", ping(10 * k, "medium"), WHITE, anchor="mm")


def render_wide(path):
    c = Canvas(1280, 640)
    brand(c, 72, 62)
    headline(c, 72, 150, 54)
    subtitle(c, 72, 224, 23, ["VS Code 式多存储库 · DeepSeek Harness 右侧边栏"])
    chips(c, 72, 286, [["多存储库切换", "内联 diff", "SVG 提交图形"], ["暂存 / 提交 / 分支", "拉取 / 推送 / 同步"]], 15)
    panel(c, 700, 56, 1.0)
    badges(c, 72, 532, [("Apache-2.0", TEXT_DIM), ("dsh-plugin", BLUE)])
    c.text(316, 549, "github.com/hennychen/dsh-git-sidebar", menlo(13), TEXT_FAINT, anchor="lm")
    c.text(72, 600, "dsh plugin add github:hennychen/dsh-git-sidebar", menlo(13), (110, 118, 129))
    c.save(path)


def render_3x2(path):
    c = Canvas(1200, 800)
    brand(c, 64, 58, 46)
    headline(c, 64, 152, 56)
    subtitle(c, 64, 232, 23, ["VS Code 式多存储库 · DeepSeek Harness 右侧边栏"])
    chips(c, 64, 296, [["多存储库切换", "内联 diff", "SVG 提交图形"], ["暂存 / 提交 / 分支", "拉取 / 推送 / 同步"]], 15)
    panel(c, 646, 128, 1.0)
    badges(c, 64, 692, [("Apache-2.0", TEXT_DIM), ("dsh-plugin", BLUE)])
    c.text(300, 709, "github.com/hennychen/dsh-git-sidebar", menlo(13), TEXT_FAINT, anchor="lm")
    c.text(64, 748, "dsh plugin add github:hennychen/dsh-git-sidebar", menlo(13), (110, 118, 129))
    c.save(path)


def render_square(path):
    c = Canvas(1080, 1080)
    brand(c, 72, 72, 48)
    headline(c, 72, 176, 50)
    subtitle(c, 72, 250, 22, ["VS Code 式多存储库", "DeepSeek Harness 右侧边栏"])
    chips(c, 72, 330, [["多存储库切换", "内联 diff"], ["暂存 / 提交 / 分支", "SVG 提交图形"]], 14)
    panel(c, 500, 300, 1.0)
    badges(c, 72, 918, [("Apache-2.0", TEXT_DIM), ("dsh-plugin", BLUE)])
    c.text(72, 972, "github.com/hennychen/dsh-git-sidebar", menlo(13), TEXT_FAINT)
    c.text(72, 1008, "dsh plugin add github:hennychen/dsh-git-sidebar", menlo(13), (110, 118, 129))
    c.save(path)


if __name__ == "__main__":
    outdir = sys.argv[1] if len(sys.argv) > 1 else "docs"
    os.makedirs(outdir, exist_ok=True)
    render_wide(os.path.join(outdir, "cover.png"))
    render_3x2(os.path.join(outdir, "cover-3x2.png"))
    render_square(os.path.join(outdir, "cover-square.png"))
