
from pathlib import Path
import json
import sys

import numpy as np
import tensorflow as tf

# Existing model and labels: read-only
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "coffee_best_updated.keras"
LABELS_PATH = BASE_DIR / "outputs" / "coffee_class_names.json"

IMAGE_SIZE = (160, 160)


def main():
    if len(sys.argv) != 3:
        print(
            'Usage: python test_new_coffee_images.py '
            '"path_to_healthy_image" "path_to_diseased_image"'
        )
        sys.exit(1)

    image_paths = [Path(arg).resolve() for arg in sys.argv[1:]]

    for path in image_paths:
        if not path.is_file():
            raise FileNotFoundError(f"Image not found: {path}")

    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not LABELS_PATH.is_file():
        raise FileNotFoundError(f"Class names not found: {LABELS_PATH}")

    with LABELS_PATH.open("r", encoding="utf-8") as f:
        class_names = json.load(f)

    model = tf.keras.models.load_model(MODEL_PATH)

    if model.output_shape[-1] != len(class_names):
        raise ValueError("Model output count does not match class names.")

    print("Existing Coffee model loaded.")
    print("No training, dataset changes, or model saving will occur.")

    for image_path in image_paths:
        # Read image without modifying the original file.
        image_bytes = tf.io.read_file(str(image_path))
        image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False,
        )
        image.set_shape([None, None, 3])
        image = tf.image.resize(image, IMAGE_SIZE)
        image = tf.cast(image, tf.float32)

        # The saved model contains MobileNetV2 preprocessing.
        probabilities = model.predict(
            tf.expand_dims(image, axis=0),
            verbose=0,
        )[0]

        predicted_index = int(np.argmax(probabilities))

        print("\n" + "=" * 45)
        print("Image:", image_path.name)
        print("Predicted class:", class_names[predicted_index])
        print(
            "Model score:",
            f"{probabilities[predicted_index] * 100:.2f}%"
        )
        print("\nScores for all five classes:")

        for index in np.argsort(probabilities)[::-1]:
            print(
                f"  {class_names[index]}: "
                f"{probabilities[index] * 100:.2f}%"
            )

    print("\nTest complete. No files were written by this script.")


if __name__ == "__main__":
    main()
