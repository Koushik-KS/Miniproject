
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

folder = Path(__file__).resolve().parent
model_path = folder / "outputs" / "coffee_leaf_gate.keras"

photos = [
    "coffee_sample_grid.jpg",
    "phoma_sample_grid.jpg",
    "test_coffee_leaf.jpg",
]

model = tf.keras.models.load_model(model_path)

for name in photos:
    path = folder / name

    if not path.is_file():
        print(f"{name}: FILE NOT FOUND")
        continue

    with Image.open(path) as source:
        image = source.convert("RGB").resize((160, 160))

    array = np.asarray(image, dtype=np.float32)
    probability = float(
        model.predict(array[None, ...], verbose=0)[0][0]
    )

    print(f"{name}: Coffee probability = {probability * 100:.2f}%")

print("\nTest finished. No models or datasets were changed.")
