
import { useState } from "react";
import {
  FaLeaf,
  FaHome,
  FaMicroscope,
  FaSeedling,
  FaImages,
  FaCloudSun,
  FaHistory,
  FaUserCircle,
  FaArrowRight,
  FaCamera,
  FaUpload,
  FaShieldAlt,
  FaInfoCircle,
  FaTimes,
  FaBars,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import DiseaseDetectionPage from "./DiseaseDetection";
import PlantIdentificationPage from "./PlantIdentification";
import MultipleLeafAnalysis from "./MultipleLeafAnalysis";
import WeatherRecommendation from "./WeatherRecommendation";
import PredictionHistory from "./PredictionHistory";
import FarmerProfile from "./FarmerProfile";
import "./App.css";

const pages = [
  { name: "Home", icon: FaHome },
  { name: "Disease Detection", icon: FaMicroscope },
  { name: "Plant Identification", icon: FaLeaf },
  { name: "Multi-Image Analysis", icon: FaImages },
  {
    name: "Weather-Aware Crop Recommendation",
    icon: FaCloudSun,
  },
  { name: "Prediction History", icon: FaHistory },
];

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

const features = [
  {
    title: "Disease Detection",
    text: "Screen leaf images for supported plant diseases.",
    icon: FaMicroscope,
    color: "rose",
    page: "Disease Detection",
  },
  {
    title: "Plant Identification",
    text: "Identify supported crops from plant images.",
    icon: FaLeaf,
    color: "green",
    page: "Plant Identification",
  },
  {
    title: "Multi-Image Analysis",
    text: "Review several leaf images in one workflow.",
    icon: FaImages,
    color: "blue",
    page: "Multi-Image Analysis",
  },
  {
    title: "Weather-Aware Crop Recommendation",
    text: "Use weather data to support crop planning.",
    icon: FaCloudSun,
    color: "sky",
    page: "Weather-Aware Crop Recommendation",
  },
  {
    title: "Prediction History",
    text: "Review saved analyses after storage is implemented.",
    icon: FaHistory,
    color: "green",
    page: "Prediction History",
  },
];

function App() {
  const [activePage, setActivePage] = useState("Home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("Coffee");

  const goTo = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ActivePageIcon =
    pages.find((page) => page.name === activePage)?.icon ||
    FaUserCircle;

  const selectedCropDetails = crops.find(
    (crop) => crop.name === selectedCrop
  );

  return (
    <div className="kv-app">
      {/* HEADER */}
      <header className="kv-header">
        <button
          type="button"
          className="kv-brand"
          onClick={() => goTo("Home")}
          aria-label="KisanVision AI home"
        >
          <span className="kv-brand-icon">
            <FaSeedling />
          </span>

          <span>
            <strong>KisanVision AI</strong>
            <small>Smart Farming, Better Tomorrow</small>
          </span>
        </button>

        <button
          type="button"
          className="kv-mobile-menu"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav
          className={`kv-nav ${mobileNavOpen ? "kv-nav-open" : ""}`}
          aria-label="Main navigation"
        >
          {pages.map(({ name, icon: Icon }) => (
            <button
              type="button"
              key={name}
              className={
                activePage === name
                  ? "kv-nav-link active"
                  : "kv-nav-link"
              }
              onClick={() => goTo(name)}
              title={name}
              aria-current={
                activePage === name ? "page" : undefined
              }
            >
              <Icon />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="kv-account">
          <button
            type="button"
            className="kv-profile"
            onClick={() => goTo("Farmer Profile")}
          >
            <FaUserCircle />
            <span>Farmer</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="kv-main">
        {activePage === "Home" ? (
          <>
            {/* HERO SECTION */}
            <section className="kv-hero">
              <div className="kv-hero-copy">
                <span className="kv-eyebrow">
                  AGRICULTURE INTELLIGENCE PLATFORM
                </span>

                <p className="kv-welcome">Welcome to</p>

                <h1>
                  KisanVision <span>AI</span>
                </h1>

                <h2>Your Smart Farming Assistant</h2>

                <p className="kv-hero-description">
                  An AI-assisted system for plant identification,
                  disease screening and weather-aware crop
                  recommendations.
                </p>

                <button
                  type="button"
                  className="kv-primary"
                  onClick={() => goTo("Disease Detection")}
                >
                  Get Started <FaArrowRight />
                </button>

                <div className="kv-hero-note">
                  <FaShieldAlt />
                  Results will be shown only when supported by
                  connected data and models.
                </div>
              </div>

              <div
                className="kv-hero-image"
                role="img"
                aria-label="Agricultural field"
              />

              <div className="kv-hero-tagline">
                <strong>
                  Healthy Crops
                  <br />
                  Better Decisions
                  <br />
                  Brighter Future
                </strong>

                <div>
                  <FaMicroscope /> Disease screening
                </div>

                <div>
                  <FaSeedling /> Plant identification
                </div>

                <div>
                  <FaCloudSun /> Weather-aware planning
                </div>
              </div>
            </section>

            {/* SUPPORTED CROPS SECTION ON HOME */}
            <section
              className="kv-section kv-supported-section"
              aria-labelledby="kv-supported-heading"
            >
              <div className="kv-section-heading kv-supported-heading">
                <div>
                  <span className="kv-eyebrow">
                    KISANVISION AI / PLANT HEALTH
                  </span>

                  <h2 id="kv-supported-heading">
                    <FaSeedling /> Supported Crops (5)
                  </h2>

                  <p>
                    Explore supported crops and their model
                    integration status.
                  </p>
                </div>

                <span className="kv-crop-count">
                  {crops.length} crops
                </span>
              </div>

              {/* FIVE ORIGINAL CROP IMAGES */}
              <div className="kv-supported-grid">
                {crops.map((crop) => (
                  <button
                    type="button"
                    key={crop.name}
                    className={[
                      "kv-supported-card",
                      crop.supported
                        ? "model-connected"
                        : "model-pending",
                      selectedCrop === crop.name
                        ? "crop-selected"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedCrop(crop.name)}
                    aria-pressed={selectedCrop === crop.name}
                  >
                    <div className="kv-supported-image-wrap">
                      <img
                        className="kv-supported-image"
                        src={crop.image}
                        alt={`${crop.name} plant`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <span className="kv-supported-name">
                      {crop.name}
                    </span>

                    <span className="kv-supported-scientific">
                      {crop.scientific}
                    </span>

                    <span
                      className={`kv-model-status ${
                        crop.supported
                          ? "status-connected"
                          : "status-pending"
                      }`}
                    >
                      {crop.supported ? (
                        <FaCheckCircle />
                      ) : (
                        <FaClock />
                      )}

                      {crop.supported
                        ? "Model connected"
                        : "Model pending"}
                    </span>
                  </button>
                ))}
              </div>

              {/* SELECTED CROP STATUS */}
              {selectedCropDetails && (
                <div
                  className="kv-selected-crop-info"
                  aria-live="polite"
                >
                  <div className="kv-selected-crop-icon">
                    {selectedCropDetails.supported ? (
                      <FaCheckCircle />
                    ) : (
                      <FaInfoCircle />
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedCropDetails.name} —{" "}
                      {selectedCropDetails.supported
                        ? "Model connected"
                        : "Model pending"}
                    </strong>

                    <p>
                      {selectedCropDetails.supported
                        ? "Coffee disease classification is configured as connected. Prediction quality must still be evaluated."
                        : `A separately trained and tested ${selectedCropDetails.name} model is required before disease predictions can be provided.`}
                    </p>
                  </div>

                  {selectedCropDetails.supported && (
                    <button
                      type="button"
                      className="kv-crop-action"
                      onClick={() => goTo("Disease Detection")}
                    >
                      Open Disease Detection <FaArrowRight />
                    </button>
                  )}
                </div>
              )}

              <p className="kv-supported-disclaimer">
                <FaShieldAlt />
                Predictions are experimental. Pending crops require
                their own trained and tested models.
              </p>
            </section>

            {/* DASHBOARD GRID */}
            <div className="kv-dashboard-grid">
              <div className="kv-dashboard-main">
                {/* QUICK START */}
                <section className="kv-section">
                  <div className="kv-section-heading">
                    <div>
                      <h2>Quick Start — Explore AI Features</h2>
                      <p>Choose a workflow to get started.</p>
                    </div>
                  </div>

                  <div className="kv-quick-grid">
                    <article className="kv-quick-card camera-card">
                      <div className="kv-quick-icon">
                        <FaCamera />
                      </div>

                      <div>
                        <h3>Leaf Image Analysis</h3>
                        <p>
                          Capture or upload a leaf image for analysis.
                        </p>

                        <button
                          type="button"
                          onClick={() => goTo("Disease Detection")}
                        >
                          Open analysis <FaArrowRight />
                        </button>
                      </div>
                    </article>

                    <article className="kv-quick-card upload-card">
                      <div className="kv-quick-icon">
                        <FaUpload />
                      </div>

                      <div>
                        <h3>Identify a Plant</h3>
                        <p>
                          Open the plant identification workflow.
                        </p>

                        <button
                          type="button"
                          onClick={() => goTo("Plant Identification")}
                        >
                          Identify plant <FaArrowRight />
                        </button>
                      </div>
                    </article>

                    <article className="kv-quick-card compare-card">
                      <div className="kv-quick-icon">
                        <FaImages />
                      </div>

                      <div>
                        <h3>Compare Leaf Images</h3>
                        <p>
                          Review multiple images in one workflow.
                        </p>

                        <button
                          type="button"
                          onClick={() => goTo("Multi-Image Analysis")}
                        >
                          Compare images <FaArrowRight />
                        </button>
                      </div>
                    </article>
                  </div>
                </section>

                {/* PROJECT MODULES */}
                <section className="kv-section">
                  <div className="kv-section-heading">
                    <div>
                      <h2>Explore Project Modules</h2>
                      <p>
                        Core features planned for KisanVision AI.
                      </p>
                    </div>
                  </div>

                  <div className="kv-feature-grid">
                    {features.map(
                      ({
                        title,
                        text,
                        icon: Icon,
                        color,
                        page,
                      }) => (
                        <button
                          type="button"
                          className={`kv-feature-card ${color}`}
                          key={title}
                          onClick={() => goTo(page)}
                        >
                          <span className="kv-feature-icon">
                            <Icon />
                          </span>

                          <span className="kv-feature-copy">
                            <strong>{title}</strong>
                            <small>{text}</small>
                          </span>

                          <FaArrowRight className="kv-feature-arrow" />
                        </button>
                      )
                    )}
                  </div>
                </section>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="kv-dashboard-side">
                <section className="kv-section kv-side-panel">
                  <div className="kv-section-heading">
                    <div>
                      <h2>
                        <FaHistory /> Recent Activity
                      </h2>

                      <p>Database connection required</p>
                    </div>
                  </div>

                  <div className="kv-empty-state">
                    <FaInfoCircle />
                    <strong>No saved activity yet</strong>

                    <p>
                      Real analysis history will appear here after
                      storage is implemented.
                    </p>
                  </div>
                </section>

                <section className="kv-section kv-side-panel">
                  <div className="kv-section-heading">
                    <div>
                      <h2>
                        <FaSeedling /> Target Crops
                      </h2>

                      <p>Current dataset scope: 5 crops</p>
                    </div>
                  </div>

                  <div className="kv-crop-list">
                    {crops.map((crop, index) => (
                      <button
                        type="button"
                        className="kv-crop-chip"
                        key={crop.name}
                        onClick={() => {
                          setSelectedCrop(crop.name);
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                      >
                        <span>
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        {crop.name}
                      </button>
                    ))}
                  </div>

                  <p className="kv-crop-disclaimer">
                    Model availability depends on training,
                    evaluation and integration.
                  </p>
                </section>
              </aside>
            </div>
          </>
        ) : activePage === "Disease Detection" ? (
          <DiseaseDetectionPage />
        ) : activePage === "Plant Identification" ? (
          <PlantIdentificationPage />
        ) : activePage === "Multi-Image Analysis" ? (
          <MultipleLeafAnalysis />
        ) : activePage === "Weather-Aware Crop Recommendation" ? (
          <WeatherRecommendation />
        ) : activePage === "Prediction History" ? (
          <PredictionHistory />
        ) : activePage === "Farmer Profile" ? (
          <FarmerProfile />
        ) : (
          <section className="kv-module-page">
            <div className="kv-module-heading">
              <span className="kv-module-symbol">
                <ActivePageIcon />
              </span>

              <div>
                <span className="kv-eyebrow">
                  KISANVISION AI / WORKSPACE
                </span>

                <h1>{activePage}</h1>

                <p>
                  This module is awaiting its implementation and
                  data integration.
                </p>
              </div>
            </div>

            <div className="kv-module-notice">
              <FaInfoCircle />

              <div>
                <strong>Not connected yet</strong>

                <p>
                  This page does not produce predictions or
                  recommendations yet. The required model, backend
                  and verified data sources must be connected
                  before results can be displayed.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="kv-primary"
              onClick={() => goTo("Home")}
            >
              <FaHome /> Back to Home
            </button>
          </section>
        )}

        {/* FOOTER */}
        <footer className="kv-footer">
          <span>
            © KisanVision AI · BAI586 academic mini-project
          </span>

          <span>
            Development build · Not an official government service
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
