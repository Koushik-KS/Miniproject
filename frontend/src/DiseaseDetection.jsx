
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
} from "react-icons/fa";

import "./DiseaseDetection.css";

export default function DiseaseDetectionPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [dragging, setDragging] = useState(false);
  const [activeTool, setActiveTool] = useState("Detect Disease");
  const [openFaq, setOpenFaq] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const sectionRefs = useRef({});

  const sectionIds = {
    "Detect Disease": "detect-disease",
    "Disease Area Analysis": "disease-area-analysis",
    "Severity Analysis": "severity-analysis",
    "Treatment & Prevention": "treatment-prevention",
    FAQs: "disease-faqs",
  };

  const tools = [
    { name: "Detect Disease", icon: FaMicroscope },
    { name: "Disease Area Analysis", icon: FaChartPie },
    { name: "Severity Analysis", icon: FaInfoCircle },
    { name: "Treatment & Prevention", icon: FaLightbulb },
    { name: "FAQs", icon: FaQuestionCircle },
  ];

  const faqs = [
    {
      question: "How do I provide a leaf image?",
      answer:
        "Open the live camera and capture an image, or upload a JPG, PNG or WebP image up to 5 MB.",
    },
    {
      question: "Why is disease detection not showing a result?",
      answer:
        "Image capture and upload are available, but a trained and tested disease classification model has not yet been connected.",
    },
    {
      question: "Can the system highlight affected leaf regions?",
      answer:
        "This requires a suitable object-detection or segmentation model. The current interface does not estimate affected regions.",
    },
    {
      question: "Can I use treatment recommendations immediately?",
      answer:
        "Disease-specific recommendations should be provided after a supported prediction and verification against trusted agricultural guidance.",
    },
  ];

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

      video.play().catch(() => {
        setMessage(
          "Could not play the camera preview. Check browser permissions."
        );
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
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
        video: {
          facingMode: { ideal: cameraFacing },
        },
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

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImageUrl(String(reader.result));
      setFileName(file.name);
      setMessage("");
      stopCamera();
    };

    reader.onerror = () => {
      setMessage("Unable to read this image. Please try another file.");
    };

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

        const capturedFile = new File(
          [blob],
          `leaf-capture-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        handleFile(capturedFile);
      },
      "image/jpeg",
      0.92
    );
  };

  const clearImage = () => {
    setImageUrl("");
    setFileName("");
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="dd-redesign">
      {/* Page heading */}
      <header className="dd-redesign-heading">
        <div className="dd-title-symbol">
          <FaStethoscope />
        </div>

        <div className="dd-title-copy">
          <span className="dd-overline">
            KISANVISION AI / PLANT HEALTH
          </span>

          <h1>Disease Detection</h1>

          <p>
            Upload a leaf image or use your live camera to prepare a
            plant disease analysis.
          </p>
        </div>

        <span className="dd-model-pill">
          <i />
          MODEL NOT CONNECTED
        </span>
      </header>

      <div className="dd-redesign-layout">
        {/* Sidebar navigation */}
        <aside className="dd-sidebar">
          <div className="dd-sidebar-title">
            <FaStethoscope />
            <strong>Disease Detection</strong>
          </div>

          {tools.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={`dd-sidebar-link ${
                activeTool === name ? "active" : ""
              }`}
              aria-current={activeTool === name ? "location" : undefined}
              onClick={() => openSection(name)}
            >
              <Icon />
              <span>{name}</span>
            </button>
          ))}

          <div
            className="dd-sidebar-art"
            role="img"
            aria-label="Agricultural crop field"
          >
            <div className="dd-art-leaf">
              <FaLeaf />
            </div>

            <strong>
              Healthy Crops
              <br />
              Better Decisions
              <br />
              Brighter Future
            </strong>
          </div>
        </aside>

        {/* Main dashboard */}
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

          <div
            className="dd-workbench"
            id={sectionIds["Detect Disease"]}
            ref={(element) => {
              sectionRefs.current["Detect Disease"] = element;
            }}
          >
            {/* Camera */}
            <section className="dd-card dd-camera-card">
              <div className="dd-card-tabs">
                <span className="selected">
                  <FaCamera />
                  Live Camera
                </span>
              </div>

              <div className="dd-video-stage">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="dd-live-video"
                  />
                ) : (
                  <div className="dd-camera-empty">
                    <FaCamera />

                    <strong>Live leaf camera</strong>

                    <span>
                      Open your camera to capture a leaf image.
                    </span>
                  </div>
                )}
              </div>

              <label className="dd-camera-choice">
                Camera preference

                <select
                  value={cameraFacing}
                  onChange={(event) => {
                    setCameraFacing(event.target.value);

                    if (cameraActive) {
                      stopCamera();
                    }
                  }}
                >
                  <option value="environment">
                    Rear camera (if available)
                  </option>

                  <option value="user">
                    Front camera (if available)
                  </option>
                </select>
              </label>

              <div className="dd-camera-controls">
                {!cameraActive ? (
                  <button
                    className="dd-primary-action"
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading}
                  >
                    <FaCamera />

                    {cameraLoading
                      ? "Opening camera..."
                      : "Open Live Camera"}
                  </button>
                ) : (
                  <>
                    <button
                      className="dd-primary-action"
                      type="button"
                      onClick={captureImage}
                    >
                      <FaCamera />
                      Capture Image
                    </button>

                    <button
                      className="dd-secondary-action"
                      type="button"
                      onClick={stopCamera}
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Upload and preview */}
            <section className="dd-card dd-upload-card">
              <div className="dd-card-tabs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload />
                  Upload Image
                </button>
              </div>

              <div className="dd-upload-preview">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Selected plant leaf: ${
                      fileName || "captured image"
                    }`}
                  />
                ) : (
                  <div className="dd-upload-preview-empty">
                    <FaLeaf />

                    <strong>Leaf image preview</strong>

                    <span>
                      Your selected or captured image will appear here.
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`dd-drop-zone ${
                  dragging ? "dragging" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
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

                <small>
                  Supported: JPG, PNG, WebP
                  <br />
                  Maximum size: 5 MB
                </small>
              </div>

              {imageUrl && (
                <div className="dd-selected-file">
                  <span>
                    <FaLeaf />
                    {fileName || "Captured leaf image"}
                  </span>

                  <button type="button" onClick={clearImage}>
                    <FaTimes />
                    Remove
                  </button>
                </div>
              )}

              <p className="dd-honesty-note">
                <FaInfoCircle />
                Image upload is available. AI diagnosis requires a trained
                model.
              </p>
            </section>

            {/* Detection results */}
            <section className="dd-card dd-result-card">
              <div className="dd-result-heading">
                <h2>
                  <FaShieldAlt />
                  Detected Result
                </h2>

                <span className="dd-pending-pill">
                  Model pending
                </span>
              </div>

              <div className="dd-result-empty">
                <div>
                  <FaShieldAlt />
                </div>

                <h3>Awaiting trained model</h3>

                <p>
                  {imageUrl
                    ? "Image received. Connect and evaluate a trained model to display a disease prediction."
                    : "Capture or upload a leaf image, then connect a trained model to display supported predictions."}
                </p>
              </div>

              <div className="dd-result-metrics">
                <div>
                  <span>Crop / Plant</span>
                  <strong>Not analyzed</strong>
                </div>

                <div>
                  <span>Detected disease</span>
                  <strong>Not analyzed</strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>—</strong>
                </div>

                <div>
                  <span>Plant status</span>
                  <strong>Not determined</strong>
                </div>

                <div>
                  <span>Affected area</span>
                  <strong>Requires localization model</strong>
                </div>

                <div>
                  <span>Severity</span>
                  <strong>Not estimated</strong>
                </div>
              </div>

              <div className="dd-localization-warning">
                <FaInfoCircle />

                Disease-region outlines and affected-area percentages require
                a suitable detection or segmentation model.
              </div>
            </section>
          </div>

          {/* Information cards */}
          <div className="dd-information-grid">
            <section className="dd-card dd-info-card">
              <h2>
                <FaInfoCircle />
                Disease Details
              </h2>

              <p>
                Disease name, causal organism, symptoms and affected crop
                will appear after a supported model prediction is available.
              </p>

              <div className="dd-info-placeholder">
                <FaLeaf />
                <span>No prediction available yet.</span>
              </div>
            </section>

            <section
              className="dd-card dd-info-card"
              id={sectionIds["Disease Area Analysis"]}
              ref={(element) => {
                sectionRefs.current["Disease Area Analysis"] = element;
              }}
            >
              <h2>
                <FaChartPie />
                Disease Area Analysis
              </h2>

              <div className="dd-area-empty">
                <div className="dd-empty-ring" />

                <strong>Localization model required</strong>

                <p>
                  Affected-area percentages will appear only after the
                  affected region can be measured.
                </p>
              </div>
            </section>

            <section
              className="dd-card dd-info-card"
              id={sectionIds["Treatment & Prevention"]}
              ref={(element) => {
                sectionRefs.current["Treatment & Prevention"] = element;
              }}
            >
              <h2>
                <FaLightbulb />
                Treatment &amp; Prevention
              </h2>

              <div className="dd-treatment-row">
                <FaShieldAlt />

                <div>
                  <strong>Verified guidance pending</strong>

                  <p>
                    Disease-specific advice will be matched to the identified
                    crop and disease using trusted agricultural references.
                  </p>
                </div>
              </div>

              <div className="dd-treatment-row">
                <FaCheckCircle />

                <div>
                  <strong>General precaution</strong>

                  <p>
                    Use clear leaf images and avoid applying pesticides based
                    only on an unverified image result.
                  </p>
                </div>
              </div>
            </section>

            {/* Severity */}
            <section
              className="dd-card dd-info-card dd-full-width"
              id={sectionIds["Severity Analysis"]}
              ref={(element) => {
                sectionRefs.current["Severity Analysis"] = element;
              }}
            >
              <h2>
                <FaInfoCircle />
                Severity Analysis
              </h2>

              <p>
                Severity estimation is not connected yet. A reliable estimate
                needs validated model output and defined severity criteria.
              </p>

              <div className="dd-info-placeholder">
                <FaShieldAlt />

                <span>
                  No severity score is available because no validated
                  analysis has been performed.
                </span>
              </div>
            </section>

           
{/* FAQs */}
<section
  className="dd-card dd-info-card dd-full-width"
  id={sectionIds.FAQs}
  ref={(element) => {
    sectionRefs.current.FAQs = element;
  }}
>
  <h2>
    <FaQuestionCircle />
    Frequently Asked Questions
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
</section>

          </div>
        </main>
      </div>
    </section>
  );
}
