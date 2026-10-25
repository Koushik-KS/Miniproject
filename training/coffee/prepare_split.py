
from pathlib import Path
from collections import defaultdict
from hashlib import sha256
import csv
import random

ROOT = Path(__file__).resolve().parents[2] / "dataset" / "Coffee"
OUTPUT = Path(__file__).resolve().parent / "coffee_split_manifest.csv"

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SEED = 42

def get_class(path):
    parts = path.relative_to(ROOT).parts
    top_folder = parts[0].lower()

    if top_folder == "healthy":
        return "Healthy"

    if top_folder == "diseased" and len(parts) >= 3:
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
    if not ROOT.is_dir():
        raise FileNotFoundError(f"Dataset not found: {ROOT}")

    # Group files by exact file-content hash.
    groups = defaultdict(list)
    unreadable = []
    unknown = []

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue

        label = get_class(path)
        if label == "UNKNOWN":
            unknown.append(str(path))
            continue

        try:
            digest = sha256(path.read_bytes()).hexdigest()
            groups[(label, digest)].append(path)
        except OSError:
            unreadable.append(str(path))

    # Select one representative for each unique image within each class.
    representatives = []
    for (label, digest), paths in groups.items():
        representatives.append((label, digest, sorted(paths)[0]))

    # Assign each unique image group to exactly one split.
    by_class = defaultdict(list)
    for label, digest, path in representatives:
        by_class[label].append((digest, path))

    rows = []
    rng = random.Random(SEED)

    for label in sorted(by_class):
        items = sorted(by_class[label], key=lambda item: item[0])
        rng.shuffle(items)

        count = len(items)
        train_end = int(count * 0.70)
        val_end = int(count * 0.85)

        for index, (digest, path) in enumerate(items):
            if index < train_end:
                split = "train"
            elif index < val_end:
                split = "validation"
            else:
                split = "test"

            rows.append({
                "relative_path": path.relative_to(ROOT.parent.parent).as_posix(),
                "class": label,
                "sha256": digest,
                "split": split,
            })

    # Safety check: no identical hash may appear in multiple splits.
    hash_splits = defaultdict(set)
    for row in rows:
        hash_splits[row["sha256"]].add(row["split"])

    leakage = {
        digest: splits
        for digest, splits in hash_splits.items()
        if len(splits) > 1
    }

    if leakage:
        raise RuntimeError(
            f"Duplicate leakage detected for {len(leakage)} image hashes."
        )

    # Do not silently overwrite an existing manifest.
    if OUTPUT.exists():
        raise FileExistsError(
            f"Manifest already exists: {OUTPUT}\n"
            "No file was overwritten. Review it before proceeding."
        )

    with OUTPUT.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["relative_path", "class", "sha256", "split"]
        )
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda row: (row["class"], row["split"], row["relative_path"])))

    print("\n===== COFFEE SPLIT MANIFEST =====")
    print(f"Unique image records: {len(rows)}")

    for label in sorted(by_class):
        print(f"\n{label}:")
        for split in ("train", "validation", "test"):
            amount = sum(
                1 for row in rows
                if row["class"] == label and row["split"] == split
            )
            print(f"  {split}: {amount}")

    print(f"\nUnreadable files skipped: {len(unreadable)}")
    print(f"Unknown-class files skipped: {len(unknown)}")
    print(f"Duplicate leakage: {len(leakage)}")
    print(f"Manifest saved to: {OUTPUT}")
    print("Original dataset files were not changed.")


if __name__ == "__main__":
    main()
