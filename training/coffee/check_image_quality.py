
from pathlib import Path
from collections import Counter
from PIL import Image, UnidentifiedImageError

# Project dataset path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "dataset" / "Coffee"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

class_counts = Counter()
dimension_counts = Counter()
unreadable_images = []
small_images = []
total_images = 0

print("KisanVision AI - Coffee Image Quality Check")
print(f"Dataset: {DATASET_DIR}")
print("-" * 55)

if not DATASET_DIR.is_dir():
    raise FileNotFoundError(f"Coffee dataset folder not found: {DATASET_DIR}")

for image_path in sorted(DATASET_DIR.rglob("*")):
    if not image_path.is_file():
        continue

    if image_path.suffix.lower() not in VALID_EXTENSIONS:
        continue

    total_images += 1

    # Get the class from the parent folder structure
    parts = image_path.relative_to(DATASET_DIR).parts
    if len(parts) >= 2:
        class_name = parts[0] if parts[0] == "healthy" else parts[1]
    else:
        class_name = "Unknown"

    try:
        with Image.open(image_path) as img:
            img.verify()

        # Reopen after verify to read dimensions
        with Image.open(image_path) as img:
            width, height = img.size
            dimension_counts[(width, height)] += 1
            class_counts[class_name] += 1

            if width < 64 or height < 64:
                small_images.append(
                    (str(image_path.relative_to(DATASET_DIR)), width, height)
                )

    except (OSError, ValueError, UnidentifiedImageError) as error:
        unreadable_images.append(
            (str(image_path.relative_to(DATASET_DIR)), str(error))
        )

print(f"\nTotal image files checked: {total_images}")
print(f"Readable images: {sum(class_counts.values())}")
print(f"Unreadable images: {len(unreadable_images)}")

print("\nImage counts by class/folder:")
for name, count in sorted(class_counts.items()):
    print(f"  {name}: {count}")

print("\nMost common image dimensions:")
for (width, height), count in dimension_counts.most_common(10):
    print(f"  {width} x {height}: {count} images")

print(f"\nImages smaller than 64 x 64: {len(small_images)}")
for path, width, height in small_images[:10]:
    print(f"  {path} ({width} x {height})")

print(f"\nUnreadable image examples (up to 10):")
for path, error in unreadable_images[:10]:
    print(f"  {path}: {error}")

print("\nImage quality check completed. No dataset files were changed.")
