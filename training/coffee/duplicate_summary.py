
from pathlib import Path
from collections import defaultdict
from hashlib import sha256

ROOT = Path(__file__).resolve().parents[2] / "dataset" / "Coffee"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def get_class(path):
    parts = path.relative_to(ROOT).parts
    top_folder = parts[0].lower()

    if top_folder == "healthy":
        return "Healthy"

    if top_folder == "diseased" and len(parts) >= 3:
        name = parts[1].lower()

        if "cerscospora" in name or "cercospora" in name:
            return "Cerscospora"
        if "leaf rust" in name or "leafrust" in name:
            return "Leaf Rust"
        if "miner" in name:
            return "Miner"
        if "phoma" in name:
            return "Phoma"

    return "UNKNOWN"


def main():
    hashes = defaultdict(list)
    total = 0
    unreadable = 0
    unknown = 0

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue

        total += 1
        label = get_class(path)

        if label == "UNKNOWN":
            unknown += 1
            continue

        try:
            digest = sha256(path.read_bytes()).hexdigest()
            hashes[digest].append((label, path))
        except OSError:
            unreadable += 1

    unique_by_class = defaultdict(set)
    cross_class_groups = 0
    cross_class_examples = []

    for digest, entries in hashes.items():
        labels = {label for label, _ in entries}

        for label in labels:
            unique_by_class[label].add(digest)

        if len(labels) > 1:
            cross_class_groups += 1
            if len(cross_class_examples) < 10:
                cross_class_examples.append(
                    [(label, str(path)) for label, path in entries[:4]]
                )

    duplicate_groups = sum(
        1 for entries in hashes.values() if len(entries) > 1
    )
    extra_copies = sum(
        len(entries) - 1 for entries in hashes.values()
    )

    print("\n===== COFFEE DUPLICATE AUDIT =====")
    print(f"Total image files: {total:,}")
    print(f"Unique image contents: {len(hashes):,}")
    print(f"Duplicate groups: {duplicate_groups:,}")
    print(f"Extra duplicate copies: {extra_copies:,}")
    print(f"Unreadable images: {unreadable:,}")
    print(f"Unrecognized class paths: {unknown:,}")

    print("\nUnique images by class:")
    for label in ["Healthy", "Cerscospora", "Leaf Rust", "Miner", "Phoma"]:
        print(f"{label}: {len(unique_by_class[label]):,}")

    print(f"\nDuplicate groups crossing classes: {cross_class_groups}")

    if cross_class_examples:
        print("\nExamples to review:")
        for group in cross_class_examples:
            for label, path in group:
                print(f"  {label}: {path}")
            print()

    print("\nRead-only audit complete. No files were changed.")


if __name__ == "__main__":
    main()
