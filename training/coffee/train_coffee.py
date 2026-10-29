
from pathlib import Path
import csv
import json
import random

import numpy as np
import tensorflow as tf

# ---------------- CONFIGURATION ----------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Use the updated manifest containing the new healthy Coffee images.
MANIFEST = (
    Path(__file__).resolve().parent
    / "coffee_visual_safe_manifest_updated.csv"
)

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"

IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8
EPOCHS = 10
SEED = 42

# Save new models separately to protect the existing working model.
BEST_MODEL_NAME = "coffee_best_updated.keras"
FINAL_MODEL_NAME = "coffee_final_updated.keras"
LOG_NAME = "coffee_training_log_updated.csv"

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
        raise FileNotFoundError(
            f"Updated manifest not found: {MANIFEST}"
        )

    with MANIFEST.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        rows = list(csv.DictReader(file))

    required_columns = {
        "relative_path",
        "class",
        "split",
        "visual_hash",
    }

    if not rows:
        raise ValueError("The updated manifest is empty.")

    if not required_columns.issubset(rows[0]):
        raise ValueError(
            "The manifest is missing required columns: "
            f"{required_columns - set(rows[0])}"
        )

    records = {
        "train": [],
        "validation": [],
        "test": [],
    }

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

        records[split].append(
            (str(image_path), CLASS_NAMES.index(label))
        )

    for split, items in records.items():
        if not items:
            raise ValueError(
                f"No images found for split: {split}"
            )

    # Confirm each class exists in all three splits.
    for split, items in records.items():
        present_classes = {label for _, label in items}
        missing_classes = set(range(len(CLASS_NAMES))) - present_classes

        if missing_classes:
            missing_names = [
                CLASS_NAMES[index]
                for index in sorted(missing_classes)
            ]
            raise ValueError(
                f"Missing classes in {split}: {missing_names}"
            )

    # Verify identical visual hashes do not cross splits.
    with MANIFEST.open(
        "r", newline="", encoding="utf-8"
    ) as file:
        all_rows = list(csv.DictReader(file))

    hash_splits = {}

    for row in all_rows:
        visual_hash = row["visual_hash"]
        split = row["split"]

        if visual_hash in hash_splits:
            hash_splits[visual_hash].add(split)
        else:
            hash_splits[visual_hash] = {split}

    leakage_count = sum(
        1 for splits in hash_splits.values()
        if len(splits) > 1
    )

    if leakage_count:
        raise ValueError(
            f"Visual-hash leakage detected: {leakage_count} groups."
        )

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

    dataset = tf.data.Dataset.from_tensor_slices(
        (paths, labels)
    )

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

    best_model_path = OUTPUT_DIR / BEST_MODEL_NAME
    final_model_path = OUTPUT_DIR / FINAL_MODEL_NAME
    log_path = OUTPUT_DIR / LOG_NAME

    # Avoid accidentally overwriting a previous updated model.
    protected_outputs = [
        best_model_path,
        final_model_path,
        log_path,
    ]

    existing_outputs = [
        path for path in protected_outputs
        if path.exists()
    ]

    if existing_outputs:
        raise FileExistsError(
            "Updated training output already exists. "
            "No files were overwritten:\n"
            + "\n".join(str(path) for path in existing_outputs)
        )

    print("KisanVision AI - Updated Coffee Model Training")
    print(f"TensorFlow: {tf.__version__}")
    print(f"Manifest: {MANIFEST.name}")
    print(f"Image size: {IMAGE_SIZE}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Maximum epochs: {EPOCHS}")
    print("Device: CPU")
    print(f"New best model: {best_model_path.name}")
    print(f"New final model: {final_model_path.name}")

    records = load_manifest()

    for split, items in records.items():
        counts = {
            name: sum(
                1 for _, label in items
                if label == index
            )
            for index, name in enumerate(CLASS_NAMES)
        }

        print(f"\n{split.upper()}: {len(items)} images")

        for name, count in counts.items():
            print(f"  {name}: {count}")

    train_ds = make_dataset(
        records["train"],
        training=True,
    )

    val_ds = make_dataset(
        records["validation"]
    )

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

    # Train the classification head first.
    base_model.trainable = False

    inputs = tf.keras.Input(
        shape=(*IMAGE_SIZE, 3)
    )

    x = tf.keras.applications.mobilenet_v2.preprocess_input(
        inputs
    )

    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)

    outputs = tf.keras.layers.Dense(
        len(CLASS_NAMES),
        activation="softmax",
    )(x)

    model = tf.keras.Model(
        inputs=inputs,
        outputs=outputs,
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=0.001
        ),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

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
            str(log_path)
        ),
    ]

    print("\nStarting training...")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )

    # Save the final epoch's/restored model separately.
    model.save(final_model_path)

    print("\nTraining finished.")

    if history.history.get("val_accuracy"):
        best_val_accuracy = max(
            history.history["val_accuracy"]
        )
        print(
            "Best validation accuracy: "
            f"{best_val_accuracy:.4f}"
        )

    if history.history.get("val_loss"):
        best_val_loss = min(
            history.history["val_loss"]
        )
        print(
            "Best validation loss: "
            f"{best_val_loss:.4f}"
        )

    print(f"Best model: {best_model_path}")
    print(f"Final model: {final_model_path}")
    print(f"Training log: {log_path}")

    print(
        "\nThe test split was not used for training. "
        "Evaluate it separately before choosing the production model."
    )


if __name__ == "__main__":
    main()
