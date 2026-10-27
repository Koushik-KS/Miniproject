
from pathlib import Path
from PIL import Image
import hashlib

# Dataset folder
ROOT = Path("dataset/Coffee/healthy")

# Supported image formats
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def main():
    if not ROOT.exists():
        print("ERROR: Healthy dataset folder not found:", ROOT.resolve())
        return

    files = [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
    ]

    unique_images = {}
    unreadable_files = []
    duplicate_count = 0

    print("Checking Healthy coffee images...")
    print("-" * 50)

    for index, path in enumerate(files, start=1):
        try:
            # Identify exact duplicate image contents
            digest = hashlib.sha256(path.read_bytes()).hexdigest()

            if digest in unique_images:
                duplicate_count += 1
                continue

            # Verify that the image can be opened
            with Image.open(path) as image:
                image.verify()

            # Read dimensions after verification
            with Image.open(path) as image:
                width, height = image.size

            unique_images[digest] = {
                "path": path,
                "width": width,
                "height": height,
            }

        except Exception as error:
            unreadable_files.append((path, str(error)))

        if index % 2000 == 0:
            print(f"Checked {index}/{len(files)} files...")

    # Count image dimensions among unique readable images
    dimension_counts = {}

    for details in unique_images.values():
        dimensions = (details["width"], details["height"])
        dimension_counts[dimensions] = (
            dimension_counts.get(dimensions, 0) + 1
        )

    small_images = [
        details["path"]
        for details in unique_images.values()
        if details["width"] < 64 or details["height"] < 64
    ]

    # Display summary
    print("\n" + "=" * 50)
    print("HEALTHY COFFEE DATASET QUALITY REPORT")
    print("=" * 50)

    print("Total image files:", len(files))
    print("Unique readable images:", len(unique_images))
    print("Exact duplicate copies:", duplicate_count)
    print("Unreadable files:", len(unreadable_files))
    print("Unique images smaller than 64x64:", len(small_images))

    print("\nUnique image dimensions:")

    if dimension_counts:
        for dimensions, count in sorted(dimension_counts.items()):
            width, height = dimensions
            print(f"{width} x {height}: {count} images")
    else:
        print("No readable images found.")

    if unreadable_files:
        print("\nUNREADABLE FILE DETAILS:")

        for path, error in unreadable_files:
            print("\nFile:", path)
            print("Reason:", error)
    else:
        print("\nNo unreadable files found.")

    if small_images:
        print("\nIMAGES SMALLER THAN 64x64:")

        for path in small_images:
            print(path)

    print("\nQuality check completed.")
    print("No dataset files were changed.")


if __name__ == "__main__":
    main()
