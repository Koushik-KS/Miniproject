import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCloudUploadAlt, FaCamera, FaTimes, FaLeaf, FaSearch, FaHistory,
  FaBookOpen, FaExternalLinkAlt, FaSyncAlt, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaSeedling, FaMicroscope,
  FaInfoCircle, FaTrash, FaImage, FaChartBar, FaGlobe,
} from "react-icons/fa";
import "./DiseaseDetection.css";

const COFFEE_API_URL =
  import.meta.env.VITE_COFFEE_API_URL || "http://127.0.0.1:8000/predict/coffee";
const COFFEE_RESEARCH_URL =
  import.meta.env.VITE_COFFEE_RESEARCH_URL || "http://localhost:5000/api/research/coffee";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HISTORY_STORAGE_KEY = "kisanvision_crop_prediction_history";

const CROPS = [
  { id: "Coffee", scientific: "Coffea spp.", connected: true },
  { id: "Arecanut", scientific: "Areca catechu", connected: false },
  { id: "Cardamom", scientific: "Elettaria cardamomum", connected: false },
  { id: "Ginger", scientific: "Zingiber officinale", connected: false },
  { id: "Black Pepper", scientific: "Piper nigrum", connected: false },
];

const COFFEE_CLASSES = ["Cercospora", "Leaf Rust", "Miner", "Phoma", "Healthy"];

const DISEASE_INFORMATION = {
  Cercospora: {
    title: "Cercospora Leaf Spot", scientificName: "Cercospora coffeicola",
    category: "Fungal disease",
    description: "Cercospora leaf spot is a fungal disease that affects coffee leaves and can also affect coffee berries.",
    symptoms: ["Circular brown spots on leaves", "Yellow areas surrounding affected spots", "Dry or damaged leaf tissue", "Premature leaf fall in severe cases"],
    prevention: ["Maintain appropriate plant spacing.", "Avoid excessive moisture around plants.", "Maintain balanced plant nutrition.", "Remove severely affected plant material where appropriate."],
    treatment: "Confirm the disease in the field before applying a treatment. Consult local agricultural experts for an appropriate fungicide and application instructions."
  },
  "Leaf Rust": {
    title: "Coffee Leaf Rust", scientificName: "Hemileia vastatrix",
    category: "Fungal disease",
    description: "Coffee leaf rust is a fungal disease that mainly affects coffee leaves and can cause defoliation and reduced plant productivity.",
    symptoms: ["Yellow-orange powdery spots on the underside of leaves", "Yellow patches on the upper leaf surface", "Leaf yellowing", "Premature leaf fall"],
    prevention: ["Use suitable resistant or tolerant coffee varieties.", "Maintain appropriate plant spacing.", "Monitor plants regularly.", "Maintain balanced nutrition and good plantation management."],
    treatment: "Confirm the infection before treatment. Consult local agricultural experts about registered fungicides and integrated disease management."
  },
  Miner: {
    title: "Coffee Leaf Miner", scientificName: "Leucoptera coffeella",
    category: "Insect pest",
    description: "Coffee leaf miner is an insect pest. Its larvae feed inside the leaf tissue, producing visible mines.",
    symptoms: ["Irregular mines inside leaves", "Brown or dry patches", "Damaged leaf tissue", "Premature leaf fall in severe infestations"],
    prevention: ["Monitor leaves regularly for mining symptoms.", "Maintain plantation hygiene.", "Protect beneficial natural enemies.", "Follow integrated pest management practices."],
    treatment: "Confirm the presence of the pest before treatment. Consult local agricultural experts about appropriate integrated pest management options."
  },
  Phoma: {
    title: "Phoma Disease", scientificName: "Phoma spp.",
    category: "Fungal disease",
    description: "Phoma-related diseases can affect coffee leaves, shoots, and other plant parts depending on the pathogen and environmental conditions.",
    symptoms: ["Dark necrotic leaf lesions", "Leaf tissue damage", "Affected shoots or young plant parts", "Drying of affected tissue"],
    prevention: ["Monitor plants for early symptoms.", "Maintain appropriate plantation ventilation.", "Avoid unnecessary leaf wetness.", "Remove severely affected plant material where appropriate."],
    treatment: "Confirm the causal pathogen before selecting a treatment. Consult a local agricultural expert for disease-specific recommendations."
  },
  Healthy: {
    title: "Healthy Coffee Leaf", scientificName: "No disease detected",
    category: "Healthy prediction",
    description: "The model classified the uploaded image as Healthy. This does not guarantee that the entire plant is disease-free.",
    symptoms: ["No supported disease class was predicted.", "The uploaded image was classified as healthy by the model."],
    prevention: ["Continue regular plantation monitoring.", "Maintain balanced nutrition.", "Monitor environmental conditions.", "Inspect both sides of leaves regularly."],
    treatment: "No disease-specific treatment is indicated by this prediction."
  }
};

const TEXT = {
  en: {
    title: "Crop Disease Detection", subtitle: "AI-powered crop health assessment system",
    checking: "Checking API...", connected: "Coffee Prediction API Connected", offline: "Coffee Prediction API Offline",
    detect: "Disease Detection", info: "Disease Information", history: "Prediction History",
    crop: "Select crop for analysis", connectedModel: "AI model connected", pending: "Model pending",
    pendingNotice: "A trained and tested prediction model is not connected for this crop yet.",
    intro: "Analyze Your Crop Leaf", introText: "Select a supported crop, then upload a clear leaf image or capture one using your camera.",
    upload: "Upload Leaf Image", choose: "Choose a leaf image", uploadText: "Select an image from your device. JPG, PNG or WEBP; maximum 5 MB.",
    browse: "Browse Image", change: "Change Image", remove: "Remove image", cameraText: "Or use your device camera",
    openCamera: "Open Camera", capture: "Capture Photo", cancel: "Cancel", cameraTitle: "Capture Leaf Image",
    analyze: "Analyze Disease", analyzing: "Analyzing Image...", guidelines: "Image Guidelines",
    clear: "Clear image", clearText: "Capture the leaf with clear visible details.",
    lighting: "Good lighting", lightingText: "Avoid very dark or overexposed images.",
    focus: "Focus on the leaf", focusText: "Keep the leaf clearly visible in the image.",
    supported: "Selected crop", classes: "Supported Coffee Prediction Classes",
    apiWarning: "Start the Python Coffee prediction API before analyzing an image.",
    result: "ANALYSIS RESULT", completed: "Prediction Completed", healthy: "Healthy",
    detected: "Disease / Pest Detected", predicted: "PREDICTED CLASS", confidence: "Model Confidence",
    category: "Category", probabilities: "Class Probability Distribution", symptoms: "Common Symptoms",
    prevention: "Prevention", management: "Management Guidance", research: "View Research Information",
    newAnalysis: "New Analysis", disclaimer: "This result is an AI-generated prediction, not a confirmed field diagnosis. Verify it with an agricultural expert before taking crop-management decisions.",
    experimental: "Experimental Disease-Area Highlighting", original: "Original Leaf", candidates: "Candidate Regions",
    regions: "Candidate regions detected", experimentalNote: "Red outlines are experimental colour-based candidates, not confirmed disease lesions. No validated disease-area segmentation or severity measurement is provided.",
    researchTitle: "Coffee Disease Research", researchText: "Research publications retrieved from the connected research service.",
    refresh: "Refresh Research", selectClass: "Select Coffee Class", updated: "Last updated",
    noResearchTitle: "No disease-specific research", noResearchText: "Healthy is a prediction class, not a disease. Disease-specific publications are not applicable.",
    loadingResearch: "Retrieving research publications...", retry: "Retry", publications: "Research Publications",
    results: "results", abstract: "Abstract", viewPublication: "View Publication",
    historyTitle: "Prediction History", historyText: "Previously analyzed crop leaf images.",
    clearHistory: "Clear History", noHistory: "No Prediction History", noHistoryText: "Your completed predictions will appear here.",
    start: "Start Analysis", view: "View Result", confidenceLabel: "Confidence",
    language: "Language", english: "English", kannada: "ಕನ್ನಡ",
    confirmClear: "Are you sure you want to clear all prediction history?",
    invalidType: "Please upload a JPG, PNG, or WEBP image.", tooLarge: "Image size must not exceed 5 MB.",
    chooseFirst: "Please select a leaf image first.", modelPending: "The selected crop model is not connected yet. Select Coffee or wait until this crop's trained model is integrated.",
    cameraUnsupported: "Camera access is not supported by this browser.", cameraPermission: "Unable to access camera. Please check browser permissions.",
    cameraReady: "Camera is not ready. Please try again.", captureError: "Unable to capture image.",
    noClass: "The prediction API did not return a recognized class.", unsupportedClass: "Unsupported prediction class returned:",
    predictionFailed: "Prediction failed.", predictionOffline: "Unable to analyze image. Check the Python prediction server.",
    researchFailed: "Research request failed.", researchOffline: "Unable to retrieve Coffee research. Check the Node.js server.",
    noMatches: "No matching research publications were returned by the research service.",
    dateUnavailable: "Date unavailable", authorsUnavailable: "Authors unavailable", untitled: "Untitled publication",
    source: "Research database", doi: "DOI"
  },
  kn: {
    title: "ಬೆಳೆ ರೋಗ ಪತ್ತೆ", subtitle: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಆಧಾರಿತ ಬೆಳೆ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ",
    checking: "API ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...", connected: "ಕಾಫಿ ಭವಿಷ್ಯ API ಸಂಪರ್ಕಗೊಂಡಿದೆ", offline: "ಕಾಫಿ ಭವಿಷ್ಯ API ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲ",
    detect: "ರೋಗ ಪತ್ತೆ", info: "ರೋಗ ಮಾಹಿತಿ", history: "ಭವಿಷ್ಯ ಇತಿಹಾಸ",
    crop: "ವಿಶ್ಲೇಷಣೆಗೆ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ", connectedModel: "AI ಮಾದರಿ ಸಂಪರ್ಕಗೊಂಡಿದೆ", pending: "ಮಾದರಿ ಬಾಕಿಯಿದೆ",
    pendingNotice: "ಈ ಬೆಳೆಗೆ ತರಬೇತಿ ಪಡೆದ ಮತ್ತು ಪರೀಕ್ಷಿಸಿದ ಭವಿಷ್ಯ ಮಾದರಿ ಇನ್ನೂ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.",
    intro: "ನಿಮ್ಮ ಬೆಳೆ ಎಲೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ", introText: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ. ನಂತರ ಸ್ಪಷ್ಟವಾದ ಎಲೆಯ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕ್ಯಾಮೆರಾದಿಂದ ಸೆರೆಹಿಡಿಯಿರಿ.",
    upload: "ಎಲೆಯ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್", choose: "ಎಲೆಯ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ", uploadText: "ನಿಮ್ಮ ಸಾಧನದಿಂದ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ. JPG, PNG ಅಥವಾ WEBP; ಗರಿಷ್ಠ 5 MB.",
    browse: "ಚಿತ್ರ ಆಯ್ಕೆ", change: "ಚಿತ್ರ ಬದಲಾಯಿಸಿ", remove: "ಚಿತ್ರ ತೆಗೆದುಹಾಕಿ", cameraText: "ಅಥವಾ ಸಾಧನದ ಕ್ಯಾಮೆರಾ ಬಳಸಿ",
    openCamera: "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ", capture: "ಫೋಟೋ ಸೆರೆಹಿಡಿಯಿರಿ", cancel: "ರದ್ದುಮಾಡಿ", cameraTitle: "ಎಲೆಯ ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ",
    analyze: "ರೋಗ ವಿಶ್ಲೇಷಿಸಿ", analyzing: "ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...", guidelines: "ಚಿತ್ರ ಮಾರ್ಗಸೂಚಿಗಳು",
    clear: "ಸ್ಪಷ್ಟ ಚಿತ್ರ", clearText: "ಎಲೆಯ ವಿವರಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ.",
    lighting: "ಉತ್ತಮ ಬೆಳಕು", lightingText: "ತುಂಬಾ ಕತ್ತಲೆಯಾದ ಅಥವಾ ಅತಿಯಾದ ಬೆಳಕಿನ ಚಿತ್ರಗಳನ್ನು ತಪ್ಪಿಸಿ.",
    focus: "ಎಲೆಯ ಮೇಲೆ ಗಮನ", focusText: "ಚಿತ್ರದಲ್ಲಿ ಎಲೆ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ ಇರಲಿ.",
    supported: "ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆ", classes: "ಕಾಫಿಗೆ ಬೆಂಬಲಿತ ಭವಿಷ್ಯ ವರ್ಗಗಳು",
    apiWarning: "ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸುವ ಮೊದಲು Python ಕಾಫಿ ಭವಿಷ್ಯ API ಪ್ರಾರಂಭಿಸಿ.",
    result: "ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ", completed: "ಭವಿಷ್ಯ ಪೂರ್ಣಗೊಂಡಿದೆ", healthy: "ಆರೋಗ್ಯಕರ",
    detected: "ರೋಗ / ಕೀಟ ಪತ್ತೆಯಾಗಿದೆ", predicted: "ಊಹಿಸಲಾದ ವರ್ಗ", confidence: "ಮಾದರಿ ವಿಶ್ವಾಸಮಟ್ಟ",
    category: "ವರ್ಗ", probabilities: "ವರ್ಗಗಳ ಸಂಭವನೀಯತೆ", symptoms: "ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳು",
    prevention: "ತಡೆಗಟ್ಟುವಿಕೆ", management: "ನಿರ್ವಹಣಾ ಮಾರ್ಗದರ್ಶನ", research: "ಸಂಶೋಧನಾ ಮಾಹಿತಿ ನೋಡಿ",
    newAnalysis: "ಹೊಸ ವಿಶ್ಲೇಷಣೆ", disclaimer: "ಇದು AI ಆಧಾರಿತ ಭವಿಷ್ಯವಾಣಿ ಮಾತ್ರ; ಖಚಿತ ಕ್ಷೇತ್ರ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಬೆಳೆ ನಿರ್ವಹಣಾ ನಿರ್ಧಾರಗಳ ಮೊದಲು ಕೃಷಿ ತಜ್ಞರಿಂದ ದೃಢೀಕರಿಸಿ.",
    experimental: "ಪ್ರಾಯೋಗಿಕ ರೋಗ ಪ್ರದೇಶ ಗುರುತಿಸುವಿಕೆ", original: "ಮೂಲ ಎಲೆ", candidates: "ಸಂಭಾವ್ಯ ಪ್ರದೇಶಗಳು",
    regions: "ಗುರುತಿಸಿದ ಸಂಭಾವ್ಯ ಪ್ರದೇಶಗಳು", experimentalNote: "ಕೆಂಪು ಗಡಿಗಳು ಬಣ್ಣ ಆಧಾರಿತ ಪ್ರಾಯೋಗಿಕ ಪ್ರದೇಶಗಳು ಮಾತ್ರ; ದೃಢಪಟ್ಟ ರೋಗದ ಗಾಯಗಳಲ್ಲ. ದೃಢೀಕೃತ ವಿಭಜನೆ ಅಥವಾ ತೀವ್ರತೆ ಅಳತೆ ಇಲ್ಲ.",
    researchTitle: "ಕಾಫಿ ರೋಗ ಸಂಶೋಧನೆ", researchText: "ಸಂಪರ್ಕಿತ ಸಂಶೋಧನಾ ಸೇವೆಯಿಂದ ಪಡೆದ ಪ್ರಕಟಣೆಗಳು.",
    refresh: "ಸಂಶೋಧನೆ ನವೀಕರಿಸಿ", selectClass: "ಕಾಫಿ ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ", updated: "ಕೊನೆಯ ನವೀಕರಣ",
    noResearchTitle: "ರೋಗ-ನಿರ್ದಿಷ್ಟ ಸಂಶೋಧನೆ ಇಲ್ಲ", noResearchText: "ಆರೋಗ್ಯಕರವು ಭವಿಷ್ಯ ವರ್ಗ, ರೋಗವಲ್ಲ. ಆದ್ದರಿಂದ ರೋಗ-ನಿರ್ದಿಷ್ಟ ಪ್ರಕಟಣೆಗಳು ಅನ್ವಯಿಸುವುದಿಲ್ಲ.",
    loadingResearch: "ಸಂಶೋಧನಾ ಪ್ರಕಟಣೆಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...", retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", publications: "ಸಂಶೋಧನಾ ಪ್ರಕಟಣೆಗಳು",
    results: "ಫಲಿತಾಂಶಗಳು", abstract: "ಸಾರಾಂಶ", viewPublication: "ಪ್ರಕಟಣೆ ನೋಡಿ",
    historyTitle: "ಭವಿಷ್ಯ ಇತಿಹಾಸ", historyText: "ಹಿಂದೆ ವಿಶ್ಲೇಷಿಸಿದ ಬೆಳೆ ಎಲೆ ಚಿತ್ರಗಳು.",
    clearHistory: "ಇತಿಹಾಸ ಅಳಿಸಿ", noHistory: "ಭವಿಷ್ಯ ಇತಿಹಾಸವಿಲ್ಲ", noHistoryText: "ಪೂರ್ಣಗೊಂಡ ವಿಶ್ಲೇಷಣೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    start: "ವಿಶ್ಲೇಷಣೆ ಪ್ರಾರಂಭಿಸಿ", view: "ಫಲಿತಾಂಶ ನೋಡಿ", confidenceLabel: "ವಿಶ್ವಾಸಮಟ್ಟ",
    language: "ಭಾಷೆ", english: "English", kannada: "ಕನ್ನಡ",
    confirmClear: "ಎಲ್ಲಾ ಭವಿಷ್ಯ ಇತಿಹಾಸವನ್ನು ಅಳಿಸಲು ಖಚಿತವೇ?",
    invalidType: "JPG, PNG ಅಥವಾ WEBP ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.", tooLarge: "ಚಿತ್ರದ ಗಾತ್ರ 5 MB ಮೀರಬಾರದು.",
    chooseFirst: "ಮೊದಲು ಎಲೆಯ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ.", modelPending: "ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆಯ ಮಾದರಿ ಇನ್ನೂ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ. ಕಾಫಿ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಮಾದರಿ ಸಂಯೋಜನೆಯವರೆಗೆ ಕಾಯಿರಿ.",
    cameraUnsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ.", cameraPermission: "ಕ್ಯಾಮೆರಾ ತೆರೆಯಲಾಗಲಿಲ್ಲ. ಬ್ರೌಸರ್ ಅನುಮತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    cameraReady: "ಕ್ಯಾಮೆರಾ ಸಿದ್ಧವಾಗಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", captureError: "ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಲಾಗಲಿಲ್ಲ.",
    noClass: "ಭವಿಷ್ಯ API ಗುರುತಿಸಬಹುದಾದ ವರ್ಗವನ್ನು ನೀಡಿಲ್ಲ.", unsupportedClass: "ಬೆಂಬಲಿಸದ ಭವಿಷ್ಯ ವರ್ಗ:",
    predictionFailed: "ಭವಿಷ್ಯ ವಿಫಲವಾಗಿದೆ.", predictionOffline: "ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಲಾಗಲಿಲ್ಲ. Python ಸರ್ವರ್ ಪರಿಶೀಲಿಸಿ.",
    researchFailed: "ಸಂಶೋಧನಾ ವಿನಂತಿ ವಿಫಲವಾಗಿದೆ.", researchOffline: "ಕಾಫಿ ಸಂಶೋಧನೆ ಪಡೆಯಲಾಗಲಿಲ್ಲ. Node.js ಸರ್ವರ್ ಪರಿಶೀಲಿಸಿ.",
    noMatches: "ಸಂಶೋಧನಾ ಸೇವೆಯಿಂದ ಹೊಂದಾಣಿಕೆಯ ಪ್ರಕಟಣೆಗಳು ಬಂದಿಲ್ಲ.",
    dateUnavailable: "ದಿನಾಂಕ ಲಭ್ಯವಿಲ್ಲ", authorsUnavailable: "ಲೇಖಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ", untitled: "ಶೀರ್ಷಿಕೆ ಇಲ್ಲದ ಪ್ರಕಟಣೆ",
    source: "ಸಂಶೋಧನಾ ಡೇಟಾಬೇಸ್", doi: "DOI"
  }
};

const KN_DISEASE = {
  Cercospora: {
    title: "ಸರ್ಕೋಸ್ಪೋರಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ", category: "ಶಿಲೀಂಧ್ರ ರೋಗ",
    description: "ಸರ್ಕೋಸ್ಪೋರಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗವು ಕಾಫಿ ಎಲೆಗಳು ಮತ್ತು ಹಣ್ಣುಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಬಹುದು.",
    symptoms: ["ಎಲೆಗಳ ಮೇಲೆ ವೃತ್ತಾಕಾರದ ಕಂದು ಚುಕ್ಕೆಗಳು", "ಚುಕ್ಕೆಗಳ ಸುತ್ತ ಹಳದಿ ಪ್ರದೇಶಗಳು", "ಒಣಗಿದ ಅಥವಾ ಹಾನಿಗೊಂಡ ಎಲೆ ಅಂಗಾಂಶ", "ತೀವ್ರ ಸ್ಥಿತಿಯಲ್ಲಿ ಎಲೆ ಉದುರುವಿಕೆ"],
    prevention: ["ಸೂಕ್ತ ಗಿಡ ಅಂತರ ಕಾಪಾಡಿ.", "ಗಿಡಗಳ ಸುತ್ತ ಅತಿಯಾದ ತೇವಾಂಶ ತಪ್ಪಿಸಿ.", "ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ಒದಗಿಸಿ.", "ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ತೀವ್ರವಾಗಿ ಹಾನಿಗೊಂಡ ಭಾಗಗಳನ್ನು ತೆಗೆದುಹಾಕಿ."],
    treatment: "ಚಿಕಿತ್ಸೆಗೂ ಮೊದಲು ಹೊಲದಲ್ಲಿ ರೋಗವನ್ನು ದೃಢೀಕರಿಸಿ. ಸೂಕ್ತ ಶಿಲೀಂಧ್ರನಾಶಕ ಮತ್ತು ಬಳಕೆ ವಿಧಾನಕ್ಕಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  "Leaf Rust": {
    title: "ಕಾಫಿ ಎಲೆ ತುಕ್ಕು ರೋಗ", category: "ಶಿಲೀಂಧ್ರ ರೋಗ",
    description: "ಕಾಫಿ ಎಲೆ ತುಕ್ಕು ರೋಗವು ಮುಖ್ಯವಾಗಿ ಎಲೆಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿ ಎಲೆ ಉದುರುವಿಕೆ ಮತ್ತು ಉತ್ಪಾದನೆ ಕುಸಿತಕ್ಕೆ ಕಾರಣವಾಗಬಹುದು.",
    symptoms: ["ಎಲೆಯ ಕೆಳಭಾಗದಲ್ಲಿ ಹಳದಿ-ಕಿತ್ತಳೆ ಪುಡಿ ಚುಕ್ಕೆಗಳು", "ಮೇಲ್ಮೈಯಲ್ಲಿ ಹಳದಿ ಕಲೆಗಳು", "ಎಲೆ ಹಳದಿಯಾಗುವುದು", "ಅಕಾಲಿಕ ಎಲೆ ಉದುರುವಿಕೆ"],
    prevention: ["ಸೂಕ್ತ ನಿರೋಧಕ ಅಥವಾ ಸಹಿಷ್ಣು ತಳಿಗಳನ್ನು ಬಳಸಿ.", "ಸೂಕ್ತ ಗಿಡ ಅಂತರ ಕಾಪಾಡಿ.", "ಗಿಡಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.", "ಸಮತೋಲಿತ ಪೋಷಣೆ ಮತ್ತು ತೋಟ ನಿರ್ವಹಣೆ ಮಾಡಿ."],
    treatment: "ಚಿಕಿತ್ಸೆಗೆ ಮೊದಲು ಸೋಂಕನ್ನು ದೃಢೀಕರಿಸಿ. ನೋಂದಾಯಿತ ಶಿಲೀಂಧ್ರನಾಶಕ ಮತ್ತು ಸಮಗ್ರ ರೋಗ ನಿರ್ವಹಣೆಗೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  Miner: {
    title: "ಕಾಫಿ ಎಲೆ ಮೈನರ್ ಕೀಟ", category: "ಕೀಟ ಬಾಧೆ",
    description: "ಕಾಫಿ ಎಲೆ ಮೈನರ್ ಒಂದು ಕೀಟ. ಇದರ ಲಾರ್ವಾಗಳು ಎಲೆಯ ಒಳಗಿನ ಅಂಗಾಂಶವನ್ನು ತಿಂದು ಸುರಂಗದಂತಹ ಗುರುತುಗಳನ್ನು ಉಂಟುಮಾಡುತ್ತವೆ.",
    symptoms: ["ಎಲೆಗಳ ಒಳಗೆ ಅಸಮವಾದ ಸುರಂಗ ಗುರುತುಗಳು", "ಕಂದು ಅಥವಾ ಒಣ ಕಲೆಗಳು", "ಎಲೆ ಅಂಗಾಂಶ ಹಾನಿ", "ತೀವ್ರ ಬಾಧೆಯಲ್ಲಿ ಎಲೆ ಉದುರುವಿಕೆ"],
    prevention: ["ಎಲೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.", "ತೋಟದ ಸ್ವಚ್ಛತೆ ಕಾಪಾಡಿ.", "ಉಪಯುಕ್ತ ನೈಸರ್ಗಿಕ ಶತ್ರುಗಳನ್ನು ರಕ್ಷಿಸಿ.", "ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ ಅನುಸರಿಸಿ."],
    treatment: "ಚಿಕಿತ್ಸೆಗೆ ಮೊದಲು ಕೀಟದ ಇರುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಿ. ಸೂಕ್ತ ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆಗೆ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  Phoma: {
    title: "ಫೋಮಾ ರೋಗ", category: "ಶಿಲೀಂಧ್ರ ರೋಗ",
    description: "ರೋಗಕಾರಕ ಮತ್ತು ಪರಿಸರ ಪರಿಸ್ಥಿತಿಗಳ ಮೇಲೆ ಅವಲಂಬಿಸಿ ಫೋಮಾ ಸಂಬಂಧಿತ ರೋಗಗಳು ಎಲೆಗಳು ಮತ್ತು ಚಿಗುರುಗಳಿಗೆ ಹಾನಿ ಮಾಡಬಹುದು.",
    symptoms: ["ಎಲೆಗಳ ಮೇಲೆ ಕಪ್ಪು ಸತ್ತ ಅಂಗಾಂಶದ ಗಾಯಗಳು", "ಎಲೆ ಅಂಗಾಂಶ ಹಾನಿ", "ಚಿಗುರು ಅಥವಾ ಎಳೆಯ ಭಾಗಗಳಿಗೆ ಹಾನಿ", "ಹಾನಿಗೊಂಡ ಭಾಗ ಒಣಗುವುದು"],
    prevention: ["ಆರಂಭಿಕ ಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿ.", "ತೋಟದಲ್ಲಿ ಸೂಕ್ತ ಗಾಳಿಯಾಟ ಇರಲಿ.", "ಅನಗತ್ಯ ಎಲೆ ತೇವಾಂಶ ತಪ್ಪಿಸಿ.", "ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ತೀವ್ರವಾಗಿ ಹಾನಿಗೊಂಡ ಭಾಗಗಳನ್ನು ತೆಗೆದುಹಾಕಿ."],
    treatment: "ಚಿಕಿತ್ಸೆ ಆಯ್ಕೆಮಾಡುವ ಮೊದಲು ಕಾರಣವಾದ ರೋಗಕಾರಕವನ್ನು ದೃಢೀಕರಿಸಿ. ನಿರ್ದಿಷ್ಟ ಸಲಹೆಗೆ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  Healthy: {
    title: "ಆರೋಗ್ಯಕರ ಕಾಫಿ ಎಲೆ", category: "ಆರೋಗ್ಯಕರ ಎಂದು ಭವಿಷ್ಯ",
    description: "ಮಾದರಿಯು ಚಿತ್ರವನ್ನು ಆರೋಗ್ಯಕರ ಎಂದು ವರ್ಗೀಕರಿಸಿದೆ. ಇದರಿಂದ ಸಂಪೂರ್ಣ ಗಿಡ ರೋಗಮುಕ್ತವೆಂದು ಖಚಿತವಾಗುವುದಿಲ್ಲ.",
    symptoms: ["ಬೆಂಬಲಿತ ರೋಗ ವರ್ಗ ಯಾವುದೂ ಊಹಿಸಲ್ಪಟ್ಟಿಲ್ಲ.", "ಮಾದರಿಯು ಚಿತ್ರವನ್ನು ಆರೋಗ್ಯಕರವೆಂದು ವರ್ಗೀಕರಿಸಿದೆ."],
    prevention: ["ತೋಟವನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.", "ಸಮತೋಲಿತ ಪೋಷಣೆ ಒದಗಿಸಿ.", "ಪರಿಸರ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಗಮನಿಸಿ.", "ಎಲೆಗಳ ಎರಡೂ ಬದಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."],
    treatment: "ಈ ಭವಿಷ್ಯವಾಣಿಯ ಆಧಾರದಲ್ಲಿ ನಿರ್ದಿಷ್ಟ ರೋಗ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿಲ್ಲ."
  }
};

function normalizeResearchUrl(url) {
  if (!url || typeof url !== "string") return "";
  const value = url.trim();
  if (/^10\./.test(value)) return `https://doi.org/${value}`;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}
function formatDate(value, language) {
  if (!value) return language === "kn" ? "ದಿನಾಂಕ ಲಭ್ಯವಿಲ್ಲ" : "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "kn" ? "ದಿನಾಂಕ ಲಭ್ಯವಿಲ್ಲ" : "Date unavailable";
  return date.toLocaleDateString(language === "kn" ? "kn-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function confidenceValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n <= 1 ? n * 100 : n));
}
function predictionClass(data) {
  return data?.predicted_class || data?.prediction || data?.class_name || data?.disease || data?.class || "";
}
function predictionProbabilities(data) {
  const source = data?.probabilities || data?.class_probabilities || data?.predictions || {};
  if (Array.isArray(source)) return source.map(x => ({
    name: x?.class || x?.class_name || x?.label || "Unknown",
    value: confidenceValue(x?.probability ?? x?.confidence ?? x?.score ?? 0)
  })).sort((a, b) => b.value - a.value);
  if (source && typeof source === "object") return Object.entries(source).map(([name, value]) => ({
    name, value: confidenceValue(typeof value === "object" ? value?.probability ?? value?.confidence ?? value?.score ?? 0 : value)
  })).sort((a, b) => b.value - a.value);
  return [];
}
function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

/**
 * Experimental visualization only. Marks orange/brown/yellow colour candidates.
 * It is not a trained lesion detector or a validated segmentation method.
 */
async function createCandidateOverlay(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    const maxSide = 1000;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    const { data } = pixels;
    const cell = Math.max(8, Math.floor(Math.min(width, height) / 55));
    const regions = [];
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        let hits = 0, seen = 0;
        const yEnd = Math.min(height, y + cell), xEnd = Math.min(width, x + cell);
        for (let py = y; py < yEnd; py += 2) {
          for (let px = x; px < xEnd; px += 2) {
            const i = (py * width + px) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            // Broad colour heuristic only; does not identify disease.
            if (r > 85 && r > g * 1.12 && (r - b) > 12 && saturation > 0.22 && g > b * 0.82) hits++;
            seen++;
          }
        }
        if (seen && hits / seen > 0.20) regions.push({ x, y, w: xEnd - x, h: yEnd - y, score: hits / seen });
      }
    }
    // Merge adjacent candidate cells into coarse rectangular groups.
    const merged = [];
    regions.sort((a, b) => a.y - b.y || a.x - b.x);
    regions.forEach(region => {
      const target = merged.find(m => Math.abs(m.x - region.x) <= cell && Math.abs(m.y - region.y) <= cell);
      if (target) {
        const right = Math.max(target.x + target.w, region.x + region.w);
        const bottom = Math.max(target.y + target.h, region.y + region.h);
        target.x = Math.min(target.x, region.x); target.y = Math.min(target.y, region.y);
        target.w = right - target.x; target.h = bottom - target.y;
      } else merged.push({ ...region });
    });
    ctx.strokeStyle = "#ff2424";
    ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) / 180));
    merged.forEach(r => {
      ctx.strokeRect(r.x + 1, r.y + 1, Math.max(1, r.w - 2), Math.max(1, r.h - 2));
    });
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), count: merged.length };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function DiseaseDetection() {
  const fileInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const researchRequestRef = useRef(0);

  const [language, setLanguage] = useState(() => localStorage.getItem("kisanvision_language") || "en");
  const t = TEXT[language] || TEXT.en;
  const [activeTool, setActiveTool] = useState("Disease Detection");
  const [selectedCrop, setSelectedCrop] = useState("Coffee");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [candidateUrl, setCandidateUrl] = useState("");
  const [candidateCount, setCandidateCount] = useState(0);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [apiConnected, setApiConnected] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);
  const [selectedResearchClass, setSelectedResearchClass] = useState("Leaf Rust");
  const [researchData, setResearchData] = useState([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [researchMessage, setResearchMessage] = useState("");
  const [researchUpdatedAt, setResearchUpdatedAt] = useState(null);
  const [history, setHistory] = useState(readHistory);

  useEffect(() => { localStorage.setItem("kisanvision_language", language); }, [language]);
  useEffect(() => {
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)); }
    catch (error) { console.error("Unable to save prediction history:", error); }
  }, [history]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => {
    if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(track => track.stop());
  }, []);

  const checkApiConnection = useCallback(async () => {
    setApiChecking(true);
    try {
      const healthUrl = new URL(COFFEE_API_URL);
      healthUrl.pathname = healthUrl.pathname.replace(/\/predict\/coffee\/?$/, "/health");
      healthUrl.search = "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(healthUrl.toString(), { method: "GET", signal: controller.signal });
        setApiConnected(response.ok);
      } finally { clearTimeout(timeout); }
    } catch { setApiConnected(false); }
    finally { setApiChecking(false); }
  }, []);
  useEffect(() => { checkApiConnection(); }, [checkApiConnection]);

  const clearImageState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null); setPreviewUrl(""); setCandidateUrl(""); setCandidateCount(0);
    setPrediction(null); setPredictionError(""); setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleFileSelection = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(""); setPredictionError(""); setPrediction(null); setCandidateUrl(""); setCandidateCount(0);
    if (!ALLOWED_TYPES.includes(file.type)) { setImageError(t.invalidType); event.target.value = ""; return; }
    if (file.size > MAX_FILE_SIZE) { setImageError(t.tooLarge); event.target.value = ""; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };
  const removeImage = () => clearImageState();

  const stopCamera = () => {
    if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setCameraOpen(false);
  };
  const openCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError(t.cameraUnsupported); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      cameraStreamRef.current = stream; setCameraOpen(true);
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      });
    } catch { setCameraError(t.cameraPermission); }
  };
  const capturePhoto = () => {
    const video = cameraVideoRef.current, canvas = cameraCanvasRef.current;
    if (!video || !canvas || !video.videoWidth) { setCameraError(t.cameraReady); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) { setCameraError(t.captureError); return; }
      const file = new File([blob], `crop-leaf-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
      setCandidateUrl(""); setCandidateCount(0); setPrediction(null); setPredictionError(""); setImageError("");
    }, "image/jpeg", 0.92);
  };

  const analyzeImage = async () => {
    if (!selectedFile) { setImageError(t.chooseFirst); return; }
    if (selectedCrop !== "Coffee") { setPredictionError(t.modelPending); return; }
    if (!apiConnected) { setPredictionError(t.apiWarning); return; }
    if (predictionLoading) return;
    setPredictionLoading(true); setPredictionError(""); setPrediction(null);
    setCandidateUrl(""); setCandidateCount(0);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(COFFEE_API_URL, { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.message || `Prediction failed. HTTP ${response.status}.`);
      if (data?.success === false || data?.error) throw new Error(data?.message || data?.error || t.predictionFailed);
      const returnedClass = predictionClass(data);
      if (!returnedClass) throw new Error(t.noClass);
      const normalized = COFFEE_CLASSES.find(item => item.toLowerCase() === String(returnedClass).toLowerCase());
      if (!normalized) throw new Error(`${t.unsupportedClass} ${returnedClass}`);
      const result = {
        predictedClass: normalized,
        confidence: confidenceValue(data?.confidence ?? data?.confidence_score ?? data?.probability ?? data?.score ?? 0),
        probabilities: predictionProbabilities(data),
        imageName: selectedFile.name,
        createdAt: new Date().toISOString()
      };
      setPrediction(result);
      setHistory(prev => [{ id: `${Date.now()}-${Math.random()}`, crop: "Coffee", predictedClass: normalized, confidence: result.confidence, imageName: selectedFile.name, createdAt: result.createdAt }, ...prev].slice(0, 50));
      setSelectedResearchClass(normalized);
      setHighlightLoading(true);
      try {
        const overlay = await createCandidateOverlay(selectedFile);
        setCandidateUrl(overlay.dataUrl); setCandidateCount(overlay.count);
      } catch (error) {
        console.warn("Candidate highlighting could not be generated:", error);
      } finally { setHighlightLoading(false); }
    } catch (error) {
      console.error("Coffee prediction error:", error);
      setPredictionError(error?.message || t.predictionOffline);
    } finally { setPredictionLoading(false); }
  };

  const fetchCoffeeResearch = async diseaseClass => {
    const requestId = ++researchRequestRef.current;
    if (!diseaseClass || diseaseClass === "Healthy") {
      setResearchData([]); setResearchError(""); setResearchLoading(false);
      setResearchUpdatedAt(new Date()); setResearchMessage(t.noResearchText); return;
    }
    setResearchLoading(true); setResearchError(""); setResearchMessage("");
    try {
      const url = new URL(COFFEE_RESEARCH_URL);
      url.searchParams.set("class", diseaseClass);
      const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) throw new Error(data?.message || `Research request failed (HTTP ${response.status}).`);
      if (requestId !== researchRequestRef.current) return;
      const results = Array.isArray(data?.results) ? data.results : [];
      setResearchData(results); setResearchUpdatedAt(new Date());
      setResearchMessage(data?.message || (results.length === 0 ? t.noMatches : ""));
    } catch (error) {
      if (requestId !== researchRequestRef.current) return;
      setResearchData([]); setResearchError(error?.message || t.researchOffline);
    } finally {
      if (requestId === researchRequestRef.current) setResearchLoading(false);
    }
  };
  useEffect(() => {
    if (activeTool !== "Disease Information") return;
    fetchCoffeeResearch(selectedResearchClass);
    return () => { researchRequestRef.current += 1; };
    // fetchCoffeeResearch intentionally uses the selected class and current language labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, selectedResearchClass, language]);

  const clearHistory = () => {
    if (window.confirm(t.confirmClear)) setHistory([]);
  };
  const openHistoryResult = item => {
    setSelectedCrop(item.crop || "Coffee");
    setPrediction({ predictedClass: item.predictedClass, confidence: Number(item.confidence) || 0, probabilities: [], imageName: item.imageName, createdAt: item.createdAt });
    setPreviewUrl(""); setSelectedFile(null); setCandidateUrl(""); setCandidateCount(0);
    setActiveTool("Disease Detection"); setPredictionError("");
  };

  const currentDisease = prediction ? DISEASE_INFORMATION[prediction.predictedClass] : null;
  const translatedDisease = currentDisease && language === "kn"
    ? { ...currentDisease, ...(KN_DISEASE[prediction.predictedClass] || {}) }
    : currentDisease;
  const selectedCropInfo = CROPS.find(c => c.id === selectedCrop);
  const navLabel = useMemo(() => activeTool === "Disease Detection" ? t.detect : activeTool === "Disease Information" ? t.info : t.history, [activeTool, t]);

  return (
    <div className="disease-detection-page">
      <header className="detection-header">
        <div className="detection-header-content">
          <div className="detection-heading-icon"><FaLeaf /></div>
          <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        </div>
        <div className="header-actions">
          <label className="language-control">
            <FaGlobe />
            <span>{t.language}</span>
            <select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Select language">
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </label>
          <div className="api-status">
            <span className={`api-status-indicator ${apiConnected ? "connected" : "disconnected"}`} />
            <span>{apiChecking ? t.checking : apiConnected ? t.connected : t.offline}</span>
            <button type="button" className="icon-button" onClick={checkApiConnection} title="Check API connection"><FaSyncAlt /></button>
          </div>
        </div>
      </header>

      <nav className="detection-navigation">
        <button type="button" className={activeTool === "Disease Detection" ? "active" : ""} onClick={() => setActiveTool("Disease Detection")}><FaMicroscope />{t.detect}</button>
        <button type="button" className={activeTool === "Disease Information" ? "active" : ""} onClick={() => { setActiveTool("Disease Information"); if (prediction) setSelectedResearchClass(prediction.predictedClass); }}><FaBookOpen />{t.info}</button>
        <button type="button" className={activeTool === "History" ? "active" : ""} onClick={() => setActiveTool("History")}><FaHistory />{t.history}<span className="navigation-count">{history.length}</span></button>
      </nav>

      {activeTool === "Disease Detection" && (
        <main className="detection-content">
          <section className="crop-selector-card">
            <div className="crop-selector-heading"><div><h2>{t.crop}</h2><p>{language === "kn" ? "ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ" : "Choose one of the five project crops."}</p></div><span className="crop-count">5 crops</span></div>
            <div className="crop-selector-grid">
              {CROPS.map(crop => (
                <button type="button" key={crop.id} className={`crop-option ${selectedCrop === crop.id ? "selected" : ""}`} onClick={() => { setSelectedCrop(crop.id); setPrediction(null); setPredictionError(""); setCandidateUrl(""); setCandidateCount(0); }} aria-pressed={selectedCrop === crop.id}>
                  <strong>{crop.id}</strong><small>{crop.scientific}</small>
                  <span className={crop.connected ? "crop-connected" : "crop-pending"}>{crop.connected ? `● ${t.connectedModel}` : `● ${t.pending}`}</span>
                </button>
              ))}
            </div>
            {!selectedCropInfo.connected && <div className="pending-model-notice"><FaInfoCircle /><span>{t.pendingNotice} {t.modelPending}</span></div>}
          </section>

          <div className="detection-introduction"><h2>{t.intro}</h2><p>{t.introText}</p></div>
          <div className="detection-main-grid">
            <section className="upload-card">
              <div className="section-heading"><FaImage /><h3>{t.upload}</h3></div>
              {!previewUrl ? (
                <div className="upload-area">
                  <FaCloudUploadAlt className="upload-icon" /><h3>{t.choose}</h3><p>{t.uploadText}</p>
                  <button type="button" className="primary-button" onClick={() => fileInputRef.current?.click()}><FaCloudUploadAlt />{t.browse}</button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelection} hidden />
                  <div className="upload-requirements"><span>JPG</span><span>PNG</span><span>WEBP</span><span>Maximum 5 MB</span></div>
                </div>
              ) : (
                <div className="image-preview-container">
                  <div className="image-preview"><img src={previewUrl} alt="Selected crop leaf" /><button type="button" className="remove-image-button" onClick={removeImage} title={t.remove}><FaTimes /></button></div>
                  <div className="selected-file-details"><FaImage /><div><strong>{selectedFile?.name}</strong><span>{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}</span></div></div>
                  <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>{t.change}</button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelection} hidden />
                </div>
              )}
              {imageError && <div className="error-message"><FaExclamationTriangle />{imageError}</div>}
              {cameraError && <div className="error-message"><FaExclamationTriangle />{cameraError}</div>}
              <div className="camera-section"><span>{t.cameraText}</span><button type="button" className="secondary-button" onClick={openCamera}><FaCamera />{t.openCamera}</button></div>
              {cameraOpen && <div className="camera-modal"><div className="camera-modal-content">
                <div className="camera-modal-header"><h3>{t.cameraTitle}</h3><button type="button" onClick={stopCamera}><FaTimes /></button></div>
                <video ref={cameraVideoRef} autoPlay playsInline muted className="camera-video" /><canvas ref={cameraCanvasRef} hidden />
                <div className="camera-controls"><button type="button" className="primary-button" onClick={capturePhoto}><FaCamera />{t.capture}</button><button type="button" className="secondary-button" onClick={stopCamera}>{t.cancel}</button></div>
              </div></div>}
              <button type="button" className="analyze-button" disabled={!selectedFile || predictionLoading || !selectedCropInfo.connected || !apiConnected} onClick={analyzeImage}>
                {predictionLoading ? <><FaSpinner className="spin" />{t.analyzing}</> : <><FaSearch />{t.analyze}</>}
              </button>
              {!selectedCropInfo.connected && <p className="api-warning"><FaExclamationTriangle />{t.pendingNotice}</p>}
              {!apiConnected && !apiChecking && selectedCropInfo.connected && <p className="api-warning"><FaExclamationTriangle />{t.apiWarning}</p>}
              {predictionError && <div className="error-message"><FaExclamationTriangle />{predictionError}</div>}
            </section>

            <aside className="instructions-card">
              <div className="section-heading"><FaInfoCircle /><h3>{t.guidelines}</h3></div>
              <div className="guideline-item"><FaCheckCircle /><div><strong>{t.clear}</strong><p>{t.clearText}</p></div></div>
              <div className="guideline-item"><FaCheckCircle /><div><strong>{t.lighting}</strong><p>{t.lightingText}</p></div></div>
              <div className="guideline-item"><FaCheckCircle /><div><strong>{t.focus}</strong><p>{t.focusText}</p></div></div>
              <div className="guideline-item"><FaCheckCircle /><div><strong>{t.supported}</strong><p>{selectedCrop} — {selectedCropInfo.connected ? t.connectedModel : t.pending}</p></div></div>
              {selectedCrop === "Coffee" && <div className="supported-classes"><h4>{t.classes}</h4>{COFFEE_CLASSES.map(item => <span key={item}>{item}</span>)}</div>}
            </aside>
          </div>

          {prediction && currentDisease && (
            <section className="prediction-result">
              <div className="result-header"><div><span className="result-label">{t.result}</span><h2>{t.completed}</h2></div><span className={`result-status ${prediction.predictedClass === "Healthy" ? "healthy" : "disease"}`}>{prediction.predictedClass === "Healthy" ? t.healthy : t.detected}</span></div>
              <div className="candidate-section">
                <div className="section-heading"><FaSearch /><h3>{t.experimental}</h3></div>
                <div className="candidate-image-grid">
                  <div className="candidate-image-card"><h4>{t.original}</h4>{previewUrl ? <img src={previewUrl} alt="Original leaf" /> : <div className="candidate-placeholder"><FaLeaf /></div>}</div>
                  <div className="candidate-image-card"><h4>{t.candidates}</h4>{highlightLoading ? <div className="candidate-placeholder"><FaSpinner className="spin" />{t.analyzing}</div> : candidateUrl ? <img src={candidateUrl} alt="Experimental colour-based candidate outlines" /> : previewUrl ? <img src={previewUrl} alt="Candidate regions unavailable" /> : <div className="candidate-placeholder"><FaInfoCircle /></div>}</div>
                </div>
                <p className="candidate-count">{t.regions}: <strong>{highlightLoading ? "…" : candidateCount}</strong></p>
                <p className="candidate-disclaimer"><FaExclamationTriangle />{t.experimentalNote}</p>
              </div>
              <div className="result-main-grid">
                <div className="result-image">{previewUrl ? <img src={previewUrl} alt="Analyzed crop leaf" /> : <div className="result-image-placeholder"><FaLeaf /></div>}</div>
                <div className="result-details"><span className="result-label">{t.predicted}</span><h2>{translatedDisease.title || prediction.predictedClass}</h2><p className="scientific-name">{currentDisease.scientificName}</p>
                  <div className="confidence-container"><div className="confidence-heading"><span>{t.confidence}</span><strong>{prediction.confidence.toFixed(2)}%</strong></div><div className="confidence-track"><div className="confidence-fill" style={{ width: `${prediction.confidence}%` }} /></div></div>
                  <p className="result-category"><strong>{t.category}:</strong> {translatedDisease.category}</p><p>{translatedDisease.description}</p>
                </div>
              </div>
              {prediction.probabilities.length > 0 && <div className="probability-section"><div className="section-heading"><FaChartBar /><h3>{t.probabilities}</h3></div>{prediction.probabilities.map(item => <div className="probability-item" key={item.name}><div className="probability-heading"><span>{item.name}</span><strong>{item.value.toFixed(2)}%</strong></div><div className="probability-track"><div className="probability-fill" style={{ width: `${item.value}%` }} /></div></div>)}</div>}
              <div className="disease-details-grid">
                <div className="disease-detail-card"><h3><FaInfoCircle />{t.symptoms}</h3><ul>{translatedDisease.symptoms.map(item => <li key={item}>{item}</li>)}</ul></div>
                <div className="disease-detail-card"><h3><FaSeedling />{t.prevention}</h3><ul>{translatedDisease.prevention.map(item => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <div className="treatment-card"><h3><FaLeaf />{t.management}</h3><p>{translatedDisease.treatment}</p></div>
              <div className="result-actions"><button type="button" className="primary-button" onClick={() => { setSelectedResearchClass(prediction.predictedClass); setActiveTool("Disease Information"); }}><FaBookOpen />{t.research}</button><button type="button" className="secondary-button" onClick={removeImage}><FaSearch />{t.newAnalysis}</button></div>
              <p className="result-disclaimer">{t.disclaimer}</p>
            </section>
          )}
        </main>
      )}

      {activeTool === "Disease Information" && (
        <section className="research-page">
          <div className="research-heading"><div><h2>{t.researchTitle}</h2><p>{t.researchText}</p></div><button type="button" className="secondary-button" disabled={researchLoading} onClick={() => fetchCoffeeResearch(selectedResearchClass)}><FaSyncAlt />{t.refresh}</button></div>
          <div className="research-filter"><label htmlFor="research-class">{t.selectClass}</label><select id="research-class" value={selectedResearchClass} onChange={e => setSelectedResearchClass(e.target.value)}>{COFFEE_CLASSES.map(item => <option value={item} key={item}>{item}</option>)}</select></div>
          {researchUpdatedAt && <p className="research-updated">{t.updated}: {formatDate(researchUpdatedAt, language)}</p>}
          {selectedResearchClass === "Healthy" && <div className="research-info-message"><FaInfoCircle /><div><strong>{t.noResearchTitle}</strong><p>{t.noResearchText}</p></div></div>}
          {researchLoading && <div className="research-loading"><FaSpinner className="spin" /><p>{t.loadingResearch}</p></div>}
          {!researchLoading && researchError && <div className="error-message"><FaExclamationTriangle /><span>{researchError}</span><button type="button" onClick={() => fetchCoffeeResearch(selectedResearchClass)}>{t.retry}</button></div>}
          {!researchLoading && !researchError && researchMessage && selectedResearchClass !== "Healthy" && <div className="research-info-message"><FaInfoCircle /><p>{researchMessage}</p></div>}
          {!researchLoading && !researchError && researchData.length > 0 && <div className="research-results"><div className="research-results-header"><h3>{t.publications}</h3><span>{researchData.length} {t.results}</span></div>
            {researchData.map((item, index) => {
              const publicationUrl = normalizeResearchUrl(item.url || item.doi);
              const authors = Array.isArray(item.authors) ? item.authors.join(", ") : item.authors || (language === "kn" ? "ಲೇಖಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ" : "Authors unavailable");
              return <article className="research-card" key={item.doi || item.id || `${item.title}-${index}`}>
                <div className="research-card-top"><span className="research-source">{item.source || item.sources?.join(", ") || t.source}</span>{item.year && <span className="research-year">{item.year}</span>}</div>
                <h3>{item.title || t.untitled}</h3><p className="research-authors">{authors}</p>{item.journal && <p className="research-journal">{item.journal}</p>}
                {item.abstract && <div className="research-abstract"><strong>{t.abstract}</strong><p>{item.abstract}</p></div>}
                <div className="research-metadata">{item.publicationTypeLabel && <span>{item.publicationTypeLabel}</span>}{item.relevanceLevel && <span>{item.relevanceLevel}</span>}{item.doi && <span>{t.doi}: {item.doi}</span>}</div>
                {item.evidenceNote && <p className="research-evidence-note"><FaInfoCircle />{item.evidenceNote}</p>}
                {publicationUrl && <a href={publicationUrl} target="_blank" rel="noopener noreferrer" className="research-link">{t.viewPublication}<FaExternalLinkAlt /></a>}
              </article>;
            })}
          </div>}
        </section>
      )}

      {activeTool === "History" && (
        <section className="history-page">
          <div className="history-heading"><div><h2>{t.historyTitle}</h2><p>{t.historyText}</p></div>{history.length > 0 && <button type="button" className="danger-button" onClick={clearHistory}><FaTrash />{t.clearHistory}</button>}</div>
          {history.length === 0 ? <div className="history-empty"><FaHistory /><h3>{t.noHistory}</h3><p>{t.noHistoryText}</p><button type="button" className="primary-button" onClick={() => setActiveTool("Disease Detection")}>{t.start}</button></div> :
            <div className="history-list">{history.map(item => <div className="history-card" key={item.id}><div className="history-icon"><FaLeaf /></div><div className="history-details"><h3>{item.crop || "Coffee"} — {item.predictedClass}</h3><p>{item.imageName}</p><span>{formatDate(item.createdAt, language)}</span></div><div className="history-confidence"><strong>{Number(item.confidence).toFixed(2)}%</strong><span>{t.confidenceLabel}</span></div><button type="button" className="secondary-button" onClick={() => openHistoryResult(item)}>{t.view}</button></div>)}</div>}
        </section>
      )}
      <div className="detection-footer-note">{navLabel} · KisanVision AI</div>
    </div>
  );
}
