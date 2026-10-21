
import { useEffect, useRef, useState } from "react";
import {
  FaLeaf,
  FaImages,
  FaCloudUploadAlt,
  FaTrashAlt,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaSearch,
  FaChartBar,
  FaQuestionCircle,
  FaSeedling,
  FaHistory,
  FaFileAlt,
  FaShieldAlt,
  FaInfoCircle,
  FaChevronDown,
  FaBars,
} from "react-icons/fa";
import "./MultipleLeafAnalysis.css";

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const menuItems = [
  { label: "Analyze Multiple Leaves", icon: FaImages, target: "mla-upload" },
  { label: "Supported Crops", icon: FaSeedling, target: "mla-crops" },
  { label: "Result Summary", icon: FaChartBar, target: "mla-summary" },
  { label: "Download Report", icon: FaDownload, target: "mla-results" },
  { label: "Upload History", icon: FaHistory, target: "mla-history" },
  { label: "FAQs", icon: FaQuestionCircle, target: "mla-faqs" },
];

const supportedCrops = [
  "Rice", "Maize", "Ragi", "Jowar", "Sugarcane",
  "Red Gram", "Bengal Gram", "Groundnut", "Sunflower",
  "Cotton", "Coffee", "Arecanut", "Coconut", "Tomato",
  "Potato", "Onion", "Green Chilli", "Mango", "Banana", "Grapes",
];

const faqs = [
  {
    question: "How many images can I upload?",
    answer: "You can select up to 20 images, with a maximum size of 5 MB per image.",
  },
  {
    question: "Which image formats are supported?",
    answer: "The upload interface accepts JPG, PNG and WebP images.",
  },
  {
    question: "Will this page identify crop diseases now?",
    answer: "Not yet. A trained and tested machine-learning model must be connected before crop and disease predictions can be displayed.",
  },
  {
    question: "Are my selected images saved permanently?",
    answer: "Currently, the images are held in this browser session. Permanent upload history requires storage or backend integration.",
  },
];

function MultipleLeafAnalysis() {
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [threshold, setThreshold] = useState("50");
  const [diseasedOnly, setDiseasedOnly] = useState(false);
  const [groupByCrop, setGroupByCrop] = useState(true);
  const [activeSection, setActiveSection] = useState("mla-upload");
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const inputRef = useRef(null);
  const idRef = useRef(0);
  const imagesRef = useRef([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const addImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setError("");
    setNotice("");

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: unsupported file type.`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: file exceeds 5 MB.`);
      } else {
        accepted.push(file);
      }
    });

    setImages((current) => {
      const remaining = MAX_IMAGES - current.length;
      const filesToAdd = accepted.slice(0, Math.max(0, remaining));

      if (accepted.length > remaining) {
        rejected.push(`Only ${MAX_IMAGES} images can be selected.`);
      }

      const newImages = filesToAdd.map((file) => ({
        id: ++idRef.current,
        file,
        preview: URL.createObjectURL(file),
      }));

      if (newImages.length) {
        setNotice(`${newImages.length} image(s) added. No AI analysis has been performed.`);
      }

      if (rejected.length) setError(rejected.join(" "));

      return [...current, ...newImages];
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (id) => {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return current.filter((item) => item.id !== id);
    });
    setError("");
    setNotice("Selected image removed.");
  };

  const clearAll = () => {
    images.forEach((image) => URL.revokeObjectURL(image.preview));
    setImages([]);
    setError("");
    setNotice("All selected images cleared.");
    if (inputRef.current) inputRef.current.value = "";
  };

  const goToSection = (target) => {
    setActiveSection(target);
    setMobileSidebarOpen(false);

    if (target === "mla-results" && images.length === 0) {
      setNotice("Upload images before preparing your upload report.");
    }

    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const downloadReport = () => {
    if (!images.length) {
      setError("Upload at least one image before downloading the upload report.");
      return;
    }

    const escapeCsv = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = [
      ["Image filename", "File size (bytes)", "Analysis status"],
      ...images.map((image) => [
        image.file.name,
        image.file.size,
        "Pending - AI model not connected",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "kisanvision-multi-image-upload-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setNotice("Upload report downloaded. It contains file details, not AI predictions.");
    setError("");
  };

  const totalBytes = images.reduce((sum, image) => sum + image.file.size, 0);

  return (
    <div className="mla-page">
      <aside className={`mla-left-sidebar ${mobileSidebarOpen ? "mla-sidebar-open" : ""}`}>
        <div className="mla-sidebar-title">
          <FaSeedling />
          <strong>Multi-Image Analysis</strong>
        </div>

        <nav className="mla-side-nav" aria-label="Multi-image analysis sections">
          {menuItems.map(({ label, icon: Icon, target }) => (
            <button
              type="button"
              key={target}
              className={activeSection === target ? "mla-side-link active" : "mla-side-link"}
              onClick={() => {
                if (target === "mla-history") {
                  goToSection("mla-history");
                } else {
                  goToSection(target);
                }
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mla-sidebar-landscape">
          <div className="mla-landscape-copy">
            <strong>
              Analyse More
              <br />
              Get Clear Insights
              <br />
              Healthier Crops
              <br />
              Better Yields
            </strong>
          </div>
        </div>
      </aside>

      <div className="mla-workspace">
        <header className="mla-page-heading">
          <button
            type="button"
            className="mla-mobile-sidebar-toggle"
            onClick={() => setMobileSidebarOpen((open) => !open)}
            aria-label="Toggle analysis menu"
          >
            <FaBars />
          </button>

          <div className="mla-heading-icon">
            <FaImages />
          </div>

          <div className="mla-heading-copy">
            <h1>Multi-Image Analysis</h1>
            <p>
              Upload multiple leaf images to prepare disease, crop-type and health analysis.
            </p>
          </div>

          <div className="mla-breadcrumb">Home&nbsp; › &nbsp;Multi-Image Analysis</div>
        </header>

        {error && (
          <div className="mla-alert mla-alert-error" role="alert">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <FaTimes />
            </button>
          </div>
        )}

        {notice && (
          <div className="mla-alert mla-alert-info" role="status">
            <FaInfoCircle />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
              <FaTimes />
            </button>
          </div>
        )}

        <section className="mla-top-grid" id="mla-upload">
          <div className="mla-panel mla-upload-panel">
            <div
              className="mla-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addImages(event.dataTransfer.files);
              }}
            >
              <FaCloudUploadAlt className="mla-cloud-icon" />
              <strong>Drag &amp; drop multiple leaf images here</strong>
              <span>or</span>

              <button
                type="button"
                className="mla-primary-button"
                onClick={() => inputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <FaFileAlt /> Choose Files
              </button>

              <input
                ref={inputRef}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => addImages(event.target.files)}
              />

              <small>
                Supports: JPG, PNG, JPEG, WebP
                <br />
                (Max 20 images, each up to 5 MB)
              </small>
            </div>
          </div>

          <div className="mla-panel mla-uploaded-panel">
            <div className="mla-panel-heading">
              <h2><FaImages /> Uploaded Images ({images.length})</h2>
              <button
                type="button"
                className="mla-clear-button"
                onClick={clearAll}
                disabled={!images.length}
              >
                Clear All
              </button>
            </div>

            {images.length ? (
              <div className="mla-thumbnail-grid">
                {images.map((image, index) => (
                  <article className="mla-thumbnail" key={image.id}>
                    <div className="mla-thumbnail-image">
                      <img src={image.preview} alt={`Uploaded leaf ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        aria-label={`Remove ${image.file.name}`}
                        title="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <span title={image.file.name}>{image.file.name}</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mla-mini-empty">
                <FaImages />
                <span>Your uploaded images will appear here.</span>
              </div>
            )}
          </div>

          <div className="mla-panel mla-settings-panel">
            <h2><FaSeedling /> Analysis Settings <span>(Optional)</span></h2>

            <label className="mla-setting-row" htmlFor="mla-threshold">
              <span>Confidence Threshold</span>
              <span className="mla-select-wrap">
                <select
                  id="mla-threshold"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                >
                  <option value="default">Default (50%)</option>
                  <option value="30">30%</option>
                  <option value="50">50%</option>
                  <option value="70">70%</option>
                  <option value="90">90%</option>
                </select>
                <FaChevronDown />
              </span>
            </label>

            <div className="mla-setting-row">
              <span>Show Only Diseased Leaves</span>
              <button
                type="button"
                className={`mla-switch ${diseasedOnly ? "on" : ""}`}
                role="switch"
                aria-checked={diseasedOnly}
                onClick={() => setDiseasedOnly((value) => !value)}
                aria-label="Show only diseased leaves"
              >
                <span />
              </button>
            </div>

            <div className="mla-setting-row">
              <span>Group by Crop</span>
              <button
                type="button"
                className={`mla-switch ${groupByCrop ? "on" : ""}`}
                role="switch"
                aria-checked={groupByCrop}
                onClick={() => setGroupByCrop((value) => !value)}
                aria-label="Group by crop"
              >
                <span />
              </button>
            </div>

            <button
              type="button"
              className="mla-start-button"
              disabled={!images.length}
              onClick={() => {
                setNotice(
                  "Images are ready for review. Actual analysis is unavailable until the trained model is connected."
                );
                document.getElementById("mla-results")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                setActiveSection("mla-results");
              }}
            >
              <FaSearch /> Start Analysis
            </button>

            <p className="mla-settings-note">
              Settings are saved in this page. Model-based filtering will work after AI integration.
            </p>
          </div>
        </section>

        <section className="mla-results-grid">
          <div className="mla-results-column">
            <section className="mla-panel mla-results-panel" id="mla-results">
              <div className="mla-panel-heading mla-results-heading">
                <h2><FaShieldAlt /> Analysis Results <span>({images.length} images)</span></h2>
                <button
                  type="button"
                  className="mla-report-button"
                  onClick={downloadReport}
                  disabled={!images.length}
                >
                  <FaDownload /> Download Report
                </button>
              </div>

              <div className="mla-table-scroll">
                <table className="mla-results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Image</th>
                      <th>Crop Identified</th>
                      <th>Disease / Health Status</th>
                      <th>Confidence</th>
                      <th>Severity</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {images.length ? images.map((image, index) => (
                      <tr key={image.id}>
                        <td>{index + 1}</td>
                        <td>
                          <img
                            className="mla-table-thumb"
                            src={image.preview}
                            alt={`Uploaded leaf ${index + 1}`}
                          />
                        </td>
                        <td>
                          <span className="mla-pending-label">Pending</span>
                          <small>Not identified</small>
                        </td>
                        <td>
                          <span className="mla-pending-badge">Awaiting model</span>
                        </td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                          <button
                            type="button"
                            className="mla-view-button"
                            onClick={() => {
                              setNotice(
                                `Image: ${image.file.name}. Crop and disease predictions are not available yet.`
                              );
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="mla-table-empty">
                          <FaImages />
                          <strong>No images to display</strong>
                          <span>Upload leaf images to populate the review table.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mla-model-notice">
                <FaInfoCircle />
                These are uploaded-image records only. No crop, disease, confidence or severity prediction has been generated.
              </div>
            </section>

            <section className="mla-panel mla-next-steps">
              <h2><FaCheckCircle /> Next Steps</h2>
              <div className="mla-next-grid">
                <div><FaLeaf /><span>Review uploaded leaf photographs.</span></div>
                <div><FaShieldAlt /><span>Connect and evaluate the trained model.</span></div>
                <div><FaFileAlt /><span>Generate reports from verified results.</span></div>
                <div><FaSearch /><span>Use expert guidance for crop treatment decisions.</span></div>
              </div>
            </section>
          </div>

          <aside className="mla-summary-column">
            <section className="mla-panel mla-summary-panel" id="mla-summary">
              <h2><FaChartBar /> Summary</h2>

              <div className="mla-summary-stats">
                <div><FaImages /><span>Total Images</span><strong>{images.length}</strong></div>
                <div><FaLeaf /><span>Healthy Leaves</span><strong>—</strong></div>
                <div><FaExclamationTriangle /><span>Diseased Leaves</span><strong>—</strong></div>
              </div>

              <p className="mla-summary-note">
                Healthy and diseased counts will be available after real predictions exist.
              </p>

              <div className="mla-crop-summary" id="mla-crops">
                <h3>Crop-wise Breakdown</h3>
                {supportedCrops.slice(10, 15).map((crop) => (
                  <div className="mla-crop-row" key={crop}>
                    <span>{crop}</span>
                    <span className="mla-no-data">No results</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="mla-show-crops"
                  onClick={() => goToSection("mla-crops")}
                >
                  Supported crop list <FaChevronDown />
                </button>
                <p className="mla-supported-note">
                  The project targets 20 crops. Actual model support must be validated.
                </p>
              </div>
            </section>

            <section className="mla-panel mla-insights-panel">
              <h2><FaChartBar /> Key Insights</h2>
              <div className="mla-insight-item">
                <FaInfoCircle />
                <p>
                  {images.length
                    ? `${images.length} image(s) uploaded and awaiting analysis.`
                    : "Upload leaf images to begin preparing a session."}
                </p>
              </div>
              <div className="mla-insight-item">
                <FaShieldAlt />
                <p>No disease conclusions are available until the model is connected.</p>
              </div>
              <div className="mla-insight-item">
                <FaCloudUploadAlt />
                <p>
                  Current file size: {(totalBytes / (1024 * 1024)).toFixed(2)} MB.
                </p>
              </div>
              <p className="mla-insights-footnote">
                {diseasedOnly ? "Diseased-only filter selected." : "All uploaded images are included in the review list."}
                {" "}
                {groupByCrop ? "Crop grouping is enabled for future results." : "Crop grouping is disabled."}
                {" "}
                Confidence threshold: {threshold === "default" ? "Default (50%)" : `${threshold}%`}.
              </p>
            </section>
          </aside>
        </section>

        <section className="mla-panel mla-history-panel" id="mla-history">
          <h2><FaHistory /> Upload History</h2>
          <p>
            Previous sessions are not stored permanently yet. The images listed above belong to the current page session.
          </p>
        </section>

        <section className="mla-panel mla-faq-panel" id="mla-faqs">
          <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div className="mla-faq-item" key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                aria-expanded={openFaq === index}
              >
                {faq.question}
                <FaChevronDown className={openFaq === index ? "rotated" : ""} />
              </button>
              {openFaq === index && <p>{faq.answer}</p>}
            </div>
          ))}
        </section>

        <footer className="mla-footer">
          KisanVision AI · BAI586 academic mini-project
          <span>Development build · AI predictions are not yet connected</span>
        </footer>
      </div>
    </div>
  );
}

export default MultipleLeafAnalysis;
