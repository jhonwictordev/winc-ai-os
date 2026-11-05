"""High-precision extraction of WINC Master AI character with transparent background.
Preserves cyan rim light, dark purple hood, visor reflections, and full character detail.
Generates reactive visor glow layers for HyperFrames-compatible real-time animation.
"""

import numpy as np
from PIL import Image, ImageFilter
from collections import deque
from pathlib import Path

SRC_IMAGE = Path(r"C:\Users\winc\.gemini\antigravity\brain\189eecd7-e93a-48ca-b615-7a23a9301d4f\.user_uploaded\media_1793855933528_0141b88c.jpg")
BRAND_DIR = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\brand")
FRONTEND_PUBLIC = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\frontend\public\brand")
FRONTEND_ASSETS = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\frontend\src\assets")
ARTIFACT_DIR = Path(r"C:\Users\winc\.gemini\antigravity\brain\189eecd7-e93a-48ca-b615-7a23a9301d4f")

for d in [BRAND_DIR, FRONTEND_PUBLIC, FRONTEND_ASSETS]:
    d.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC_IMAGE).convert("RGBA")
w, h = img.size
arr = np.array(img, dtype=np.float32)

# Estimate background color from outer borders
border_pixels = np.concatenate([
    arr[0, :, :3],
    arr[-1, :, :3],
    arr[:, 0, :3],
    arr[:, -1, :3]
], axis=0)
bg_color = np.median(border_pixels, axis=0)
print(f"Detected background color: RGB({bg_color[0]:.1f}, {bg_color[1]:.1f}, {bg_color[2]:.1f})")

# Calculate Euclidean color distance from background
color_diff = np.sqrt(np.sum((arr[:, :, :3] - bg_color) ** 2, axis=2))

# Thresholds for exterior background vs character
T_BG = 14.0   # Definitely background
T_FG = 34.0   # Definitely character

# Flood-fill BFS from all four corners to mark only exterior background
visited = np.zeros((h, w), dtype=bool)
is_exterior = np.zeros((h, w), dtype=bool)
queue = deque()

# Initialize queue with boundary pixels
for x in range(w):
    for y in [0, h - 1]:
        if color_diff[y, x] <= T_FG:
            visited[y, x] = True
            is_exterior[y, x] = True
            queue.append((y, x))

for y in range(h):
    for x in [0, w - 1]:
        if not visited[y, x] and color_diff[y, x] <= T_FG:
            visited[y, x] = True
            is_exterior[y, x] = True
            queue.append((y, x))

# 4-connectivity flood fill
while queue:
    cy, cx = queue.popleft()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
            visited[ny, nx] = True
            if color_diff[ny, nx] <= T_FG:
                is_exterior[ny, nx] = True
                queue.append((ny, nx))

# Compute smooth alpha channel
alpha = np.ones((h, w), dtype=np.float32) * 255.0

# Pixels marked exterior background get 0 alpha or soft feathered alpha near boundary
for y in range(h):
    for x in range(w):
        if is_exterior[y, x]:
            d = color_diff[y, x]
            if d <= T_BG:
                alpha[y, x] = 0.0
            else:
                # Smooth cosine or linear ramp between T_BG and T_FG
                t = (d - T_BG) / (T_FG - T_BG)
                alpha[y, x] = t * 255.0

# Construct RGBA output
out_arr = np.copy(arr)
out_arr[:, :, 3] = alpha
out_img = Image.fromarray(out_arr.astype(np.uint8), mode="RGBA")

# Find bounding box of non-transparent content
bbox = out_img.getbbox()
print(f"Character bounding box: {bbox}")

# Crop with clean padding
padding = 16
left = max(0, bbox[0] - padding)
top = max(0, bbox[1] - padding)
right = min(w, bbox[2] + padding)
bottom = min(h, bbox[3] + padding)
cropped = out_img.crop((left, top, right, bottom))

# Save main avatar
out_filename = "winc_master_avatar.png"
paths = [
    BRAND_DIR / out_filename,
    FRONTEND_PUBLIC / out_filename,
    FRONTEND_ASSETS / out_filename,
    ARTIFACT_DIR / out_filename
]
for p in paths:
    cropped.save(p, "PNG")
    print(f"Saved: {p} ({cropped.width}x{cropped.height})")

# Generate glowing visor layer for audio-reactive animation (states: speaking, listening, thinking)
# The visor is in the upper head area of the character
c_arr = np.array(cropped, dtype=np.uint8)
visor_mask = np.zeros((cropped.height, cropped.width, 4), dtype=np.uint8)

# Visor region is roughly in the top 15% to 35% height and center 30% to 70% width
head_y1, head_y2 = int(cropped.height * 0.14), int(cropped.height * 0.38)
head_x1, head_x2 = int(cropped.width * 0.28), int(cropped.width * 0.72)

for y in range(head_y1, head_y2):
    for x in range(head_x1, head_x2):
        r, g, b, a = c_arr[y, x]
        # Visor pixels have purple/magenta glow or deep dark visor surface with high red/blue ratio
        if a > 100:
            if (r > 60 and b > 80 and g < 60) or (r > 120 and b > 140):
                # Isolate visor reflection
                visor_mask[y, x] = [180, 50, 255, min(255, int(a * 1.2))]

visor_img = Image.fromarray(visor_mask, mode="RGBA").filter(ImageFilter.GaussianBlur(radius=3))
visor_path = FRONTEND_PUBLIC / "winc_visor_glow.png"
visor_img.save(visor_path, "PNG")
visor_img.save(BRAND_DIR / "winc_visor_glow.png", "PNG")
print(f"Saved visor glow asset: {visor_path}")
