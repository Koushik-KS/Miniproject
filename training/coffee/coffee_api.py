
from pathlib import Path
import base64
import io
import json

import cv2
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
        raise RuntimeError(f"Coffee model is missing: {MODEL_PATH}")

    if not LABELS_PATH.is_file():
        raise RuntimeError(f"Coffee class labels are missing: {LABELS_PATH}")

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


# ---------------- EXPERIMENTAL LESION CONTOURS ----------------
def create_lesion_overlay(image_rgb):
    """
    Draw experimental colour-based candidate contours.
    This does not confirm disease or provide validated segmentation.
    """
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

    # Candidate orange/brown and red regions.
    orange_brown = cv2.inRange(
        hsv,
        np.array([5, 55, 25], dtype=np.uint8),
        np.array([32, 255, 250], dtype=np.uint8),
    )
    red_low = cv2.inRange(
        hsv,
        np.array([0, 55, 25], dtype=np.uint8),
        np.array([5, 255, 235], dtype=np.uint8),
    )
    red_high = cv2.inRange(
        hsv,
        np.array([170, 55, 25], dtype=np.uint8),
        np.array([179, 255, 235], dtype=np.uint8),
    )

    mask = cv2.bitwise_or(orange_brown, red_low)
    mask = cv2.bitwise_or(mask, red_high)

    # Reduce tiny noise and join small gaps inside individual spots.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    height, width = image_bgr.shape[:2]
    image_area = height * width

    min_area = max(35, int(image_area * 0.00007))
    max_area = int(image_area * 0.035)

    accepted = []

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < min_area or area > max_area:
            continue

        x, y, box_width, box_height = cv2.boundingRect(contour)

        if box_width <= 0 or box_height <= 0:
            continue

        aspect_ratio = max(
            box_width / box_height,
            box_height / box_width,
        )
        if aspect_ratio > 2.8:
            continue

        perimeter = cv2.arcLength(contour, True)
        if perimeter <= 0:
            continue

        circularity = 4 * np.pi * area / (perimeter * perimeter)

        # Exclude extremely irregular, thin colour fragments.
        if circularity < 0.08:
            continue

        accepted.append(contour)

    # Draw thin red contours on a copy; never modify the input image.
    output = image_bgr.copy()
    cv2.drawContours(output, accepted, -1, (0, 0, 255), 2)

    success, encoded = cv2.imencode(".png", output)
    if not success:
        raise RuntimeError("Could not encode lesion overlay.")

    overlay_base64 = base64.b64encode(encoded.tobytes()).decode("ascii")

    return f"data:image/png;base64,{overlay_base64}", len(accepted)


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
                original_rgb = np.asarray(
                    source.convert("RGB"),
                    dtype=np.uint8,
                )

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

        # Classifier input only: original image remains unchanged.
        model_image = Image.fromarray(original_rgb).resize(IMAGE_SIZE)
        image_array = np.asarray(model_image, dtype=np.float32)

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

        try:
            lesion_overlay, candidate_regions = create_lesion_overlay(
                original_rgb
            )
        except Exception as error:
            # Do not fail the disease classification if overlay processing fails.
            print(f"Lesion overlay processing failed: {error}")
            lesion_overlay = None
            candidate_regions = None

        return {
            "success": True,
            "crop": "Coffee",
            "predicted_class": class_names[best_index],
            "confidence": round(
                float(probabilities[best_index]) * 100, 2
            ),
            "probabilities": {
                name: round(float(probabilities[index]) * 100, 4)
                for index, name in enumerate(class_names)
            },
            "lesion_overlay": lesion_overlay,
            "candidate_regions": candidate_regions,
            "localization_note": (
                "Red outlines are experimental colour-based candidates, "
                "not confirmed disease lesions. No validated disease-area "
                "or severity measurement is provided."
            ),
            "warning": (
                "Prediction is experimental and must be verified. "
                "Confidence is not a confirmed diagnosis."
            ),
        }

    finally:
        await file.close()
