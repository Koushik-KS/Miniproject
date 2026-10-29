import { useEffect, useRef, useState } from "react";

import {
  FaCamera,
  FaCloudUploadAlt,
  FaLeaf,
  FaMicroscope,
  FaShieldAlt,
  FaStethoscope,
  FaChartPie,
  FaLightbulb,
  FaQuestionCircle,
  FaInfoCircle,
  FaTimes,
  FaUpload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSeedling,
  FaFlask,
  FaTrashAlt,
  FaTint,
  FaSearch,
  FaImages,
  FaBookOpen,
  FaChevronRight,
} from "react-icons/fa";

import "./DiseaseDetection.css";

const COFFEE_API_URL =
  import.meta.env.VITE_COFFEE_API_URL ||
  "http://127.0.0.1:8000/predict/coffee";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const crops = [
  {
    name: "Coffee",
    scientific: "Coffea spp.",
    image: "/assets/coffe.png",
    supported: true,
  },
  {
    name: "Arecanut",
    scientific: "Areca catechu",
    image: "/assets/arecanut.png",
    supported: false,
  },
  {
    name: "Cardamom",
    scientific: "Elettaria cardamomum",
    image: "/assets/cardmone.png",
    supported: false,
  },
  {
    name: "Ginger",
    scientific: "Zingiber officinale",
    image: "/assets/ginger.png",
    supported: false,
  },
  {
    name: "Black Pepper",
    scientific: "Piper nigrum",
    image: "/assets/peppar.png",
    supported: false,
  },
];

const diseaseGuidance = {
  Healthy: {
    title: "Healthy Coffee leaf",
    description:
      "The model classified this image as Healthy. Continue regular crop monitoring.",
    status: "Predicted healthy",
  },
  Cercospora: {
    title: "Coffee Cercospora",
    description:
      "The model classified this image as Cercospora. Verify the symptoms with a qualified agricultural expert before treatment.",
    status: "Disease class predicted",
  },
  "Leaf Rust": {
    title: "Coffee Leaf Rust",
    description:
      "The model classified this image as Leaf Rust. Confirm the diagnosis with a qualified agricultural expert before selecting treatment.",
    status: "Disease class predicted",
  },
  Miner: {
    title: "Coffee Miner",
    description:
      "The model classified this image as Miner. Inspect the leaves and confirm the diagnosis before taking control measures.",
    status: "Disease class predicted",
  },
  Phoma: {
    title: "Coffee Phoma",
    description:
      "The model classified this image as Phoma. Verify the diagnosis and consult trusted agricultural guidance before treatment.",
    status: "Disease class predicted",
  },
};

const faqs = [
  {
    question: "How do I provide a leaf image?",
    answer:
      "Capture an image using the live camera or upload a JPG, PNG or WebP image up to 5 MB.",
  },
  {
    question: "Which crops are supported for AI prediction?",
    answer:
      "Coffee is currently connected to a trained classification model. Arecanut, Cardamom, Ginger and Black Pepper require their own trained and integrated models.",
  },
  {
    question: "Why is a prediction not showing?",
    answer:
      "Make sure an image is selected and the Coffee Python API is running. Any connection or prediction errors will be shown on this page.",
  },
  {
    question: "Can the system highlight affected leaf regions?",
    answer:
      "The current classifier predicts a class but does not locate diseased pixels or calculate the affected leaf area. A suitable localization or segmentation model is required.",
  },
  {
    question: "Can I immediately apply the recommended treatment?",
    answer:
      "Predictions are experimental and must be verified. Consult a qualified agricultural expert and trusted agricultural guidance before applying pesticides.",
  },
];

export default function DiseaseDetectionPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [dragging, setDragging] = useState(false);
  const [activeTool, setActiveTool] = useState("Detect Disease");
  const [openFaq, setOpenFaq] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("unknown");
  const [selectedCrop, setSelectedCrop] = useState("Coffee");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const sectionRefs = useRef({});
  const requestIdRef = useRef(0);

  const tools = [
    {
      name: "Detect Disease",
      icon: FaMicroscope,
      id: "detect-disease",
    },
    {
      name: "Supported Crops",
      icon: FaSeedling,
      id: "supported-crops",
    },
    {
      name: "Disease Information",
      icon: FaBookOpen,
      id: "disease-information",
    },
    {
      name: "Prevention & Treatment",
      icon: FaShieldAlt,
      id: "treatment-prevention",
    },
    {
      name: "Upload History",
      icon: FaImages,
      id: "upload-history",
    },
    {
      name: "FAQs",
      icon: FaQuestionCircle,
      id: "disease-faqs",
    },
  ];

  const guidance = prediction
    ? diseaseGuidance[prediction.predicted_class]
    : null;

  const isHealthy = prediction?.predicted_class === "Healthy";

  const openSection = (name) => {
    setActiveTool(name);

    sectionRefs.current[name]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraLoading(false);
  };
    useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (cameraActive && video && stream) {
      video.srcObject = stream;

      video.play().catch(() =>
        setMessage(
          "Could not play the camera preview. Check browser permissions."
        )
      );
    }
  }, [cameraActive]);

  useEffect(() => {
    let cancelled = false;

    fetch(
      COFFEE_API_URL.replace(
        /\/predict\/coffee$/,
        "/health"
      )
    )
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setApiStatus(data?.model_loaded ? "connected" : "error");
        }
      })
      .catch(() => {
        if (!cancelled) setApiStatus("error");
      });

    return () => {
      cancelled = true;

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera access is unavailable. Use localhost or HTTPS in a supported browser."
      );
      return;
    }

    setCameraLoading(true);

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: cameraFacing } },
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      setMessage(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in browser settings."
          : error?.name === "NotFoundError"
            ? "No compatible camera was found on this device."
            : "Unable to open the camera. Check permissions and try again."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size === 0) {
      setMessage("The selected image is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Image size must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      requestIdRef.current += 1;
      setPrediction(null);
      setSelectedFile(file);
      setImageUrl(String(reader.result));
      setFileName(file.name);
      setMessage("");
      stopCamera();
    };

    reader.onerror = () =>
      setMessage("Unable to read this image. Please try another file.");

    reader.readAsDataURL(file);
  };

  const captureImage = () => {
    const video = videoRef.current;

    if (!video?.videoWidth || !video?.videoHeight) {
      setMessage("Wait for the camera preview to load before capturing.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("Unable to capture the camera image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage("Image capture failed. Please try again.");
          return;
        }

        handleFile(
          new File([blob], `leaf-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      0.92
    );
  };

  const clearImage = () => {
    requestIdRef.current += 1;
    setImageUrl("");
    setSelectedFile(null);
    setFileName("");
    setMessage("");
    setPrediction(null);
    setPredictionLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeDisease = async () => {
    if (!selectedFile) {
      setMessage("Please capture or upload a Coffee leaf image first.");
      return;
    }

    if (selectedCrop !== "Coffee") {
      setMessage(
        `${selectedCrop} is listed in the dashboard, but its AI model is not integrated yet. Please select Coffee for AI prediction.`
      );
      return;
    }

    if (predictionLoading) return;
        const currentRequestId = ++requestIdRef.current;

    setPredictionLoading(true);
    setPrediction(null);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(COFFEE_API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || `Prediction failed (HTTP ${response.status}).`
        );
      }

      if (!data?.success || !data?.predicted_class) {
        throw new Error("The Coffee API returned an invalid prediction.");
      }

      if (currentRequestId !== requestIdRef.current) return;

      setPrediction({
        ...data,
        fileName,
        imageUrl,
        createdAt: new Date().toLocaleString(),
      });

      setApiStatus("connected");
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;

      setMessage(
        error?.message ||
          "Could not connect to the Coffee API. Check that the Python API is running."
      );

      setApiStatus("error");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setPredictionLoading(false);
      }
    }
  };

  const history = prediction ? [prediction] : [];

  const treatmentRows = isHealthy
    ? [
        {
          icon: FaCheckCircle,
          title: "Healthy leaf prediction",
          text: "Continue regular monitoring and maintain appropriate crop care.",
        },
        {
          icon: FaShieldAlt,
          title: "General precaution",
          text: "Use clear images and do not apply pesticides based only on an unverified model result.",
        },
      ]
    : [
        {
          icon: FaMicroscope,
          title: "Verify the prediction",
          text: "Inspect the plant and consult a qualified agricultural expert before deciding on treatment.",
        },
        {
          icon: FaTrashAlt,
          title: "Monitor affected leaves",
          text: "Check for changes in symptoms. Follow locally approved crop-management guidance.",
        },
        {
          icon: FaTint,
          title: "Maintain crop hygiene",
          text: "Use suitable crop spacing and irrigation practices based on local agricultural advice.",
        },
      ];

  return (
    <div className="dd-redesign">
      <header className="dd-redesign-heading">
        <div className="dd-title-symbol">
          <FaStethoscope />
        </div>

        <div className="dd-title-copy">
          <span className="dd-overline">KISANVISION AI / PLANT HEALTH</span>
          <h1>Disease Detection</h1>
          <p>
            Upload a leaf image or use your live camera to analyze a supported
            crop using a trained AI model.
          </p>
        </div>

        <span
          className={`dd-model-pill ${
            apiStatus === "connected" ? "dd-model-online" : ""
          }`}
        >
          <i />
          {apiStatus === "connected"
            ? "COFFEE MODEL CONNECTED"
            : apiStatus === "error"
              ? "API CONNECTION ISSUE"
              : "CHECKING COFFEE MODEL"}
        </span>
      </header>

      <div className="dd-breadcrumb">
        <span>Home</span>
        <FaChevronRight />
        <strong>Disease Detection</strong>
      </div>

      <div className="dd-redesign-layout">
        <aside className="dd-sidebar">
          <h2 className="dd-sidebar-title">
            <FaStethoscope /> Disease Detection
          </h2>

          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                type="button"
                key={tool.name}
                className={`dd-sidebar-link ${
                  activeTool === tool.name ? "active" : ""
                }`}
                onClick={() => openSection(tool.name)}
              >
                <Icon />
                <span>{tool.name}</span>
              </button>
            );
          })}

          <div className="dd-sidebar-art">
            <FaLeaf className="dd-art-leaf" />
            <strong>
              Healthy Crops
              <br />
              Better Decisions
              <br />
              Brighter Future
            </strong>
          </div>
        </aside>

        <main className="dd-redesign-main">
          {message && (
            <div className="dd-message" role="alert">
              <FaExclamationTriangle />
              <span>{message}</span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <FaTimes />
              </button>
            </div>
          )}

          <label className="dd-crop-select">
            Select crop for analysis
            <select
              value={selectedCrop}
              onChange={(event) => {
                setSelectedCrop(event.target.value);
                setPrediction(null);
                setMessage("");
              }}
            >
              {crops.map((crop) => (
                <option key={crop.name} value={crop.name}>
                  {crop.name}
                  {crop.supported ? " — AI model connected" : " — Model pending"}
                </option>
              ))}
            </select>
          </label>

          <section
            className="dd-workbench"
            id="detect-disease"
            ref={(element) => {
              sectionRefs.current["Detect Disease"] = element;
            }}
          >
            <article className="dd-card dd-camera-card">
              <div className="dd-card-tabs">
                <span className={cameraActive ? "" : "selected"}>
                  <FaCamera /> Live Camera
                </span>
              </div>

              <div className="dd-video-stage">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    className="dd-live-video"
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <div className="dd-camera-empty">
                    <FaCamera />
                    <strong>Live leaf camera</strong>
                    <span>
                      Open your camera to capture a clear leaf image.
                    </span>
                  </div>
                )}
              </div>

              <label className="dd-camera-choice">
                Camera preference
                <select
                  value={cameraFacing}
                  onChange={(event) => setCameraFacing(event.target.value)}
                >
                  <option value="environment">Rear camera (if available)</option>
                  <option value="user">Front camera</option>
                </select>
              </label>

              <div className="dd-camera-controls">
                {!cameraActive ? (
                  <button
                    type="button"
                    className="dd-primary-action"
                    onClick={startCamera}
                    disabled={cameraLoading}
                  >
                    <FaCamera />
                    {cameraLoading ? "Opening camera..." : "Open Live Camera"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="dd-primary-action"
                      onClick={captureImage}
                    >
                      <FaCamera /> Capture Leaf
                    </button>

                    <button
                      type="button"
                      className="dd-secondary-action"
                      onClick={stopCamera}
                    >
                      <FaTimes /> Stop
                    </button>
                  </>
                )}
              </div>
            </article>

            <article className="dd-card dd-upload-card">
              <div className="dd-card-tabs">
                <button
                  type="button"
                  className="selected"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload /> Upload Image
                </button>
              </div>

              <div className="dd-upload-preview">
                {imageUrl ? (
                  <img src={imageUrl} alt="Selected leaf preview" />
                ) : (
                  <div className="dd-upload-preview-empty">
                    <FaLeaf />
                    <strong>No image selected</strong>
                    <span>Your selected leaf image appears here.</span>
                  </div>
                )}
              </div>

              <label
                className={`dd-drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    handleFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <FaCloudUploadAlt />
                <strong>Drag &amp; drop a leaf image here</strong>
                <span>or click to choose a file</span>
                <small>Supported: JPG, PNG, WebP · Maximum size: 5 MB</small>
              </label>

              {selectedFile && (
                <div className="dd-selected-file">
                  <span>
                    <FaLeaf />
                    {fileName}
                  </span>
                  <button type="button" onClick={clearImage}>
                    <FaTimes /> Remove
                  </button>
                </div>
              )}

              <div className="dd-honesty-note">
                <FaInfoCircle />
                <span>
                  Coffee disease classification is connected. The other four
                  crops require separate trained models.
                </span>
              </div>

              <button
                type="button"
                className="dd-primary-action dd-analyze-action"
                onClick={analyzeDisease}
                disabled={!selectedFile || predictionLoading}
              >
                <FaMicroscope />
                {predictionLoading ? "Analyzing leaf..." : "Analyze Disease"}
              </button>
            </article>
                        <article className="dd-card dd-result-card">
              <div className="dd-result-heading">
                <h2>
                  <FaShieldAlt /> Detection Result
                </h2>

                <span className="dd-pending-pill">
                  {prediction
                    ? "Prediction complete"
                    : predictionLoading
                      ? "Analyzing"
                      : "Awaiting analysis"}
                </span>
              </div>

              <div
                className={`dd-result-empty ${
                  prediction ? "dd-has-prediction" : ""
                }`}
              >
                <div>
                  {prediction ? (
                    isHealthy ? (
                      <FaCheckCircle />
                    ) : (
                      <FaExclamationTriangle />
                    )
                  ) : (
                    <FaShieldAlt />
                  )}
                </div>

                <h3>
                  {prediction
                    ? guidance?.title || prediction.predicted_class
                    : predictionLoading
                      ? "Analyzing Coffee leaf"
                      : "Ready for analysis"}
                </h3>

                <p>
                  {prediction
                    ? guidance?.description ||
                      "The model returned a classification. Verify the result before acting."
                    : "Upload or capture a leaf image, then select Analyze Disease to request a prediction."}
                </p>
              </div>

              <div className="dd-result-metrics">
                <div>
                  <span>Crop / Plant</span>
                  <strong>{prediction ? "Coffee" : "Not analyzed"}</strong>
                </div>

                <div>
                  <span>Detected class</span>
                  <strong>
                    {prediction?.predicted_class || "Not analyzed"}
                  </strong>
                </div>

                <div>
                  <span>Model confidence</span>
                  <strong>
                    {prediction
                      ? `${Number(prediction.confidence).toFixed(2)}%`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Plant status</span>
                  <strong>
                    {prediction
                      ? guidance?.status || "Classification returned"
                      : "Not determined"}
                  </strong>
                </div>

                <div>
                  <span>Affected area</span>
                  <strong>Not measured</strong>
                </div>

                <div>
                  <span>Severity</span>
                  <strong>Not estimated</strong>
                </div>
              </div>

              {prediction?.probabilities && (
                <div className="dd-probabilities">
                  <h3>Class probability scores</h3>

                  {Object.entries(prediction.probabilities)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([name, score]) => (
                      <div className="dd-probability-row" key={name}>
                        <div className="dd-probability-label">
                          <span>{name}</span>
                          <strong>{Number(score).toFixed(2)}%</strong>
                        </div>

                        <div
                          className="dd-probability-track"
                          role="progressbar"
                          aria-label={`${name} probability`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.min(
                            100,
                            Math.max(0, Number(score) || 0)
                          )}
                        >
                          <div
                            className="dd-probability-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(score) || 0)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {prediction && (
                <div className="dd-localization-warning">
                  <FaInfoCircle />
                  <span>
                    Prediction is experimental and must be verified.
                    Confidence is not a confirmed diagnosis.
                  </span>
                </div>
              )}
            </article>
          </section>

          <section
            className="dd-card dd-crops-card"
            id="supported-crops"
            ref={(element) => {
              sectionRefs.current["Supported Crops"] = element;
            }}
          >
            <div className="dd-section-heading">
              <h2>
                <FaSeedling /> Supported Crops (5)
              </h2>
              <span>Select a crop to view its model status.</span>
            </div>

            <div className="dd-crop-grid">
              {crops.map((crop) => (
                <button
                  type="button"
                  key={crop.name}
                  className={`dd-crop-item ${
                    selectedCrop === crop.name ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedCrop(crop.name);
                    setPrediction(null);
                    setMessage("");
                  }}
                >
                  <img
                    className="dd-crop-image"
                    src={crop.image}
                    alt={`${crop.name} reference`}
                    loading="lazy"
                  />

                  <strong>{crop.name}</strong>
                  <em>{crop.scientific}</em>

                  <small
                    className={
                      crop.supported ? "crop-ready" : "crop-pending"
                    }
                  >
                    {crop.supported ? "Model connected" : "Model pending"}
                  </small>
                </button>
              ))}
            </div>
          </section>

          <section className="dd-information-grid">
            <article
              className="dd-card dd-info-card"
              id="disease-information"
              ref={(element) => {
                sectionRefs.current["Disease Information"] = element;
              }}
            >
              <h2>
                <FaBookOpen /> Disease Details
              </h2>

              {prediction ? (
                <>
                  <p>
                    <strong>Model prediction:</strong>{" "}
                    {prediction.predicted_class}
                  </p>

                  <div className="dd-info-placeholder">
                    <FaInfoCircle />
                    <span>
                      This result comes from the image classifier. It does
                      not independently confirm the causal organism.
                    </span>
                  </div>
                </>
              ) : (
                <div className="dd-info-placeholder">
                  <FaInfoCircle />
                  <span>
                    Upload a Coffee leaf image to view its predicted class
                    and related information.
                  </span>
                </div>
              )}
            </article>

            <article className="dd-card dd-info-card">
              <h2>
                <FaChartPie /> Disease Area Analysis
              </h2>

              <div className="dd-area-empty">
                <div className="dd-empty-ring" />
                <strong>Localization model required</strong>
                <p>
                  The current classifier does not measure the percentage
                  of leaf area affected by disease.
                </p>
              </div>
            </article>

            <article
              className="dd-card dd-info-card"
              id="treatment-prevention"
              ref={(element) => {
                sectionRefs.current["Prevention & Treatment"] = element;
              }}
            >
              <h2>
                <FaLightbulb /> Treatment &amp; Prevention
              </h2>

              {treatmentRows.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="dd-treatment-row" key={item.title}>
                    <Icon />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </article>

            <article className="dd-card dd-info-card dd-full-width">
              <h2>
                <FaFlask /> Severity Analysis
              </h2>

              <p>
                Severity estimation is not connected. A reliable score
                requires validated affected-area measurements and defined
                severity criteria.
              </p>

              <div className="dd-info-placeholder">
                <FaShieldAlt />
                <span>
                  A class prediction is available when the API responds,
                  but it does not provide a validated severity score.
                </span>
              </div>
            </article>

            <article
              className="dd-card dd-info-card dd-full-width"
              id="upload-history"
              ref={(element) => {
                sectionRefs.current["Upload History"] = element;
              }}
            >
              <h2>
                <FaImages /> Upload History
              </h2>

              {history.length === 0 ? (
                <p>
                  No completed predictions in this page session yet.
                  Your original dataset and model files are not modified
                  by image uploads.
                </p>
              ) : (
                history.map((item, index) => (
                  <div
                    className="dd-history-item"
                    key={`${item.createdAt}-${index}`}
                  >
                    <img src={item.imageUrl} alt="Analyzed Coffee leaf" />

                    <div>
                      <strong>{item.fileName}</strong>
                      <span>
                        {item.predicted_class} ·{" "}
                        {Number(item.confidence).toFixed(2)}% confidence
                      </span>
                      <span>{item.createdAt}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(item.imageUrl);
                        setFileName(item.fileName);
                        setPrediction(item);
                        setSelectedCrop("Coffee");
                        setMessage("");
                        openSection("Detect Disease");
                      }}
                    >
                      <FaSearch /> View
                    </button>
                  </div>
                ))
              )}
            </article>

            <article
              className="dd-card dd-info-card dd-full-width"
              id="disease-faqs"
              ref={(element) => {
                sectionRefs.current.FAQs = element;
              }}
            >
              <h2>
                <FaQuestionCircle /> Frequently Asked Questions
              </h2>

              {faqs.map((faq, index) => (
                <div className="dd-faq-item" key={faq.question}>
                  <button
                    type="button"
                    className="dd-faq-question"
                    aria-expanded={openFaq === index}
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                  >
                    <span>{faq.question}</span>
                    <span>{openFaq === index ? "−" : "+"}</span>
                  </button>

                  {openFaq === index && (
                    <p className="dd-faq-answer">{faq.answer}</p>
                  )}
                </div>
              ))}
            </article>
          </section>

          <footer className="dd-info-placeholder">
            <FaShieldAlt />
            <span>
              KisanVision AI · BAI586 academic mini-project. Predictions
              are experimental and are not a substitute for professional
              agricultural diagnosis.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}