
from pathlib import Path
import hashlib

ROOT = Path("dataset/Coffee/healthy")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def main():
    seen = set()
    unique_count = 0
    missing_jpeg_end = []
    unreadable_candidates = []

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue

        try:
            data = path.read_bytes()
            digest = hashlib.sha256(data).hexdigest()

            if digest in seen:
                continue

            seen.add(digest)
            unique_count += 1

            if path.suffix.lower() in {".jpg", ".jpeg"}:
                if not data.endswith(bytes.fromhex("FFD9")):
                    missing_jpeg_end.append(path)

        except OSError as error:
            unreadable_candidates.append((path, str(error)))

    print("Unique image contents:", unique_count)
    print("Unique JPEGs missing the final FFD9 marker:",
          len(missing_jpeg_end))

    for path in missing_jpeg_end:
        print("Check:", path)

    print("Files with read errors:", len(unreadable_candidates))

    for path, error in unreadable_candidates:
        print("Read error:", path, "|", error)


if __name__ == "__main__":
    main()
