
from pathlib import Path
from collections import defaultdict
import csv
import random
import imagehash
from PIL import Image, ImageOps

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "dataset" / "Coffee"

# Use the updated manifest containing the new healthy images.
OLD_MANIFEST = (
    Path(__file__).resolve().parent
    / "coffee_split_manifest_updated.csv"
)

# Save separately; do not overwrite the original manifest.
OUTPUT = (
    Path(__file__).resolve().parent
    / "coffee_visual_safe_manifest_updated.csv"
)

SEED = 42
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def main():
    if not DATASET_ROOT.is_dir():
        raise FileNotFoundError(
            f"Coffee dataset folder not found: {DATASET_ROOT}"
        )

    if not OLD_MANIFEST.is_file():
        raise FileNotFoundError(
            f"Updated manifest not found: {OLD_MANIFEST}"
        )

    if OUTPUT.exists():
        raise FileExistsError(
            f"{OUTPUT} already exists. No file was overwritten."
        )

    with OLD_MANIFEST.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        old_rows = list(csv.DictReader(file))

    required_columns = {"relative_path", "class", "sha256"}
    if not old_rows or not required_columns.issubset(old_rows[0]):
        raise ValueError(
            "The updated manifest is empty or missing required columns."
        )

    # Calculate perceptual hashes for images.
    records = []
    unreadable = []

    for index, row in enumerate(old_rows, start=1):
        path = PROJECT_ROOT / Path(row["relative_path"])

        try:
            with Image.open(path) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                visual_hash = str(
                    imagehash.phash(image, hash_size=8)
                )

            records.append({
                "relative_path": row["relative_path"],
                "class": row["class"],
                "sha256": row["sha256"],
                "visual_hash": visual_hash,
            })

        except (OSError, ValueError) as error:
            unreadable.append(
                (row["relative_path"], str(error))
            )

        if index % 500 == 0:
            print(
                f"Checked {index}/{len(old_rows)} "
                "manifest records..."
            )

    # Keep images with identical perceptual hashes together.
    groups = defaultdict(list)

    for record in records:
        groups[record["visual_hash"]].append(record)

    # Stop if identical visual hashes have conflicting class labels.
    conflicting_groups = []

    for visual_hash, group in groups.items():
        labels = {item["class"] for item in group}

        if len(labels) > 1:
            conflicting_groups.append(
                (visual_hash, sorted(labels), group)
            )

    print("\n===== VISUAL GROUP REVIEW =====")
    print(f"Manifest records: {len(old_rows)}")
    print(f"Readable images: {len(records)}")
    print(f"Unreadable images: {len(unreadable)}")
    print(f"Exact visual-hash groups: {len(groups)}")
    print(
        "Groups with conflicting classes: "
        f"{len(conflicting_groups)}"
    )

    if unreadable:
        print("\nUnreadable images (first 10):")
        for relative_path, error in unreadable[:10]:
            print(f"  {relative_path}: {error}")

    for visual_hash, labels, group in conflicting_groups[:10]:
        print(f"\nHash: {visual_hash}")
        print(f"Classes: {', '.join(labels)}")

        for item in group[:5]:
            print(
                f"  {item['class']}: {item['relative_path']}"
            )

    if conflicting_groups:
        print(
            "\nSTOP: Review conflicting class groups before splitting."
        )
        print("No new manifest was created.")
        return

    if not records:
        raise RuntimeError("No readable images were found.")

    # Group images by class, keeping each visual group intact.
    by_class = defaultdict(list)

    for visual_hash, group in groups.items():
        label = group[0]["class"]
        by_class[label].append((visual_hash, group))

    rng = random.Random(SEED)
    output_rows = []

    for label in sorted(by_class):
        class_groups = sorted(
            by_class[label], key=lambda item: item[0]
        )
        rng.shuffle(class_groups)

        total_groups = len(class_groups)

        if total_groups < 3:
            raise ValueError(
                f"Class {label} has only {total_groups} "
                "visual groups; cannot safely create all three splits."
            )

        train_end = int(total_groups * 0.70)
        val_end = int(total_groups * 0.85)

        # Ensure train, validation and test are all nonempty.
        train_end = max(1, train_end)
        val_end = max(train_end + 1, val_end)
        val_end = min(val_end, total_groups - 1)

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

    # Verify that no exact visual hash crosses splits.
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

    # Write a new manifest without overwriting existing files.
    with OUTPUT.open(
        "w", newline="", encoding="utf-8"
    ) as file:
        columns = [
            "relative_path",
            "class",
            "sha256",
            "visual_hash",
            "split",
        ]

        writer = csv.DictWriter(
            file, fieldnames=columns
        )
        writer.writeheader()
        writer.writerows(
            sorted(
                output_rows,
                key=lambda row: (
                    row["class"],
                    row["split"],
                    row["relative_path"],
                ),
            )
        )

    print("\n===== UPDATED VISUAL-SAFE SPLIT =====")

    for label in sorted(by_class):
        print(f"\n{label}:")

        for split in ("train", "validation", "test"):
            count = sum(
                1 for row in output_rows
                if row["class"] == label
                and row["split"] == split
            )
            print(f"  {split}: {count}")

    print(f"\nTotal manifest records: {len(output_rows)}")
    print(f"Visual-hash leakage groups: {len(leakage)}")
    print(f"New manifest: {OUTPUT}")
    print("Original dataset and manifests were not modified.")
    print(
        "Note: identical perceptual hashes are grouped; "
        "some visually similar images may still have different hashes."
    )


if __name__ == "__main__":
    main()
