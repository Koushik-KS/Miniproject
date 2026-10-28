
from pathlib import Path
import random

import numpy as np
import tensorflow as tf
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TRAINING_DIR = Path(__file__).resolve().parent

GATE_MODEL_PATH = TRAINING_DIR / "outputs" / "coffee_leaf_gate.keras"
IMAGE_SIZE = (160, 160)
SEED = 42

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

CROP_FOLDERS = {
    "Coffee": PROJECT_ROOT / "dataset" / "Coffee",
    "Arecanut": PROJECT_ROOT / "dataset" / "Arecanut",
    "Cardamom": PROJECT_ROOT / "dataset" / "Cardamom",
    "Ginger": PROJECT_ROOT / "dataset" / "Ginger",
    "Black Pepper": (
        PROJECT_ROOT / "dataset" / "Pepper"
        / "piper-nigrum-leaf-disease.v3-leafv2.yolov8"
        / "test" / "images"
    ),
}

# Initial experiment only. This is not a verified production threshold.
COFFEE_THRESHOLD = 0.5


def predict_gate(model, image_path):
    with Image.open(image_path) as source:
        image = source.convert("RGB").resize(IMAGE_SIZE)

    array = np.asarray(image, dtype=np.float32)
    probability = float(
        model.predict(array[None, ...], verbose=0)[0][0]
    )

    result = "COFFEE" if probability >= COFFEE_THRESHOLD else "NOT COFFEE"
    return probability, result


def find_images(folder):
    if not folder.is_dir():
        return []

    return sorted(
        path for path in folder.rglob("*")
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def main():
    if not GATE_MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Gate model not found: {GATE_MODEL_PATH}"
        )

    print("Loading separate Coffee leaf validation model...")
    model = tf.keras.models.load_model(GATE_MODEL_PATH)

    # Test the separate photo used earlier.
    external_photo = TRAINING_DIR / "test_coffee_leaf.jpg"

    if external_photo.is_file():
        probability, result = predict_gate(model, external_photo)
        print("\n--- Separate Coffee leaf photo ---")
        print(f"Coffee probability: {probability * 100:.2f}%")
        print(f"Gate result: {result}")
    else:
        print(f"\nTest photo not found: {external_photo}")

    rng = random.Random(SEED)

    # Three sample images per crop.
    for crop_name, folder in CROP_FOLDERS.items():
        images = find_images(folder)

        print(f"\n--- {crop_name} ---")

        if not images:
            print("No images found.")
            continue

        selected = rng.sample(images, min(3, len(images)))

        for image_path in selected:
            try:
                probability, result = predict_gate(model, image_path)
                print(
                    f"{image_path.name}: "
                    f"Coffee probability={probability * 100:.2f}% "
                    f"| Gate={result}"
                )
            except Exception as error:
                print(f"{image_path.name}: ERROR: {error}")

    print("\nTesting finished.")
    print("The live API and existing disease model were not changed.")
    print(
        "Note: Cars, buses and unrelated objects are not tested here. "
        "Do not use this gate in production until those cases are tested."
    )


if __name__ == "__main__":
    main()
