
import { useEffect, useRef, useState } from "react";
import {
  FaLeaf,
  FaCamera,
  FaUpload,
  FaTimes,
  FaInfoCircle,
  FaSeedling,
  FaCheckCircle,
  FaImage,
  FaHistory,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCloudSun,
  FaMicroscope,
} from "react-icons/fa";
import "./PlantIdentification.css";

const questions = [
  {
    question: "How do I identify a plant?",
    answer:
      "Upload a clear image of the plant, leaf, flower or fruit. The image can be previewed here. A trained identification model is required to produce an actual identification.",
  },
  {
    question: "Can I upload a fruit and leaf together?",
    answer:
      "Yes. You can upload a photograph showing both the fruit and leaves. For more reliable analysis, provide clear images of each plant part when possible.",
  },
  {
    question: "Will the system identify plant diseases?",
    answer:
      "Disease screening is a separate task. It requires a compatible, evaluated disease-detection model. This page does not generate disease predictions until a model is connected.",
  },
  {
    question: "Why is no identification result displayed?",
    answer:
      "The frontend is ready for image capture and upload, but a trained plant-identification model has not yet been connected.",
  },
];

const plantParts = [
  { name: "Leaf", description: "Leaf shape and arrangement" },
  { name: "Flower", description: "Flower colour and structure" },
  { name: "Fruit", description: "Fruit shape and appearance" },
  { name: "Whole plant", description: "Overall plant structure" },
];

export default function PlantIdentificationPage() {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [activeSection, setActiveSection] = useState("identify");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  const openCamera = async () => {
    setError("");
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Open this application in a supported browser using localhost or HTTPS."
      );
      return;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Camera access failed. Allow camera permission in your browser and try again."
      );
    }
  };

  const handleFile = (file) => {
    setError("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setImageName(file.name);
      stopCamera();
    };

    reader.onerror = () => {
      setError("The image could not be read. Please try another file.");
    };

    reader.readAsDataURL(file);
  };

  const captureImage = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Wait for the camera preview to load, then capture.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture the image in this browser.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Image capture failed. Please try again.");
          return;
        }

        const file = new File([blob], "plant-capture.jpg", {
          type: "image/jpeg",
        });

        handleFile(file);
      },
      "image/jpeg",
      0.92
    );
  };

  const clearImage = () => {
    setImage(null);
    setImageName("");
    setError("");

    if (fileRef.current) fileRef.current.value = "";
  };

  const navigateToSection = (section) => {
    setActiveSection(section);

    document.getElementById(`pi-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="pi-page">
      <header className="pi-heading">
        <div className="pi-heading-icon">
          <FaLeaf />
        </div>

        <div className="pi-heading-copy">
          <span className="pi-eyebrow">KISANVISION AI / PLANT HEALTH</span>
          <h1>Plant Identification</h1>
          <p>
            Upload a plant, leaf or fruit image to prepare an identification
            analysis.
          </p>
        </div>

        <span className="pi-status">
          <span />
          MODEL NOT CONNECTED
        </span>
      </header>

      <div className="pi-layout">
        <aside className="pi-sidebar">
          <h2>
            <FaLeaf /> Plant Identification
          </h2>

          <button
            className={activeSection === "identify" ? "active" : ""}
            onClick={() => navigateToSection("identify")}
            type="button"
          >
            <FaSeedling /> Identify Plant
          </button>

          <button
            className={activeSection === "characteristics" ? "active" : ""}
            onClick={() => navigateToSection("characteristics")}
            type="button"
          >
            <FaLeaf /> Plant Characteristics
          </button>

          <button
            className={activeSection === "parts" ? "active" : ""}
            onClick={() => navigateToSection("parts")}
            type="button"
          >
            <FaImage /> Plant Parts
          </button>

          <button
            className={activeSection === "information" ? "active" : ""}
            onClick={() => navigateToSection("information")}
            type="button"
          >
            <FaInfoCircle /> Key Information
          </button>

          <button
            className={activeSection === "faqs" ? "active" : ""}
            onClick={() => navigateToSection("faqs")}
            type="button"
          >
            <FaQuestionCircle /> FAQs
          </button>

          <div className="pi-sidebar-photo">
            <strong>
              Know Your Plants
              <br />
              Grow With Confidence
            </strong>
          </div>
        </aside>

        <main className="pi-main">
          <section className="pi-workbench" id="pi-identify">
            <article className="pi-card">
              <div className="pi-card-title">
                <h2>
                  <FaCamera /> Live Camera
                </h2>
              </div>

              <div className="pi-camera-frame">
                {cameraOpen ? (
                  <video
                    ref={videoRef}
                    className="pi-video"
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <div className="pi-empty">
                    <FaCamera />
                    <strong>Live plant camera</strong>
                    <span>Capture a clear view of the plant.</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="pi-error">
                  <FaInfoCircle /> {cameraError}
                </div>
              )}

              <div className="pi-actions">
                {!cameraOpen ? (
                  <button
                    type="button"
                    className="pi-primary"
                    onClick={openCamera}
                  >
                    <FaCamera /> Open Live Camera
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="pi-primary"
                      onClick={captureImage}
                    >
                      <FaCamera /> Capture Plant
                    </button>

                    <button
                      type="button"
                      className="pi-stop"
                      onClick={stopCamera}
                    >
                      <FaTimes /> Stop
                    </button>
                  </>
                )}
              </div>

              <p className="pi-hint">
                Keep the plant in focus and use natural light where possible.
              </p>
            </article>

            <article className="pi-card">
              <div className="pi-card-title">
                <h2>
                  <FaUpload /> Upload Plant Image
                </h2>
              </div>

              <label className="pi-dropzone">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
                <FaUpload />
                <strong>Drag a plant image here</strong>
                <span>or click to choose a file</span>
                <small>JPG, PNG or WebP · Maximum 5 MB</small>
              </label>

              {error && <div className="pi-error">{error}</div>}

              <div className="pi-preview">
                {image ? (
                  <>
                    <img src={image} alt="Uploaded plant preview" />
                    <div className="pi-image-caption">
                      <span>
                        <FaCheckCircle /> Image ready for review
                      </span>
                      <button type="button" onClick={clearImage}>
                        <FaTimes /> Remove
                      </button>
                    </div>
                    <p className="pi-filename">{imageName}</p>
                  </>
                ) : (
                  <div className="pi-empty">
                    <FaLeaf />
                    <strong>Plant image preview</strong>
                    <span>Your selected or captured image will appear here.</span>
                  </div>
                )}
              </div>

              <div className="pi-note">
                <FaInfoCircle />
                <span>
                  Image upload and preview are available. Identification
                  requires a trained model.
                </span>
              </div>
            </article>

            <article className="pi-card pi-result-card">
              <div className="pi-card-title pi-result-title">
                <h2>
                  <FaShieldAlt /> Identification Result
                </h2>
                <span className="pi-pending">Model pending</span>
              </div>

              <div className="pi-result-empty">
                {image ? (
                  <img src={image} alt="Image awaiting plant identification" />
                ) : (
                  <div className="pi-result-icon">
                    <FaLeaf />
                  </div>
                )}

                <h3>Awaiting trained model</h3>
                <p>
                  {image
                    ? "Your image is ready. Connect and evaluate a plant-identification model to obtain a supported result."
                    : "Capture or upload a plant image to prepare it for analysis."}
                </p>
              </div>

              <div className="pi-result-fields">
                <div>
                  <span>Identified crop</span>
                  <strong>Not analyzed</strong>
                </div>
                <div>
                  <span>Scientific name</span>
                  <strong>Not analyzed</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>—</strong>
                </div>
                <div>
                  <span>Plant family</span>
                  <strong>Not determined</strong>
                </div>
                <div>
                  <span>Plant part</span>
                  <strong>Requires analysis</strong>
                </div>
                <div>
                  <span>Disease screening</span>
                  <strong>Separate model required</strong>
                </div>
              </div>

              <div className="pi-warning">
                <FaInfoCircle />
                <span>
                  No crop name or confidence score is generated until a
                  compatible model is connected.
                </span>
              </div>
            </article>
          </section>

          <section className="pi-detail-grid">
            <article className="pi-card" id="pi-characteristics">
              <div className="pi-card-title">
                <h2>
                  <FaLeaf /> Plant Characteristics
                </h2>
              </div>

              <p className="pi-muted">
                These characteristics will be populated from model output or
                verified plant reference data when available.
              </p>

              {[
                "Plant type",
                "Leaf shape",
                "Leaf arrangement",
                "Leaf texture",
                "Flower characteristics",
                "Fruit characteristics",
                "Scientific name",
              ].map((item) => (
                <div className="pi-characteristic" key={item}>
                  <span>{item}</span>
                  <strong>Awaiting identification</strong>
                </div>
              ))}
            </article>

            <article className="pi-card" id="pi-parts">
              <div className="pi-card-title">
                <h2>
                  <FaImage /> Plant Parts
                </h2>
              </div>

              <p className="pi-muted">
                Images may contain leaves, flowers, fruit or the whole plant.
                These examples describe what can be inspected; they are not
                identification results.
              </p>

              <div className="pi-parts-grid">
                {plantParts.map((part) => (
                  <div className="pi-part" key={part.name}>
                    <div className="pi-part-icon">
                      {part.name === "Fruit" ? (
                        <FaSeedling />
                      ) : (
                        <FaLeaf />
                      )}
                    </div>
                    <strong>{part.name}</strong>
                    <span>{part.description}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="pi-card" id="pi-information">
              <div className="pi-card-title">
                <h2>
                  <FaInfoCircle /> Key Information
                </h2>
              </div>

              <div className="pi-info-row">
                <FaSeedling />
                <span>Crop identification</span>
                <strong>Model pending</strong>
              </div>
              <div className="pi-info-row">
                <FaMicroscope />
                <span>Disease analysis</span>
                <strong>Separate model</strong>
              </div>
              <div className="pi-info-row">
                <FaCloudSun />
                <span>Growing conditions</span>
                <strong>Verified data required</strong>
              </div>
              <div className="pi-info-row">
                <FaShieldAlt />
                <span>Result validation</span>
                <strong>Not available yet</strong>
              </div>

              <div className="pi-note">
                <FaInfoCircle />
                <span>
                  Growing advice must be matched to the correctly identified
                  crop and local conditions.
                </span>
              </div>
            </article>
          </section>

          <section className="pi-card pi-faq-card" id="pi-faqs">
            <div className="pi-card-title">
              <h2>
                <FaQuestionCircle /> Frequently Asked Questions
              </h2>
            </div>

            {questions.map((item, index) => (
              <div className="pi-faq" key={item.question}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? -1 : index)
                  }
                  aria-expanded={expandedFaq === index}
                >
                  <span>{item.question}</span>
                  {expandedFaq === index ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </button>

                {expandedFaq === index && <p>{item.answer}</p>}
              </div>
            ))}
          </section>

          <footer className="pi-footer">
            <span>KisanVision AI · BAI586 academic mini-project</span>
            <span>Development build · Not an official government service</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
