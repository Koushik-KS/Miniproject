
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
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCloudSun,
  FaMicroscope,
  FaBars,
  FaHistory,
  FaSearch,
  FaUsers,
} from "react-icons/fa";
import "./PlantIdentification.css";

const crops = [
  {
    name: "Coffee",
    scientific: "Coffea spp.",
    image: "/assets/coffe.png",
    description: "Glossy green leaves and coffee cherries.",
  },
  {
    name: "Arecanut",
    scientific: "Areca catechu",
    image: "/assets/arecanut.png",
    description: "Long feather-like palm leaves.",
  },
  {
   
    name: "Cardamom",
    scientific: "Elettaria cardamomum",
    image: "/assets/cardmone.png",
    description: "Long green leaves of the cardamom plant.",
  },
  {
    
    name: "Ginger",
    scientific: "Zingiber officinale",
    image: "/assets/ginger.png",
    description: "Narrow leaves of the ginger plant.",
  },
  {
    name: "Black Pepper",
    scientific: "Piper nigrum",
    image: "/assets/peppar.png",
    description: "Green leaves of the black pepper vine.",
  },
];

const questions = [
  {
    question: "How do I identify a plant?",
    answer:
      "Upload a clear photo of a leaf, flower, fruit, or whole plant. The image can be previewed here. A trained identification model must be connected before the application can identify it.",
  },
  {
    question: "Which crops does this prototype support?",
    answer:
      "The current project scope includes Coffee, Arecanut, Elakki (Cardamom), Shunti (Ginger), and Black Pepper. Actual automated identification depends on a trained and evaluated model.",
  },
  {
    question: "Can I use a live camera?",
    answer:
      "Yes. Allow camera permission in your browser, capture a clear plant photo, and review the captured image before using it.",
  },
  {
    question: "Does plant identification detect diseases?",
    answer:
      "Plant identification and disease detection are separate tasks. Disease predictions require a compatible disease-detection model.",
  },
  {
    question: "Why is my identification result pending?",
    answer:
      "Image upload and preview are available, but the trained plant-identification model has not yet been connected. No crop prediction or confidence score is fabricated.",
  },
];

const characteristics = [
  ["Plant type", "Awaiting identification"],
  ["Leaf shape", "Awaiting identification"],
  ["Leaf arrangement", "Awaiting identification"],
  ["Leaf texture", "Awaiting identification"],
  ["Flower characteristics", "Awaiting identification"],
  ["Fruit characteristics", "Awaiting identification"],
  ["Scientific name", "Awaiting identification"],
];

export default function PlantIdentificationPage() {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [activeSection, setActiveSection] = useState("identify");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

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
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  const handleFile = (file) => {
    setError("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
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
      setError("The image could not be read. Please choose another file.");
    };

    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setError("");
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use a supported browser on localhost or HTTPS."
      );
      return;
    }

    stopCamera();

    try {
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

  const captureImage = () => {
    const video = videoRef.current;

    if (!video?.videoWidth || !video?.videoHeight) {
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

        handleFile(
          new File([blob], "plant-capture.jpg", { type: "image/jpeg" })
        );
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
    setMobileMenuOpen(false);

    document.getElementById(`pi-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems = [
    { id: "identify", label: "Identify Plant", icon: <FaSeedling /> },
    { id: "supported", label: "Supported Crops", icon: <FaUsers /> },
    {
      id: "characteristics",
      label: "Plant Characteristics",
      icon: <FaLeaf />,
    },
    { id: "parts", label: "Plant Parts", icon: <FaImage /> },
    { id: "information", label: "Key Information", icon: <FaInfoCircle /> },
    { id: "history", label: "Upload History", icon: <FaHistory /> },
    { id: "faqs", label: "FAQs", icon: <FaQuestionCircle /> },
  ];

  return (
    <div className="pi-page">
      <div className="pi-page-heading">
        <button
          type="button"
          className="pi-mobile-menu-button"
          aria-label="Open page navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <FaBars />
        </button>

        <div className="pi-heading-icon">
          <FaLeaf />
        </div>

        <div className="pi-heading-copy">
          <span className="pi-eyebrow">CROP HEALTH TOOLS</span>
          <h1>Plant Identification</h1>
          <p>
            Upload a leaf image to prepare plant identification.
            {" "}Supported crop scope: 5 crops.
          </p>
        </div>

        <div className="pi-heading-decoration" aria-hidden="true">
          <FaImage />
        </div>
      </div>

      <div className="pi-layout">
        <aside
          className={`pi-sidebar ${mobileMenuOpen ? "pi-sidebar-open" : ""}`}
          aria-label="Plant identification navigation"
        >
          <h2>
            <FaLeaf /> Plant Identification
          </h2>

          <nav className="pi-side-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => navigateToSection(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pi-sidebar-photo">
            <strong>
              Know Your Crops
              <br />
              Grow With Confidence
            </strong>
          </div>
        </aside>

        {mobileMenuOpen && (
          <button
            type="button"
            className="pi-mobile-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="pi-main">
          <section className="pi-top-grid" id="pi-identify">
            <article className="pi-card pi-upload-card">
              <div className="pi-upload-tabs">
                <button
                  type="button"
                  className={!cameraOpen ? "selected" : ""}
                  onClick={() => {
                    stopCamera();
                    fileRef.current?.click();
                  }}
                >
                  <FaUpload /> Upload Image
                </button>

                <button
                  type="button"
                  className={cameraOpen ? "selected" : ""}
                  onClick={openCamera}
                >
                  <FaCamera /> Live Camera
                </button>
              </div>

              {cameraError && (
                <div className="pi-error">
                  <FaInfoCircle />
                  <span>{cameraError}</span>
                </div>
              )}

              {cameraOpen ? (
                <div className="pi-camera-area">
                  <video
                    ref={videoRef}
                    className="pi-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="pi-camera-actions">
                    <button
                      type="button"
                      className="pi-primary"
                      onClick={captureImage}
                    >
                      <FaCamera /> Capture Plant
                    </button>
                    <button
                      type="button"
                      className="pi-secondary"
                      onClick={stopCamera}
                    >
                      <FaTimes /> Stop Camera
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className={`pi-dropzone ${dragging ? "dragging" : ""}`}
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
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <FaUpload className="pi-drop-icon" />
                  <strong>Drag &amp; drop a plant image here</strong>
                  <span>or</span>
                  <span className="pi-choose-file">Choose File</span>
                  <small>Supports JPG, PNG, WebP · Maximum 5 MB</small>
                </label>
              )}

              {error && (
                <div className="pi-error">
                  <FaInfoCircle />
                  <span>{error}</span>
                </div>
              )}

              <div className="pi-supported-mini" id="pi-supported">
                <h2>
                  <FaSeedling /> Supported Crops (5)
                </h2>

                <div className="pi-crop-strip">
                  {crops.map((crop) => (
                    <div className="pi-crop-tile" key={crop.name}>
                      <img
                        src={crop.image}
                        alt={`${crop.name} reference`}
                        loading="lazy"
                      />
                      <strong>{crop.name}</strong>
                      {crop.subtitle && <span>({crop.subtitle})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="pi-card pi-uploaded-card">
              <div className="pi-card-title">
                <h2>
                  <FaImage /> Uploaded Image
                </h2>
                {image && (
                  <button
                    type="button"
                    className="pi-clear-button"
                    onClick={clearImage}
                  >
                    <FaTimes /> Remove
                  </button>
                )}
              </div>

              <div className={`pi-image-viewer ${image ? "has-image" : ""}`}>
                {image ? (
                  <img src={image} alt="Uploaded plant preview" />
                ) : (
                  <div className="pi-image-placeholder">
                    <FaLeaf />
                    <strong>No image selected</strong>
                    <span>Your uploaded or captured image appears here.</span>
                  </div>
                )}
              </div>

              {image && (
                <div className="pi-image-caption">
                  <span>
                    <FaCheckCircle /> Image ready for review
                  </span>
                  <p title={imageName}>{imageName}</p>
                </div>
              )}
            </article>

            <article className="pi-card pi-identification-card">
              <div className="pi-card-title pi-result-title">
                <h2>
                  <FaShieldAlt /> Identification Result
                </h2>
                <span className="pi-pending">
                  <span /> Model pending
                </span>
              </div>

              <div className="pi-result-empty">
                <div className="pi-result-icon">
                  <FaLeaf />
                </div>
                <h3>{image ? "Ready for analysis" : "Awaiting image"}</h3>
                <p>
                  {image
                    ? "Your image is ready. A trained identification model is required to return a crop prediction."
                    : "Upload or capture a plant image to prepare it for identification."}
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
                  <span>Category</span>
                  <strong>Not determined</strong>
                </div>
                <div>
                  <span>Plant family</span>
                  <strong>Not determined</strong>
                </div>
                <div>
                  <span>Disease screening</span>
                  <strong>Separate model required</strong>
                </div>
              </div>

              <div className="pi-note">
                <FaInfoCircle />
                <span>
                  No crop name, plant information, or confidence score is
                  generated until a compatible model is connected.
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
                Characteristics will be populated after identification or from
                verified plant reference data.
              </p>

              <div className="pi-characteristics-table">
                {characteristics.map(([label, value]) => (
                  <div className="pi-characteristic" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="pi-card" id="pi-parts">
              <div className="pi-card-title">
                <h2>
                  <FaImage /> Different Views (Reference Images)
                </h2>
              </div>

              <p className="pi-muted">
                Example views of the supported crops. These are reference
                photographs, not predictions from your uploaded image.
              </p>

              <div className="pi-reference-grid">
                {[
                  crops[2],
                  crops[0],
                  crops[4],
                ].map((crop, index) => (
                  <div className="pi-reference-item" key={`${crop.name}-${index}`}>
                    <img src={crop.image} alt={`${crop.name} reference view`} loading="lazy" />
                    <strong>{["Leaf view", "Plant view", "Crop view"][index]}</strong>
                    <span>{crop.name}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="pi-card" id="pi-information">
              <div className="pi-card-title">
                <h2>
                  <FaSearch /> Similar Crops (For Reference)
                </h2>
              </div>

              <p className="pi-muted">
                Compare reference photographs. Visual similarity alone does
                not confirm a plant's identity.
              </p>

              <div className="pi-similar-grid">
                {crops.slice(1).map((crop) => (
                  <div className="pi-similar-item" key={crop.name}>
                    <img src={crop.image} alt={`${crop.name} reference`} loading="lazy" />
                    <strong>{crop.name}</strong>
                    {crop.subtitle && <span>({crop.subtitle})</span>}
                  </div>
                ))}
              </div>

              <div className="pi-note">
                <FaShieldAlt />
                <span>
                  Confirm identification using a trained model or a qualified
                  agricultural expert.
                </span>
              </div>
            </article>
          </section>

          <section className="pi-card pi-information-panel" id="pi-history">
            <div className="pi-card-title">
              <h2>
                <FaHistory /> Upload History
              </h2>
            </div>
            <p className="pi-muted">
              This prototype does not yet save identification history. Uploaded
              images remain in the current page session only.
            </p>
          </section>

          <section className="pi-card pi-information-panel" id="pi-supported-details">
            <div className="pi-card-title">
              <h2>
                <FaCloudSun /> Key Information
              </h2>
            </div>
            <div className="pi-info-row">
              <FaSeedling />
              <span>Plant identification</span>
              <strong>Model pending</strong>
            </div>
            <div className="pi-info-row">
              <FaMicroscope />
              <span>Disease analysis</span>
              <strong>Separate model required</strong>
            </div>
            <div className="pi-info-row">
              <FaCloudSun />
              <span>Growing conditions</span>
              <strong>Verified local data required</strong>
            </div>
            <div className="pi-info-row">
              <FaShieldAlt />
              <span>Result validation</span>
              <strong>Not available yet</strong>
            </div>
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
                  {expandedFaq === index ? <FaChevronUp /> : <FaChevronDown />}
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
