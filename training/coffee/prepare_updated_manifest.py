from pathlib import Path
from collections import defaultdict
from hashlib import sha256
import csv
import random

root = Path("dataset/Coffee")
output = Path("training/coffee/coffee_split_manifest_updated.csv")
extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
rng = random.Random(42)

def get_class(path):
    parts = [p.lower() for p in path.relative_to(root).parts]
    if parts[0] == "healthy":
        return "Healthy"
    text = " ".join(parts)
    if "cercospora" in text or "cerscospora" in text:
        return "Cercospora"
    if "leaf rust" in text or "leafrust" in text:
        return "Leaf Rust"
    if "miner" in text:
        return "Miner"
    if "phoma" in text:
        return "Phoma"
    return None

if output.exists():
    raise FileExistsError(f"Output already exists; nothing overwritten: {output}")

groups = defaultdict(list)
skipped = 0

for path in root.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in extensions:
        continue
    label = get_class(path)
    if label is None:
        skipped += 1
        continue
    try:
        digest = sha256(path.read_bytes()).hexdigest()
        groups[(label, digest)].append(path)
    except OSError:
        skipped += 1

records = []
for (label, digest), paths in groups.items():
    records.append((label, digest, sorted(paths)[0]))

by_class = defaultdict(list)
for label, digest, path in records:
    by_class[label].append((digest, path))

rows = []
for label in sorted(by_class):
    items = sorted(by_class[label], key=lambda item: item[0])
    rng.shuffle(items)
    n = len(items)
    a, b = int(n * 0.70), int(n * 0.85)
    for i, (digest, path) in enumerate(items):
        split = "train" if i < a else "validation" if i < b else "test"
        rows.append({
            "relative_path": path.as_posix(),
            "class": label,
            "sha256": digest,
            "split": split,
        })

with output.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "relative_path", "class", "sha256", "split"
    ])
    writer.writeheader()
    writer.writerows(sorted(rows, key=lambda r: (
        r["class"], r["split"], r["relative_path"]
    )))

print("Updated manifest created:", output)
print("Unique images:", len(rows))
print("Skipped unrecognized/unreadable files:", skipped)
for label in sorted(by_class):
    print(f"\n{label}:")
    for split in ("train", "validation", "test"):
        count = sum(r["class"] == label and r["split"] == split for r in rows)
        print(f"  {split}: {count}")
print("\nExisting manifests and models were not overwritten.")
print("Next: validate this manifest before training.")
