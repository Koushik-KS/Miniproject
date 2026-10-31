
from pathlib import Path

import cv2
import numpy as np

BASE_DIR = Path(__file__).resolve().parent


def main():
    image_path = input(
        "Enter the path to your diseased coffee leaf image: "
    ).strip().strip('"').strip("'")

    source_path = Path(image_path)
    if not source_path.is_file():
        raise FileNotFoundError(f"Image not found: {source_path}")

    image = cv2.imread(str(source_path))
    if image is None:
        raise ValueError("Could not read the input image.")

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Detect saturated orange, brown-orange, and red candidates.
    orange = cv2.inRange(
        hsv,
        np.array([5, 85, 30]),
        np.array([27, 255, 245]),
    )
    red1 = cv2.inRange(
        hsv,
        np.array([0, 85, 30]),
        np.array([5, 255, 220]),
    )
    red2 = cv2.inRange(
        hsv,
        np.array([170, 85, 30]),
        np.array([179, 255, 220]),
    )

    mask = cv2.bitwise_or(orange, red1)
    mask = cv2.bitwise_or(mask, red2)

    # Remove isolated noise and close small gaps in candidate regions.
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (3, 3)
    )
    mask = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN, kernel
    )
    mask = cv2.morphologyEx(
        mask, cv2.MORPH_CLOSE, kernel
    )

    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    output = image.copy()
    image_area = image.shape[0] * image.shape[1]

    # Filter out tiny fragments and unusually large regions.
    min_area = max(50, int(image_area * 0.00015))
    max_area = int(image_area * 0.08)

    accepted = []

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < min_area or area > max_area:
            continue

        x, y, w, h = cv2.boundingRect(contour)

        if w == 0 or h == 0:
            continue

        # Reject many long, narrow regions, including vein fragments.
        aspect_ratio = max(w / h, h / w)
        if aspect_ratio > 2.5:
            continue

        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue

        # Filter some thin or highly irregular colour fragments.
        circularity = (
            4 * np.pi * area / (perimeter * perimeter)
        )
        if circularity < 0.10:
            continue

        accepted.append(contour)

    # Draw thin red contours on a copy, not the original image.
    cv2.drawContours(
        output,
        accepted,
        -1,
        (0, 0, 255),
        thickness=2,
    )

    output_path = BASE_DIR / "coffee_lesion_contours_improved.png"

    if not cv2.imwrite(str(output_path), output):
        raise RuntimeError("Could not save the output image.")

    print("Candidate regions outlined:", len(accepted))
    print("Output saved to:", output_path)
    print(
        "Note: colour-based candidates are not confirmed "
        "disease lesions."
    )


if __name__ == "__main__":
    main()
