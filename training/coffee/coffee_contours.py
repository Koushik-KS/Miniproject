
import cv2
import numpy as np


def draw_suspected_spot_contours(image_bytes: bytes):
    """
    Draw red outlines around candidate discolored regions.
    This is a heuristic, not a validated disease segmentation model.
    """
    encoded = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid or unreadable image")

    # Resize only for processing speed; retain the original for output.
    height, width = image.shape[:2]
    scale = min(1.0, 1200 / max(height, width))

    if scale < 1.0:
        image = cv2.resize(
            image,
            (int(width * scale), int(height * scale))
        )

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Candidate colors: yellow/orange and brown/reddish regions.
    yellow_orange = cv2.inRange(
        hsv, np.array([8, 35, 35]), np.array([40, 255, 255])
    )

    reddish_low = cv2.inRange(
        hsv, np.array([0, 35, 20]), np.array([10, 255, 220])
    )
    reddish_high = cv2.inRange(
        hsv, np.array([170, 35, 20]), np.array([180, 255, 220])
    )

    mask = cv2.bitwise_or(yellow_orange, reddish_low)
    mask = cv2.bitwise_or(mask, reddish_high)

    # Reduce small isolated noise.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    output = image.copy()
    min_area = max(12, int(image.shape[0] * image.shape[1] * 0.0001))
    spots_found = 0

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < min_area:
            continue

        # Red outline around a candidate region.
        cv2.drawContours(output, [contour], -1, (0, 0, 255), 2)
        spots_found += 1

    success, result = cv2.imencode(".jpg", output)

    if not success:
        raise RuntimeError("Could not encode the result image")

    return result.tobytes(), spots_found
