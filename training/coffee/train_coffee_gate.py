
from pathlib import Path
import csv
import random

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError

# =========================================================
# KisanVision AI - Coffee Leaf Validation Gate
# Separate experimental model: Coffee leaf vs other images
# Does NOT overwrite the existing Coffee disease model.
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TRAINING_DIR = Path(__file__).resolve().parent

COFFEE_MANIFEST = TRAINING_DIR / "coffee_visual_safe_manifest.csv"
OUTPUT_DIR = TRAINING_DIR / "outputs"
GATE_MODEL_PATH = OUTPUT_DIR / "coffee_leaf_gate.keras"

IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8
EPOCHS = 5
SEED = 42

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# Limit examples so large datasets do not dominate training.
MAX_NEGATIVE_TRAIN_PER_CROP = 500
MAX_NEGATIVE_VAL_PER_CROP = 100

OTHER_CROP_DIRS = {
    "Arecanut": PROJECT_ROOT / "dataset" / "Arecanut",
    "Cardamom": PROJECT_ROOT / "dataset" / "Cardamom",
    "Ginger": PROJECT_ROOT / "dataset" / "Ginger",
    "Black Pepper": (
        PROJECT_ROOT / "dataset" / "Pepper"
        / "piper-nigrum-leaf-disease.v3-leafv2.yolov8"
    ),
}


def is_readable_image(path):
    """Check an image without modifying it."""
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (OSError, ValueError, UnidentifiedImageError):
        return False


def collect_records():
    """Collect Coffee positives and other-crop negative examples."""
    records = {"train": [], "validation": []}

    # Coffee images: positive class (label 1).
    if not COFFEE_MANIFEST.is_file():
        raise FileNotFoundError(
            f"Coffee manifest not found: {COFFEE_MANIFEST}"
        )

    with COFFEE_MANIFEST.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        for row in csv.DictReader(file):
            split = row["split"]

            if split not in records:
                continue

            path = PROJECT_ROOT / Path(row["relative_path"])

            if path.is_file() and is_readable_image(path):
                records[split].append((str(path), 1))

    # Other crops: negative class (label 0).
    for crop_name, crop_root in OTHER_CROP_DIRS.items():
        if not crop_root.is_dir():
            print(f"WARNING: Missing crop folder: {crop_root}")
            continue

        if crop_name == "Black Pepper":
            # Respect the dataset's existing train/valid split.
            source_folders = {
                "train": crop_root / "train" / "images",
                "validation": crop_root / "valid" / "images",
            }

            for split, folder in source_folders.items():
                if not folder.is_dir():
                    print(f"WARNING: Missing folder: {folder}")
                    continue

                images = sorted(
                    path for path in folder.rglob("*")
                    if path.is_file()
                    and path.suffix.lower() in IMAGE_EXTENSIONS
                )

                rng = random.Random(SEED)
                rng.shuffle(images)

                limit = (
                    MAX_NEGATIVE_TRAIN_PER_CROP
                    if split == "train"
                    else MAX_NEGATIVE_VAL_PER_CROP
                )

                for path in images:
                    if is_readable_image(path):
                        records[split].append((str(path), 0))
                        if sum(
                            1 for p, label in records[split]
                            if label == 0 and str(p).startswith(str(folder))
                        ) >= limit:
                            break

        else:
            # Split each image collection once; never reuse a path
            # in both training and validation.
            images = sorted(
                path for path in crop_root.rglob("*")
                if path.is_file()
                and path.suffix.lower() in IMAGE_EXTENSIONS
            )

            rng = random.Random(SEED)
            rng.shuffle(images)

            cutoff = int(len(images) * 0.8)
            split_images = {
                "train": images[:cutoff],
                "validation": images[cutoff:],
            }

            limits = {
                "train": MAX_NEGATIVE_TRAIN_PER_CROP,
                "validation": MAX_NEGATIVE_VAL_PER_CROP,
            }

            for split, split_paths in split_images.items():
                accepted = 0

                for path in split_paths:
                    if is_readable_image(path):
                        records[split].append((str(path), 0))
                        accepted += 1

                        if accepted >= limits[split]:
                            break

    for split, items in records.items():
        if not items:
            raise ValueError(f"No usable images found for {split}.")

        positives = sum(label == 1 for _, label in items)
        negatives = sum(label == 0 for _, label in items)

        if positives == 0 or negatives == 0:
            raise ValueError(
                f"{split} needs both Coffee and other-crop images. "
                f"Coffee={positives}, other={negatives}"
            )

        print(
            f"{split}: {len(items)} images | "
            f"Coffee={positives} | other crops={negatives}"
        )

    # Shuffle records reproducibly.
    random.Random(SEED).shuffle(records["train"])
    random.Random(SEED).shuffle(records["validation"])

    return records


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

    return image, tf.cast(label, tf.float32)


def make_dataset(records, training=False):
    paths = [path for path, _ in records]
    labels = [label for _, label in records]

    dataset = tf.data.Dataset.from_tensor_slices((paths, labels))

    if training:
        dataset = dataset.shuffle(
            buffer_size=len(records),
            seed=SEED,
            reshuffle_each_iteration=True,
        )

    dataset = dataset.map(
        decode_image,
        num_parallel_calls=2,
    )

    return dataset.batch(BATCH_SIZE).prefetch(1)


def build_model():
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))

    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)

    # 1 = Coffee image, 0 = other crop image.
    outputs = tf.keras.layers.Dense(
        1,
        activation="sigmoid",
        name="coffee_leaf_probability",
    )(x)

    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )

    return model


def main():
    random.seed(SEED)
    np.random.seed(SEED)
    tf.random.set_seed(SEED)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("KisanVision AI - Coffee Leaf Gate")
    print(f"TensorFlow: {tf.__version__}")
    print(f"Image size: {IMAGE_SIZE}")
    print(f"Epochs: {EPOCHS}")
    print("Device: CPU")
    print("Existing Coffee disease model will not be overwritten.")

    records = collect_records()

    train_dataset = make_dataset(records["train"], training=True)
    validation_dataset = make_dataset(records["validation"])

    model = build_model()
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=2,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.CSVLogger(
            str(OUTPUT_DIR / "coffee_gate_training_log.csv")
        ),
    ]

    model.fit(
        train_dataset,
        validation_data=validation_dataset,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )

    model.save(GATE_MODEL_PATH)

    print("\nGate training finished.")
    print(f"Gate model saved to: {GATE_MODEL_PATH}")
    print("1 = Coffee image; 0 = other crop image.")
    print(
        "IMPORTANT: This gate has not yet been validated against "
        "cars, buses, unrelated objects, or independent farmer photos."
    )
    print("Do not connect it to the live API until it passes testing.")


if __name__ == "__main__":
    main()
