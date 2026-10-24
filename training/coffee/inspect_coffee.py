
from pathlib import Path
import random
from PIL import Image, ImageOps
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2] / "dataset" / "Coffee"
OUTPUT = ROOT.parents[1] / "training" / "coffee" / "coffee_sample_grid.jpg"

random.seed(42)
extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

samples = []

for folder in sorted(ROOT.rglob("*")):
    if not folder.is_dir():
        continue

    images = [
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in extensions
    ]

    if images:
        samples.extend(random.sample(images, min(3, len(images))))

if not samples:
    print("No images found. Check the dataset folder.")
    raise SystemExit(1)

columns = 3
rows = (len(samples) + columns - 1) // columns

fig, axes = plt.subplots(rows, columns, figsize=(12, rows * 3))
axes = list(axes.flat) if hasattr(axes, "flat") else [axes]

for ax, path in zip(axes, samples):
    try:
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            ax.imshow(image)
        ax.set_title(f"{path.parent.name}\n{path.name[:32]}", fontsize=8)
        ax.axis("off")
    except Exception as exc:
        ax.set_title(f"Cannot open: {path.name}\n{exc}", fontsize=8)
        ax.axis("off")

for ax in axes[len(samples):]:
    ax.axis("off")

plt.tight_layout()
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(OUTPUT, dpi=120)
plt.close()

print(f"Sample count: {len(samples)}")
print(f"Saved sample grid to: {OUTPUT}")
