
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

ROOT = Path(__file__).resolve().parent

IMAGE_FILES = [
    ROOT / "test_coffee_leaf.jpg",
    ROOT / "coffee_sample_grid.jpg",
    ROOT / "phoma_sample_grid.jpg",
]

print("Loading pretrained MobileNetV2...")

model = tf.keras.applications.MobileNetV2(
    weights="imagenet",
    include_top=True,
)

print("Model loaded successfully.")

for path in IMAGE_FILES:
    print("\n" + "=" * 45)
    print("Image:", path.name)

    if not path.is_file():
        print("File not found.")
        continue

    try:
        with Image.open(path) as source:
            image = source.convert("RGB").resize((224, 224))

        array = np.asarray(image, dtype=np.float32)
        array = np.expand_dims(array, axis=0)

        array = tf.keras.applications.mobilenet_v2.preprocess_input(
            array
        )

        predictions = model.predict(array, verbose=0)

        results = tf.keras.applications.mobilenet_v2.decode_predictions(
            predictions,
            top=3,
        )[0]

        for _, label, score in results:
            print(f"{label}: {score * 100:.2f}%")

    except Exception as error:
        print("Could not process image:", error)

print("\nRecognition test completed.")
