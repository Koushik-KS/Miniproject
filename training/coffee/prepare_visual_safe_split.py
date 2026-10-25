
from pathlib import Path
from collections import defaultdict
import csv
import random
import imagehash
from PIL import Image, ImageOps

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "dataset" / "Coffee"
OLD_MANIFEST = Path(__file__).resolve().parent / "coffee_split_manifest.csv"
OUTPUT = Path(__file__).resolve().parent / "coffee_visual_safe_manifest.csv"

SEED = 42
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def main():
    if not DATASET_ROOT.is_dir():
        raise FileNotFoundError(DATASET_ROOT)

    if not OLD_MANIFEST.is_file():
        raise FileNotFoundError(OLD_MANIFEST)

    if OUTPUT.exists():
        raise FileExistsError(
            f"{OUTPUT} already exists. No file was overwritten."
        )

    with OLD_MANIFEST.open("r", newline="", encoding="utf-8") as file:
        old_rows = list(csv.DictReader(file))

    # Calculate each image's perceptual hash.
    records = []
    unreadable = []

    for index, row in enumerate(old_rows, start=1):
        path = PROJECT_ROOT / Path(row["relative_path"])

        try:
            with Image.open(path) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                visual_hash = str(imagehash.phash(image, hash_size=8))

            records.append({
                "relative_path": row["relative_path"],
                "class": row["class"],
                "sha256": row["sha256"],
                "visual_hash": visual_hash,
            })

        except (OSError, ValueError) as error:
            unreadable.append((row["relative_path"], str(error)))

        if index % 500 == 0:
            print(f"Checked {index}/{len(old_rows)} manifest records...")

    # Exact perceptual-hash groups are kept together.
    groups = defaultdict(list)
    for record in records:
        groups[record["visual_hash"]].append(record)

    conflicting_groups = []
    for visual_hash, group in groups.items():
        labels = {item["class"] for item in group}
        if len(labels) > 1:
            conflicting_groups.append((visual_hash, sorted(labels), group))

    print("\n===== VISUAL GROUP REVIEW =====")
    print(f"Readable images: {len(records)}")
    print(f"Unreadable images: {len(unreadable)}")
    print(f"Exact visual-hash groups: {len(groups)}")
    print(f"Groups with conflicting classes: {len(conflicting_groups)}")

    for visual_hash, labels, group in conflicting_groups[:10]:
        print(f"\nHash: {visual_hash}")
        print(f"Classes: {', '.join(labels)}")
        for item in group[:5]:
            print(f"  {item['class']}: {item['relative_path']}")

    if conflicting_groups:
        print("\nSTOP: Review conflicting class groups before splitting.")
        print("No new manifest was created.")
        return

    # Assign complete groups to splits. Groups are stratified by class.
    # Groups that contain several same-class images remain intact.
    by_class = defaultdict(list)

    for visual_hash, group in groups.items():
        label = group[0]["class"]
        by_class[label].append((visual_hash, group))

    rng = random.Random(SEED)
    output_rows = []

    for label in sorted(by_class):
        class_groups = sorted(by_class[label], key=lambda item: item[0])
        rng.shuffle(class_groups)

        total_groups = len(class_groups)
        train_end = int(total_groups * 0.70)
        val_end = int(total_groups * 0.85)

        for index, (visual_hash, group) in enumerate(class_groups):
            if index < train_end:
                split = "train"
            elif index < val_end:
                split = "validation"
            else:
                split = "test"

            for item in group:
                output_rows.append({
                    "relative_path": item["relative_path"],
                    "class": item["class"],
                    "sha256": item["sha256"],
                    "visual_hash": visual_hash,
                    "split": split,
                })

    # Ensure no visual hash crosses splits.
    hash_splits = defaultdict(set)
    for row in output_rows:
        hash_splits[row["visual_hash"]].add(row["split"])

    leakage = {
        visual_hash: splits
        for visual_hash, splits in hash_splits.items()
        if len(splits) > 1
    }

    if leakage:
        raise RuntimeError(
            f"Visual-hash leakage detected: {len(leakage)} groups."
        )

    with OUTPUT.open("w", newline="", encoding="utf-8") as file:
        columns = [
            "relative_path", "class", "sha256", "visual_hash", "split"
        ]
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(
            sorted(output_rows, key=lambda row: (
                row["class"], row["split"], row["relative_path"]
            ))
        )

    print("\n===== VISUAL-SAFE SPLIT SUMMARY =====")
    for label in sorted(by_class):
        print(f"\n{label}:")
        for split in ("train", "validation", "test"):
            count = sum(
                1 for row in output_rows
                if row["class"] == label and row["split"] == split
            )
            print(f"  {split}: {count}")

    print(f"\nVisual-hash leakage groups: {len(leakage)}")
    print(f"New manifest: {OUTPUT}")
    print("Original dataset and old manifest were not modified.")
    print("Note: similar images with different hashes may still exist.")


if __name__ == "__main__":
    main()
