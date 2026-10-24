
from pathlib import Path
from collections import defaultdict
from hashlib import sha256

ROOT = Path(__file__).resolve().parents[2] / "dataset" / "Coffee"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def main():
    hashes = defaultdict(list)
    unreadable = 0
    total = 0

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue

        total += 1

        try:
            digest = sha256(path.read_bytes()).hexdigest()
            hashes[digest].append(path)
        except OSError:
            unreadable += 1

    duplicate_groups = [files for files in hashes.values() if len(files) > 1]
    duplicate_files = sum(len(files) - 1 for files in duplicate_groups)

    cross_class_groups = 0
    cross_class_files = 0
    class_counts = defaultdict(int)

    for files in hashes.values():
        classes = {
            "Healthy" if "healthy" in p.relative_to(ROOT).parts[0].lower()
            else "Disease"
            for p in files
        }

        if len(classes) > 1:
            cross_class_groups += 1
            cross_class_files += len(files)

        for p in files:
            parts = p.relative_to(ROOT).parts
            if len(parts) >= 2:
                label = parts[1]
                if label.lower() == "healthy":
                    class_counts["Healthy"] += 1
                else:
                    class_counts[label] += 1

    print(f"Total files scanned: {total:,}")
    print(f"Unreadable files: {unreadable:,}")
    print(f"Unique file contents: {len(hashes):,}")
    print(f"Duplicate groups: {len(duplicate_groups):,}")
    print(f"Extra duplicate copies: {duplicate_files:,}")
    print(f"Groups spanning Healthy and Disease: {cross_class_groups:,}")
    print(f"Files in cross-class groups: {cross_class_files:,}")
    print("\nUnique images by folder label:")

    for label, count in sorted(class_counts.items()):
        print(f"{label}: {count:,}")

    print("\nRead-only summary complete. No files were changed.")

if __name__ == "__main__":
    main()
