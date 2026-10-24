
from pathlib import Path
import hashlib

# Project dataset location
DATASET = Path(__file__).resolve().parents[2] / "dataset" / "Coffee"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

class_hashes = {}
unreadable = 0

for image_path in DATASET.rglob("*"):
    if not image_path.is_file():
        continue

    if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
        continue

    # Identify the class from the parent folders
    parts = image_path.relative_to(DATASET).parts
    label = None

    for part in parts:
        name = part.lower().replace(" ", "").replace("_", "")

        if name == "healthy" or name.startswith("healthy-"):
            label = "Healthy"
        elif "cerscospora" in name or "cercospora" in name:
            label = "Cercospora (folder spelling: Cerscospora)"
        elif "leafrust" in name:
            label = "Leaf Rust"
        elif name == "miner" or name.startswith("miner-"):
            label = "Miner"
        elif name == "phoma" or name.startswith("phoma-"):
            label = "Phoma"

    if label is None:
        continue

    try:
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
        class_hashes.setdefault(label, set()).add(digest)
    except OSError:
        unreadable += 1

print("\n===== COFFEE UNIQUE IMAGE SUMMARY =====")

for label in sorted(class_hashes):
    print(f"{label}: {len(class_hashes[label])} unique images")

print(f"\nTotal unique class-image pairs: "
      f"{sum(len(items) for items in class_hashes.values())}")
print(f"Unreadable images: {unreadable}")
print("\nSummary complete. Original dataset was not modified.")
