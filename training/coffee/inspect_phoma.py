
from pathlib import Path
import random
from PIL import Image, ImageOps
import matplotlib.pyplot as plt

PROJECT_ROOT = Path(__file__).resolve().parents[2]
COFFEE_ROOT = PROJECT_ROOT / "dataset" / "Coffee"
OUTPUT = PROJECT_ROOT / "training" / "coffee" / "phoma_sample_grid.jpg"

random.seed(42)
extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

phoma_folders = [
    folder for folder in COFFEE_ROOT.rglob("*")
    if folder.is_dir() and "phoma" in folder.name.lower()
]

images = []
for folder in phoma_folders:
    images.extend(
        path for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in extensions
    )

images = sorted(set(images))

if not images:
    print("No Phoma images found. Check the Coffee dataset folders.")
    raise SystemExit(1)

samples = random.sample(images, min(15, len(images)))

columns = 3
rows = (len(samples) + columns - 1) // columns
fig, axes = plt.subplots(rows, columns, figsize=(12, rows * 3))
axes = list(axes.flat) if hasattr(axes, "flat") else [axes]

for ax, path in zip(axes, samples):
    try:
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            ax.imshow(image)
        ax.set_title(path.name[:30], fontsize=8)
        ax.axis("off")
    except Exception as exc:
        ax.set_title(f"Cannot open: {path.name[:20]}", fontsize=8)
        ax.axis("off")

for ax in axes[len(samples):]:
    ax.axis("off")

plt.tight_layout()
plt.savefig(OUTPUT, dpi=120)
plt.close()

print(f"Phoma images found: {len(images)}")
print(f"Images displayed: {len(samples)}")
print(f"Saved grid to: {OUTPUT}")
