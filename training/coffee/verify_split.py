
from pathlib import Path
from collections import defaultdict
from hashlib import sha256
import csv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "dataset" / "Coffee"
MANIFEST = Path(__file__).resolve().parent / "coffee_split_manifest.csv"

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


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
        raise FileNotFoundError(f"Dataset not found: {DATASET_ROOT}")

    if not MANIFEST.is_file():
        raise FileNotFoundError(f"Manifest not found: {MANIFEST}")

    print("Checking exact image duplicates across all Coffee classes...")

    # Scan every original image, including duplicate copies.
    hash_classes = defaultdict(set)
    hash_paths = defaultdict(list)
    unreadable = 0
    unknown = 0

    for path in DATASET_ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue

        label = get_class(path)
        if label == "UNKNOWN":
            unknown += 1
            continue

        try:
            digest = sha256(path.read_bytes()).hexdigest()
        except OSError:
            unreadable += 1
            continue

        hash_classes[digest].add(label)
        hash_paths[digest].append(path)

    cross_class = {
        digest: labels
        for digest, labels in hash_classes.items()
        if len(labels) > 1
    }

    print(f"Exact image-content hashes: {len(hash_classes)}")
    print(f"Unreadable files skipped: {unreadable}")
    print(f"Unknown-class files skipped: {unknown}")
    print(f"Hashes appearing in multiple classes: {len(cross_class)}")

    for digest, labels in list(cross_class.items())[:5]:
        print(f"\nHash: {digest}")
        print(f"Classes: {', '.join(sorted(labels))}")
        for path in hash_paths[digest][:5]:
            print(f"  {path.relative_to(PROJECT_ROOT)}")

    # Read the existing manifest without changing it.
    with MANIFEST.open("r", newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    required = {"relative_path", "class", "sha256", "split"}
    if not rows or not required.issubset(rows[0].keys()):
        raise ValueError("Manifest is empty or has incorrect columns.")

    manifest_hash_splits = defaultdict(set)
    manifest_hash_classes = defaultdict(set)
    manifest_errors = []

    for row in rows:
        image_path = PROJECT_ROOT / Path(row["relative_path"])
        split = row["split"]
        label = row["class"]

        if split not in {"train", "validation", "test"}:
            manifest_errors.append(f"Invalid split: {row['relative_path']}")
            continue

        if not image_path.is_file():
            manifest_errors.append(f"Missing image: {row['relative_path']}")
            continue

        try:
            actual_hash = sha256(image_path.read_bytes()).hexdigest()
        except OSError:
            manifest_errors.append(f"Unreadable image: {row['relative_path']}")
            continue

        if actual_hash != row["sha256"]:
            manifest_errors.append(f"Hash mismatch: {row['relative_path']}")

        if get_class(image_path) != label:
            manifest_errors.append(f"Class mismatch: {row['relative_path']}")

        manifest_hash_splits[actual_hash].add(split)
        manifest_hash_classes[actual_hash].add(label)

    split_leaks = {
        digest: splits
        for digest, splits in manifest_hash_splits.items()
        if len(splits) > 1
    }

    manifest_cross_class = {
        digest: labels
        for digest, labels in manifest_hash_classes.items()
        if len(labels) > 1
    }

    print("\n===== MANIFEST VERIFICATION =====")
    print(f"Manifest records: {len(rows)}")
    print(f"Split leakage groups: {len(split_leaks)}")
    print(f"Cross-class duplicate groups in manifest: {len(manifest_cross_class)}")
    print(f"Missing, mismatched, or invalid records: {len(manifest_errors)}")

    for error in manifest_errors[:10]:
        print(f"  {error}")

    if cross_class or split_leaks or manifest_cross_class or manifest_errors:
        print("\nRESULT: REVIEW REQUIRED. Do not start training yet.")
    else:
        print("\nRESULT: Exact-hash checks passed.")
        print("Note: visually identical images with different encodings are not detected.")
        print("No dataset or manifest files were modified.")


if __name__ == "__main__":
    main()
