
import { Router } from "express";
import { getCoffeeResearch } from "../services/coffeeResearchService.js";

const router = Router();

const ALLOWED_CLASSES = new Set([
  "Cercospora",
  "Leaf Rust",
  "Miner",
  "Phoma",
  "Healthy",
]);

// GET /api/research/coffee?class=Leaf%20Rust
router.get("/coffee", async (req, res) => {
  try {
    const diseaseClass = req.query.class;

    if (
      typeof diseaseClass !== "string" ||
      !ALLOWED_CLASSES.has(diseaseClass)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid coffee prediction class: Cercospora, Leaf Rust, Miner, Phoma or Healthy.",
      });
    }

    const research = await getCoffeeResearch(diseaseClass);

    return res.json({
      success: true,
      ...research,
    });
  } catch (error) {
    console.error("Coffee research lookup failed:", error.message);

    return res.status(error.statusCode || 502).json({
      success: false,
      message:
        error.statusCode === 400
          ? error.message
          : "Unable to retrieve coffee research right now. Please try again later.",
    });
  }
});

export default router;
