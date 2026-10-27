
from pathlib import Path
import json
import io

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, HTTPException, UploadFile

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "coffee_best.keras"
LABELS_PATH = BASE_DIR / "outputs" / "coffee_class_names.json"

IMAGE_SIZE = (160, 160)
MAX_FILE_SIZE = 5 * 1024 * 1024

app = FastAPI(title="KisanVision AI - Coffee Prediction API")

model = None
class_names = []


@app.on_event("startup")
def load_model():
    global model, class_names

    if not MODEL_PATH.is_file() or not LABELS_PATH.is_file():
        raise RuntimeError("Coffee model or class labels file is missing.")

    with LABELS_PATH.open("r", encoding="utf-8") as file:
        class_names = json.load(file)

    model = tf.keras.models.load_model(MODEL_PATH)


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "KisanVision AI Coffee API",
        "model_loaded": model is not None,
    }


@app.post("/predict/coffee")
async def predict_coffee(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Coffee model is not loaded.")

    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WebP image.",
        )

    image_bytes = await file.read(MAX_FILE_SIZE + 1)
    if not image_bytes or len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image is empty or exceeds the 5 MB limit.",
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"}:
                raise HTTPException(status_code=400, detail="Unsupported image format.")

            image = source.convert("RGB")
            image = image.resize(IMAGE_SIZE)
            image_array = np.asarray(image, dtype=np.float32)

    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")

    probabilities = model.predict(
        np.expand_dims(image_array, axis=0),
        verbose=0,
    )[0]

    best_index = int(np.argmax(probabilities))

    return {
        "success": True,
        "crop": "Coffee",
        "predicted_class": class_names[best_index],
        "confidence": round(float(probabilities[best_index]) * 100, 2),
        "probabilities": {
            name: round(float(probabilities[index]) * 100, 4)
            for index, name in enumerate(class_names)
        },
        "warning": "Prediction is experimental and must be verified. Confidence is not a confirmed diagnosis.",
    }
