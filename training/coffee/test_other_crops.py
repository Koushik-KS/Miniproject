
from pathlib import Path
import json
import random

import numpy as np
import tensorflow as tf
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(__file__).resolve().parent / "outputs" / "coffee_best.keras"
LABELS_PATH = Path(__file__).resolve().parent / "outputs" / "coffee_class_names.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
IMAGE_SIZE = (160, 160)
SAMPLES_PER_CROP = 3
SEED = 42

random.seed(SEED)


def find_images(folder):
    return [
        p for p in folder.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]


def main():
    with LABELS_PATH.open("r", encoding="utf-8") as file:
        class_names = json.load(file)

    model = tf.keras.models.load_model(MODEL_PATH)

    crop_folders = {
        "Arecanut": PROJECT_ROOT / "dataset" / "Arecanut",
        "Cardamom": PROJECT_ROOT / "dataset" / "Cardamom",
        "Ginger": PROJECT_ROOT / "dataset" / "Ginger",
        "Black Pepper": PROJECT_ROOT / "dataset" / "Pepper"
        / "piper-nigrum-leaf-disease.v3-leafv2.yolov8"
        / "train" / "images",
    }

    print("Coffee model — other-crop rejection diagnostic")
    print("This test does not change your model or dataset.")

    for crop, folder in crop_folders.items():
        images = find_images(folder)

        if not images:
            print(f"\n{crop}: no images found at {folder}")
            continue

        selected = random.sample(
            images, min(SAMPLES_PER_CROP, len(images))
        )

        print(f"\n--- {crop} ---")

        for path in selected:
            try:
                with Image.open(path) as source:
                    image = source.convert("RGB").resize(IMAGE_SIZE)

                array = np.asarray(image, dtype=np.float32)
                probabilities = model.predict(
                    array[None, ...], verbose=0
                )[0]

                best_index = int(np.argmax(probabilities))

                print(
                    f"{path.name}: "
                    f"{class_names[best_index]} "
                    f"({probabilities[best_index] * 100:.2f}%)"
                )

            except Exception as error:
                print(f"{path.name}: could not process ({error})")


if __name__ == "__main__":
    main()
