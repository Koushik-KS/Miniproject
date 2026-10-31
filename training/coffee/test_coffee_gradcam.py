
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "coffee_best_updated.keras"
LABELS_PATH = BASE_DIR / "outputs" / "coffee_class_names.json"
IMAGE_SIZE = (160, 160)
OUTPUT_PATH = BASE_DIR / "coffee_gradcam_test.png"


def find_last_conv_layer(base_model):
    for layer in reversed(base_model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    raise RuntimeError("No Conv2D layer found in MobileNetV2.")


def get_font(size):
    for font_path in (
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ):
        try:
            return ImageFont.truetype(font_path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    image_path = input(
        "Enter the path to one Coffee leaf image: "
    ).strip().strip('"').strip("'")

    image_path = Path(image_path)
    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    model = tf.keras.models.load_model(MODEL_PATH)
    base_model = model.get_layer("mobilenetv2_1.00_160")
    conv_name = find_last_conv_layer(base_model)

    print("Using convolutional layer:", conv_name)

    # Read class names if the training output contains them.
    class_names = None
    if LABELS_PATH.is_file():
        import json

        with LABELS_PATH.open("r", encoding="utf-8") as f:
            class_names = json.load(f)

        if isinstance(class_names, dict):
            class_names = [
                name for name, index in sorted(
                    class_names.items(), key=lambda item: item[1]
                )
            ]

    with Image.open(image_path) as source:
        original = source.convert("RGB")
        resized = original.resize(IMAGE_SIZE)

    raw = np.asarray(resized, dtype=np.float32)
    batch = tf.convert_to_tensor(raw[None, ...])

    # The training pipeline applies MobileNetV2 preprocessing
    # before sending images into the nested MobileNetV2 model.
    preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(
        batch
    )

    feature_model = tf.keras.Model(
        inputs=base_model.inputs,
        outputs=base_model.get_layer(conv_name).output,
    )

    with tf.GradientTape() as tape:
        feature_maps = feature_model(preprocessed, training=False)
        pooled = model.get_layer("global_average_pooling2d")(
            feature_maps
        )
        pooled = model.get_layer("dropout")(pooled, training=False)
        scores = model.get_layer("dense")(pooled)

        class_index = int(tf.argmax(scores[0]).numpy())
        class_score = scores[:, class_index]

    gradients = tape.gradient(class_score, feature_maps)
    if gradients is None:
        raise RuntimeError("Grad-CAM gradients could not be calculated.")

    weights = tf.reduce_mean(
        gradients, axis=(1, 2), keepdims=True
    )
    heatmap = tf.reduce_sum(weights * feature_maps, axis=-1)[0]
    heatmap = tf.nn.relu(heatmap)
    heatmap = tf.math.divide_no_nan(
        heatmap, tf.reduce_max(heatmap)
    )

    heatmap = tf.image.resize(
        heatmap[..., None], IMAGE_SIZE
    ).numpy()[..., 0]
    heatmap = np.clip(heatmap, 0, 1)

    probabilities = tf.nn.softmax(scores, axis=-1).numpy()[0]
    confidence = float(probabilities[class_index]) * 100

    if class_names and class_index < len(class_names):
        predicted_class = str(class_names[class_index])
    else:
        predicted_class = f"Class {class_index}"

    print("Predicted class:", predicted_class)
    print(f"Confidence: {confidence:.2f}%")

    # Create a colored heatmap (blue -> yellow -> red).
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        colored = plt.get_cmap("jet")(heatmap)[..., :3]
        colored = (colored * 255).astype(np.uint8)
    except ImportError as exc:
        raise RuntimeError(
            "Install matplotlib in the active virtual environment: "
            "python -m pip install matplotlib"
        ) from exc

    heatmap_rgb = Image.fromarray(colored, mode="RGB")
    heatmap_rgb = heatmap_rgb.resize(
        (480, 480), Image.Resampling.BILINEAR
    )

    # Enlarge the original image for clearer visual inspection.
    original_large = resized.resize(
        (480, 480), Image.Resampling.LANCZOS
    )

    # Blend the heatmap over the original image.
    overlay = Image.blend(original_large, heatmap_rgb, 0.45)

    # Build a labeled three-panel output image.
    header_height = 76
    panel_width = 480
    panel_height = 480
    gap = 16
    margin = 20

    canvas_width = margin * 2 + panel_width * 3 + gap * 2
    canvas_height = header_height + panel_height + margin
    canvas = Image.new(
        "RGB", (canvas_width, canvas_height), (25, 30, 38)
    )
    draw = ImageDraw.Draw(canvas)
    title_font = get_font(23)
    info_font = get_font(18)

    draw.text(
        (margin, 12),
        f"Prediction: {predicted_class}  |  Confidence: {confidence:.2f}%",
        font=title_font,
        fill=(255, 255, 255),
    )

    panels = [
        ("Original leaf", original_large),
        ("Grad-CAM heatmap", heatmap_rgb),
        ("Attention overlay", overlay),
    ]

    for i, (title, panel) in enumerate(panels):
        x = margin + i * (panel_width + gap)
        draw.text(
            (x, 48), title, font=info_font, fill=(220, 225, 235)
        )
        canvas.paste(panel, (x, header_height))

    canvas.save(OUTPUT_PATH)
    print("Visualization saved to:", OUTPUT_PATH)
    print(
        "Grad-CAM is an approximate attention explanation, "
        "not a verified disease mask or exact boundary."
    )


if __name__ == "__main__":
    main()
