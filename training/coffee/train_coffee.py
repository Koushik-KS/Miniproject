
from pathlib import Path
import csv
import json
import random

import numpy as np
import tensorflow as tf

# ---------------- CONFIGURATION ----------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).resolve().parent / "coffee_visual_safe_manifest.csv"
OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"

IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8
EPOCHS = 10
SEED = 42

CLASS_NAMES = [
    "Cercospora",
    "Healthy",
    "Leaf Rust",
    "Miner",
    "Phoma",
]

# ---------------- REPRODUCIBILITY ----------------
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


def load_manifest():
    if not MANIFEST.is_file():
        raise FileNotFoundError(f"Manifest not found: {MANIFEST}")

    with MANIFEST.open("r", newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    records = {"train": [], "validation": [], "test": []}

    for row in rows:
        split = row["split"]
        label = row["class"]
        image_path = PROJECT_ROOT / Path(row["relative_path"])

        if split not in records:
            raise ValueError(f"Unexpected split: {split}")

        if label not in CLASS_NAMES:
            raise ValueError(f"Unexpected class: {label}")

        if not image_path.is_file():
            raise FileNotFoundError(image_path)

        records[split].append((str(image_path), CLASS_NAMES.index(label)))

    for split, items in records.items():
        if not items:
            raise ValueError(f"No images found for split: {split}")

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
    return image, label


def make_dataset(records, training=False):
    paths = [item[0] for item in records]
    labels = [item[1] for item in records]

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

    dataset = dataset.batch(BATCH_SIZE)
    dataset = dataset.prefetch(1)
    return dataset


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("KisanVision AI - Coffee Model Training")
    print(f"TensorFlow: {tf.__version__}")
    print(f"Image size: {IMAGE_SIZE}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Epochs: {EPOCHS}")
    print("Device: CPU")

    records = load_manifest()

    for split, items in records.items():
        counts = {
            name: sum(1 for _, label in items if label == index)
            for index, name in enumerate(CLASS_NAMES)
        }
        print(f"\n{split.upper()}: {len(items)} images")
        for name, count in counts.items():
            print(f"  {name}: {count}")

    train_ds = make_dataset(records["train"], training=True)
    val_ds = make_dataset(records["validation"])

    print("\nLoading pretrained MobileNetV2...")
    try:
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(*IMAGE_SIZE, 3),
            include_top=False,
            weights="imagenet",
        )
    except Exception as error:
        raise RuntimeError(
            "Could not load MobileNetV2 ImageNet weights. "
            "Check internet access and try again. "
            "No random-weight fallback was used."
        ) from error

    base_model.trainable = False

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(
        len(CLASS_NAMES),
        activation="softmax",
    )(x)

    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    best_model_path = OUTPUT_DIR / "coffee_best.keras"

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(best_model_path),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=3,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.CSVLogger(
            str(OUTPUT_DIR / "coffee_training_log.csv")
        ),
    ]

    print("\nStarting training...")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )

    final_model_path = OUTPUT_DIR / "coffee_final.keras"
    model.save(final_model_path)

    labels_path = OUTPUT_DIR / "coffee_class_names.json"
    with labels_path.open("w", encoding="utf-8") as file:
        json.dump(CLASS_NAMES, file, indent=2)

    print("\nTraining finished.")
    print(f"Best model: {best_model_path}")
    print(f"Final model: {final_model_path}")
    print(f"Class labels: {labels_path}")
    print("The test split was not used during training.")


if __name__ == "__main__":
    main()
