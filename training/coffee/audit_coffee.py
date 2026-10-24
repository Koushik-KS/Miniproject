
from pathlib import Path
from collections import Counter
from PIL import Image, UnidentifiedImageError

PROJECT_ROOT = Path(__file__).resolve().parents[2]
COFFEE_DIR = PROJECT_ROOT / "dataset" / "Coffee"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
EXPECTED_CLASSES = {"Cerscospora", "Leaf rust", "Miner", "Phoma", "Healthy"}

def main():
    if not COFFEE_DIR.is_dir():
        raise FileNotFoundError(f"Coffee dataset not found: {COFFEE_DIR}")

    print(f"Dataset: {COFFEE_DIR}\n")

    class_dirs = [
        COFFEE_DIR / "diseased" / "Cerscospora-20210326T085017Z-001" / "Cerscospora",
        COFFEE_DIR / "diseased" / "Leaf rust-20210326T083416Z-001" / "Leaf rust",
        COFFEE_DIR / "diseased" / "Miner-20210326T082341Z-001" / "Miner",
        COFFEE_DIR / "diseased" / "Phoma-20210326T082051Z-001" / "Phoma",
        COFFEE_DIR / "healthy" / "Healthy-20210326T083815Z-001" / "Healthy",
    ]

    total = 0
    readable = 0
    broken = []
    class_counts = Counter()

    for folder in class_dirs:
        if not folder.is_dir():
            print(f"MISSING CLASS FOLDER: {folder}")
            continue

        class_name = folder.name
        files = [
            p for p in folder.rglob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ]

        class_counts[class_name] += len(files)
        total += len(files)

        for path in files:
            try:
                with Image.open(path) as img:
                    img.verify()
                readable += 1
            except (OSError, UnidentifiedImageError, ValueError) as exc:
                broken.append((path, str(exc)))

        print(f"{class_name}: {len(files):,} images")

    print("\n--- AUDIT SUMMARY ---")
    print(f"Total images found: {total:,}")
    print(f"Images verified readable: {readable:,}")
    print(f"Unreadable images: {len(broken):,}")

    if broken:
        print("\nFirst 20 unreadable files:")
        for path, error in broken[:20]:
            print(f"- {path} ({error})")

    print("\nNote: This checks image readability and counts only.")
    print("It does not verify disease diagnoses or detect duplicate images.")

if __name__ == "__main__":
    main()
