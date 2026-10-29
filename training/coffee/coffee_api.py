from pathlib import Path
import json
import io

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ---------------- PATHS ----------------
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"

MODEL_PATH = OUTPUT_DIR / "coffee_best_updated.keras"
LABELS_PATH = OUTPUT_DIR / "coffee_class_names.json"

# ---------------- SETTINGS ----------------
IMAGE_SIZE = (160, 160)
MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}

app = FastAPI(title="KisanVision AI - Coffee Prediction API")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

model = None
class_names = []


# ---------------- LOAD MODEL ----------------
@app.on_event("startup")
def load_model():
    global model, class_names

    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Updated Coffee model is missing: {MODEL_PATH}"
        )

    if not LABELS_PATH.is_file():
        raise RuntimeError(
            f"Coffee class labels file is missing: {LABELS_PATH}"
        )

    with LABELS_PATH.open("r", encoding="utf-8") as file:
        loaded_classes = json.load(file)

    if (
        not isinstance(loaded_classes, list)
        or not loaded_classes
        or not all(isinstance(name, str) for name in loaded_classes)
    ):
        raise RuntimeError("Invalid Coffee class labels file.")

    loaded_model = tf.keras.models.load_model(MODEL_PATH)
    output_shape = loaded_model.output_shape

    if (
        not isinstance(output_shape, tuple)
        or output_shape[-1] != len(loaded_classes)
    ):
        raise RuntimeError(
            "Model output count does not match the class labels."
        )

    class_names = loaded_classes
    model = loaded_model

    print("Coffee model loaded successfully.")
    print(f"Model: {MODEL_PATH.name}")
    print(f"Classes: {class_names}")


# ---------------- HEALTH CHECK ----------------
@app.get("/health")
def health():
    return {
        "success": True,
        "service": "KisanVision AI Coffee API",
        "model_loaded": model is not None,
        "model_name": MODEL_PATH.name,
        "classes": class_names,
    }


# ---------------- COFFEE PREDICTION ----------------
@app.post("/predict/coffee")
async def predict_coffee(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Coffee model is not loaded.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WebP image.",
        )

    try:
        image_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty.",
            )

        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Image exceeds the 5 MB limit.",
            )

        try:
            with Image.open(io.BytesIO(image_bytes)) as source:
                if source.format not in ALLOWED_IMAGE_FORMATS:
                    raise HTTPException(
                        status_code=400,
                        detail="Unsupported image format.",
                    )

                source.load()
                image = source.convert("RGB")
                image = image.resize(IMAGE_SIZE)
                image_array = np.asarray(image, dtype=np.float32)

        except UnidentifiedImageError:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid image.",
            )

        except OSError:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image could not be read.",
            )

        probabilities = model.predict(
            np.expand_dims(image_array, axis=0),
            verbose=0,
        )[0]

        if (
            len(probabilities) != len(class_names)
            or not np.all(np.isfinite(probabilities))
        ):
            raise HTTPException(
                status_code=500,
                detail="The model returned invalid prediction output.",
            )

        best_index = int(np.argmax(probabilities))

        return {
            "success": True,
            "crop": "Coffee",
            "predicted_class": class_names[best_index],
            "confidence": round(
                float(probabilities[best_index]) * 100, 2
            ),
            "probabilities": {
                name: round(
                    float(probabilities[index]) * 100, 4
                )
                for index, name in enumerate(class_names)
            },
            "warning": (
                "Prediction is experimental and must be verified. "
                "Confidence is not a confirmed diagnosis."
            ),
        }

    finally:
        await file.close()