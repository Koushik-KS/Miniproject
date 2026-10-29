
from pathlib import Path
import csv
import json

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
)

# ---------------- PATHS ----------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
TRAINING_DIR = Path(__file__).resolve().parent
MANIFEST = TRAINING_DIR / "coffee_visual_safe_manifest_updated.csv"
OUTPUT_DIR = TRAINING_DIR / "outputs"

MODEL_PATH = OUTPUT_DIR / "coffee_best_updated.keras"
LABELS_PATH = OUTPUT_DIR / "coffee_class_names.json"

IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8


def main():
    for path in (MANIFEST, MODEL_PATH, LABELS_PATH):
        if not path.is_file():
            raise FileNotFoundError(
                f"Required file missing: {path}"
            )

    with LABELS_PATH.open("r", encoding="utf-8") as file:
        class_names = json.load(file)

    # Read only the untouched test split.
    with MANIFEST.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        rows = [
            row for row in csv.DictReader(file)
            if row["split"].strip().lower() == "test"
        ]

    if not rows:
        raise ValueError(
            "No test records found in the updated manifest."
        )

    paths = []
    true_labels = []

    for row in rows:
        label = row["class"]
        image_path = PROJECT_ROOT / Path(row["relative_path"])

        if label not in class_names:
            raise ValueError(f"Unknown class label: {label}")

        if not image_path.is_file():
            raise FileNotFoundError(image_path)

        paths.append(str(image_path))
        true_labels.append(class_names.index(label))

    # Match the image preprocessing used during training.
    def decode_image(path, label):
        image_bytes = tf.io.read_file(path)

        image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False,
        )

        image.set_shape([None, None, 3])
        image = tf.image.resize(image, IMAGE_SIZE)
        image = tf.cast(image, tf.float32)

        return image, label

    dataset = tf.data.Dataset.from_tensor_slices(
        (paths, true_labels)
    )

    dataset = dataset.map(
        decode_image,
        num_parallel_calls=2,
    )

    dataset = dataset.batch(BATCH_SIZE).prefetch(1)

    print("KisanVision AI - Updated Coffee Model Evaluation")
    print(f"Manifest: {MANIFEST.name}")
    print(f"Model: {MODEL_PATH.name}")
    print(f"Test images: {len(paths)}")
    print("\nLoading updated Coffee model...")

    model = tf.keras.models.load_model(MODEL_PATH)

    print("\nEvaluating untouched test split...")

    probabilities = model.predict(dataset, verbose=1)
    predicted_labels = np.argmax(probabilities, axis=1)

    accuracy = accuracy_score(
        true_labels,
        predicted_labels,
    )

    report = classification_report(
        true_labels,
        predicted_labels,
        labels=list(range(len(class_names))),
        target_names=class_names,
        digits=4,
        zero_division=0,
    )

    matrix = confusion_matrix(
        true_labels,
        predicted_labels,
        labels=list(range(len(class_names))),
    )

    print(f"\nTest accuracy: {accuracy:.4%}")
    print("\nClassification report:")
    print(report)

    print(
        "Confusion matrix "
        "(rows = actual, columns = predicted):"
    )
    print("Classes:", class_names)
    print(matrix)

    # Per-class accuracy helps us inspect Healthy predictions.
    print("\nPer-class test accuracy:")

    for index, name in enumerate(class_names):
        class_indices = [
            i for i, actual in enumerate(true_labels)
            if actual == index
        ]

        correct = sum(
            1 for i in class_indices
            if predicted_labels[i] == index
        )

        total = len(class_indices)
        class_accuracy = correct / total if total else 0.0

        print(
            f"  {name}: {correct}/{total} "
            f"({class_accuracy:.2%})"
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    report_path = OUTPUT_DIR / "coffee_test_report_updated.txt"

    with report_path.open("w", encoding="utf-8") as file:
        file.write("KisanVision AI - Updated Coffee Model Evaluation\n")
        file.write(f"Manifest: {MANIFEST.name}\n")
        file.write(f"Model: {MODEL_PATH.name}\n")
        file.write(f"Test images: {len(paths)}\n")
        file.write(f"Test accuracy: {accuracy:.4%}\n\n")
        file.write(
            "Classes: " + json.dumps(class_names) + "\n\n"
        )
        file.write("Classification report:\n")
        file.write(report)
        file.write("\n\nConfusion matrix:\n")
        file.write("Rows = actual, columns = predicted\n")
        file.write("Classes: " + json.dumps(class_names) + "\n")
        file.write(np.array2string(matrix))
        file.write("\n\nPer-class test accuracy:\n")

        for index, name in enumerate(class_names):
            class_indices = [
                i for i, actual in enumerate(true_labels)
                if actual == index
            ]

            correct = sum(
                1 for i in class_indices
                if predicted_labels[i] == index
            )

            total = len(class_indices)
            class_accuracy = correct / total if total else 0.0

            file.write(
                f"{name}: {correct}/{total} "
                f"({class_accuracy:.2%})\n"
            )

    print(f"\nUpdated report saved to: {report_path}")
    print("\nOriginal model and original test report were not modified.")


if __name__ == "__main__":
    main()
