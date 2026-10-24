
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
        except OSError as exc:
            unreadable += 1
            print(f"Could not read: {path} ({exc})")

    duplicate_groups = [
        paths for paths in hashes.values() if len(paths) > 1
    ]

    print(f"Images scanned: {total:,}")
    print(f"Exact duplicate groups: {len(duplicate_groups):,}")
    print(f"Unreadable files: {unreadable:,}")

    for group in duplicate_groups[:20]:
        print("\nDuplicate group:")
        for path in group:
            print(f"  {path.relative_to(ROOT)}")

    if len(duplicate_groups) > 20:
        print(f"\nAdditional groups not displayed: {len(duplicate_groups) - 20}")

    print("\nRead-only check complete. No files were changed.")

if __name__ == "__main__":
    main()
