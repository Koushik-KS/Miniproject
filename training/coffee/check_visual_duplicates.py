
from pathlib import Path
from collections import defaultdict
from itertools import combinations
import csv
import imagehash
from PIL import Image, ImageOps

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "dataset" / "Coffee"
MANIFEST = Path(__file__).resolve().parent / "coffee_split_manifest.csv"
OUTPUT = Path(__file__).resolve().parent / "coffee_visual_duplicate_candidates.csv"

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
HAMMING_THRESHOLD = 4


def get_class(path):
    parts = path.relative_to(DATASET_ROOT).parts

    if not parts:
        return "UNKNOWN"

    if parts[0].lower() == "healthy":
        return "Healthy"

    if parts[0].lower() == "diseased" and len(parts) >= 3:
        name = parts[1].lower()

        if "cerscospora" in name or "cercospora" in name:
            return "Cercospora"
        if "leaf rust" in name or "leafrust" in name:
            return "Leaf Rust"
        if "miner" in name:
            return "Miner"
        if "phoma" in name:
            return "Phoma"

    return "UNKNOWN"


def main():
    if not DATASET_ROOT.is_dir():
        raise FileNotFoundError(DATASET_ROOT)

    if not MANIFEST.is_file():
        raise FileNotFoundError(MANIFEST)

    # Only analyze representative images already listed in the manifest.
    with MANIFEST.open("r", newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    image_records = []
    unreadable = 0

    print(f"Checking {len(rows)} manifest images...")
    print("This may take several minutes.")

    for index, row in enumerate(rows, start=1):
        path = PROJECT_ROOT / Path(row["relative_path"])

        try:
            with Image.open(path) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                fingerprint = imagehash.phash(image, hash_size=8)

            image_records.append({
                "path": row["relative_path"],
                "class": row["class"],
                "split": row["split"],
                "hash": fingerprint,
            })

        except (OSError, ValueError):
            unreadable += 1

        if index % 500 == 0:
            print(f"Processed {index}/{len(rows)} images...")

    # Candidate pairs only; a small Hamming distance suggests similarity.
    candidates = []

    for first, second in combinations(image_records, 2):
        distance = first["hash"] - second["hash"]

        if distance <= HAMMING_THRESHOLD:
            candidates.append({
                "path_1": first["path"],
                "class_1": first["class"],
                "split_1": first["split"],
                "path_2": second["path"],
                "class_2": second["class"],
                "split_2": second["split"],
                "hash_distance": distance,
            })

    with OUTPUT.open("w", newline="", encoding="utf-8") as file:
        fieldnames = [
            "path_1", "class_1", "split_1",
            "path_2", "class_2", "split_2",
            "hash_distance",
        ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(candidates)

    cross_split = sum(
        1 for pair in candidates if pair["split_1"] != pair["split_2"]
    )
    cross_class = sum(
        1 for pair in candidates if pair["class_1"] != pair["class_2"]
    )

    print("\n===== VISUAL DUPLICATE CANDIDATES =====")
    print(f"Images checked: {len(image_records)}")
    print(f"Unreadable images skipped: {unreadable}")
    print(f"Candidate pairs: {len(candidates)}")
    print(f"Pairs across different splits: {cross_split}")
    print(f"Pairs across different classes: {cross_class}")
    print(f"Report saved to: {OUTPUT}")
    print("These are candidates, not confirmed duplicates.")
    print("No dataset or manifest images were modified.")


if __name__ == "__main__":
    main()
