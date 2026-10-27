
from pathlib import Path
import csv
import json
import random

import numpy as np
import tensorflow as tf

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TRAINING_DIR = Path(__file__).resolve().parent
MANIFEST = TRAINING_DIR / "coffee_visual_safe_manifest.csv"
MODEL_PATH = TRAINING_DIR / "outputs" / "coffee_best.keras"
LABELS_PATH = TRAINING_DIR / "outputs" / "coffee_class_names.json"

IMAGE_SIZE = (160, 160)
SEED = 42


def main():
    with LABELS_PATH.open("r", encoding="utf-8") as file:
        class_names = json.load(file)

    # Select only images from the held-out test split.
    with MANIFEST.open("r", newline="", encoding="utf-8") as file:
        rows = [
            row for row in csv.DictReader(file)
            if row["split"] == "test"
        ]

    if not rows:
        raise ValueError("No test images found.")

    # Choose up to two images from each class.
    random.seed(SEED)
    selected = []

    for class_name in class_names:
        class_rows = [
            row for row in rows if row["class"] == class_name
        ]
        selected.extend(random.sample(class_rows, min(2, len(class_rows))))

    print("Loading Coffee model...")
    model = tf.keras.models.load_model(MODEL_PATH)

    print("\n===== COFFEE PREDICTION CHECK =====")

    
    # Test your new Coffee leaf image
    image_path = PROJECT_ROOT / "training" / "coffee" / "test_coffee_leaf.jpg"

    print("\n===== YOUR COFFEE LEAF PHOTO =====")

    image_bytes = tf.io.read_file(str(image_path))
    image = tf.io.decode_image(
        image_bytes,
        channels=3,
        expand_animations=False,
    )
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, IMAGE_SIZE)
    image = tf.cast(image, tf.float32)

    probabilities = model.predict(
        tf.expand_dims(image, axis=0),
        verbose=0,
    )[0]

    predicted_index = int(np.argmax(probabilities))
    predicted_class = class_names[predicted_index]
    confidence = float(probabilities[predicted_index]) * 100


    print(f"Predicted class: {predicted_class}")
    print(f"Model confidence: {confidence:.2f}%")

    print("\nProbabilities for all Coffee classes:")
    for index, class_name in enumerate(class_names):
        probability = float(probabilities[index]) * 100
        print(f"{class_name}: {probability:.4f}%")



    for row in selected:
        image_path = PROJECT_ROOT / Path(row["relative_path"])

        image_bytes = tf.io.read_file(str(image_path))
        image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False,
        )
        image.set_shape([None, None, 3])
        image = tf.image.resize(image, IMAGE_SIZE)
        image = tf.cast(image, tf.float32)

        # Match preprocessing used during training.
        probabilities = model.predict(
            tf.expand_dims(image, axis=0),
            verbose=0,
        )[0]

        predicted_index = int(np.argmax(probabilities))
        predicted_class = class_names[predicted_index]
        confidence = float(probabilities[predicted_index]) * 100

        actual_class = row["class"]
        result = "MATCH" if predicted_class == actual_class else "MISMATCH"

        print(f"\nActual:     {actual_class}")
        print(f"Predicted:  {predicted_class}")
        print(f"Confidence: {confidence:.2f}%")
        print(f"Result:     {result}")
        print(f"Image:      {row['relative_path']}")

    print("\nPrediction check completed.")
    print("Original dataset and model were not modified.")


if __name__ == "__main__":
    main()
