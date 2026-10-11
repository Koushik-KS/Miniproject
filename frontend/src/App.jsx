
import { useState } from "react";
import {
  FaLeaf, FaHome, FaMicroscope, FaSeedling, FaImages,
  FaCloudSun, FaHistory, FaUserCircle, FaBars, FaBell,
  FaArrowRight, FaCamera, FaUpload, FaShieldAlt, FaInfoCircle
} from "react-icons/fa";
import "./App.css";

const pages = [
  { name: "Home", icon: FaHome },
  { name: "Disease Detection", icon: FaMicroscope },
  { name: "Plant Identification", icon: FaLeaf },
  { name: "Multi-Image Analysis", icon: FaImages },
  { name: "Weather-Aware Crop Recommendation", icon: FaCloudSun },
  { name: "Prediction History", icon: FaHistory },
];

const crops = [
  "Rice", "Maize", "Ragi", "Jowar", "Sugarcane",
  "Red Gram", "Bengal Gram", "Groundnut", "Sunflower", "Cotton",
  "Coffee", "Arecanut", "Coconut", "Tomato", "Potato",
  "Onion", "Green Chilli", "Mango", "Banana", "Grapes"
];

const features = [
  {
    title: "Disease Detection",
    text: "Screen leaf images for supported plant diseases.",
    icon: FaMicroscope,
    color: "rose",
    page: "Disease Detection"
  },
  {
    title: "Plant Identification",
    text: "Identify supported crops from plant images.",
    icon: FaLeaf,
    color: "green",
    page: "Plant Identification"
  },
  {
    title: "Multi-Image Analysis",
    text: "Compare several uploaded leaf images.",
    icon: FaImages,
    color: "blue",
    page: "Multi-Image Analysis"
  },
  {
    title: "Weather-Aware Crop Recommendation",
    text: "Combine farm conditions with real weather data.",
    icon: FaCloudSun,
    color: "sky",
    page: "Weather-Aware Crop Recommendation"
  },
  {
    title: "Prediction History",
    text: "Review saved analyses after database setup.",
    icon: FaHistory,
    color: "green",
    page: "Prediction History"
  },
];

function App() {
  const [activePage, setActivePage] = useState("Home");
  const [showAllCrops, setShowAllCrops] = useState(false);

  const goTo = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="kv-app">
      <header className="kv-header">
        <button className="kv-brand" onClick={() => goTo("Home")}>
          <span className="kv-brand-icon"><FaSeedling /></span>
          <span>
            <strong>KisanVision AI</strong>
            <small>Smart Farming, Better Tomorrow</small>
          </span>
        </button>

        <nav className="kv-nav" aria-label="Main navigation">
          {pages.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activePage === name ? "kv-nav-link active" : "kv-nav-link"}
              onClick={() => goTo(name)}
              title={name}
            >
              <Icon />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="kv-account">
          <FaBell aria-label="Notifications" />
          <button className="kv-profile" onClick={() => goTo("Farmer Profile")}>
            <FaUserCircle />
            <span>Farmer</span>
          </button>
        </div>
      </header>

      <main className="kv-main">
        {activePage === "Home" ? (
          <>
            <section className="kv-hero">
              <div className="kv-hero-copy">
                <span className="kv-eyebrow">AGRICULTURE INTELLIGENCE PLATFORM</span>
                <p className="kv-welcome">Welcome to</p>
                <h1>KisanVision <span>AI</span></h1>
                <h2>Your Smart Farming Assistant</h2>
                <p className="kv-hero-description">
                  An AI-assisted system for plant identification, disease screening
                  and weather-aware crop recommendations.
                </p>
                <button className="kv-primary" onClick={() => goTo("Plant Identification")}>
                  Get Started <FaArrowRight />
                </button>
                <div className="kv-hero-note">
                  <FaShieldAlt /> Results will be shown only when supported by connected data and models.
                </div>
              </div>
              <div className="kv-hero-image" role="img" aria-label="Agricultural field" />
              <div className="kv-hero-tagline">
                <strong>Healthy Crops<br />Better Decisions<br />Brighter Future</strong>
                <div><FaMicroscope /> Disease screening</div>
                <div><FaSeedling /> Plant identification</div>
                <div><FaCloudSun /> Weather-aware planning</div>
              </div>
            </section>

            <div className="kv-dashboard-grid">
              <div className="kv-dashboard-main">
                <section className="kv-section">
                  <div className="kv-section-heading">
                    <div>
                      <h2>Quick Start — Explore AI Features</h2>
                      <p>Choose a workflow to get started.</p>
                    </div>
                  </div>

                  <div className="kv-quick-grid">
                    <article className="kv-quick-card camera-card">
                      <div className="kv-quick-icon"><FaCamera /></div>
                      <div>
                        <h3>Leaf Image Analysis</h3>
                        <p>Choose a leaf image for supported analysis.</p>
                        <button onClick={() => goTo("Disease Detection")}>
                          Open analysis <FaArrowRight />
                        </button>
                      </div>
                    </article>
                    <article className="kv-quick-card upload-card">
                      <div className="kv-quick-icon"><FaUpload /></div>
                      <div>
                        <h3>Identify a Plant</h3>
                        <p>Open the plant identification workflow.</p>
                        <button onClick={() => goTo("Plant Identification")}>
                          Identify plant <FaArrowRight />
                        </button>
                      </div>
                    </article>
                    <article className="kv-quick-card compare-card">
                      <div className="kv-quick-icon"><FaImages /></div>
                      <div>
                        <h3>Compare Leaf Images</h3>
                        <p>Review multiple images in one workflow.</p>
                        <button onClick={() => goTo("Multi-Image Analysis")}>
                          Compare images <FaArrowRight />
                        </button>
                      </div>
                    </article>
                  </div>
                </section>

                <section className="kv-section">
                  <div className="kv-section-heading">
                    <div>
                      <h2>Explore Project Modules</h2>
                      <p>Core features planned for KisanVision AI.</p>
                    </div>
                  </div>
                  <div className="kv-feature-grid">
                    {features.map(({ title, text, icon: Icon, color, page }) => (
                      <button
                        className={`kv-feature-card ${color}`}
                        key={title}
                        onClick={() => goTo(page)}
                      >
                        <span className="kv-feature-icon"><Icon /></span>
                        <span className="kv-feature-copy">
                          <strong>{title}</strong>
                          <small>{text}</small>
                        </span>
                        <FaArrowRight className="kv-feature-arrow" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="kv-dashboard-side">
                <section className="kv-section kv-side-panel">
                  <div className="kv-section-heading">
                    <div>
                      <h2><FaHistory /> Recent Activity</h2>
                      <p>Database connection required</p>
                    </div>
                  </div>
                  <div className="kv-empty-state">
                    <FaInfoCircle />
                    <strong>No saved activity yet</strong>
                    <p>Real analysis history will appear here after storage is implemented.</p>
                  </div>
                </section>

                <section className="kv-section kv-side-panel">
                  <div className="kv-section-heading">
                    <div>
                      <h2><FaSeedling /> Target Crops</h2>
                      <p>Initial project scope: 20 crops</p>
                    </div>
                    <button className="kv-text-button" onClick={() => setShowAllCrops(!showAllCrops)}>
                      {showAllCrops ? "Show less" : "View all"}
                    </button>
                  </div>
                  <div className="kv-crop-list">
                    {(showAllCrops ? crops : crops.slice(0, 8)).map((crop, index) => (
                      <div className="kv-crop-chip" key={crop}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {crop}
                      </div>
                    ))}
                  </div>
                  <p className="kv-crop-disclaimer">
                    Target crops only. Model support depends on dataset availability and evaluation.
                  </p>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <section className="kv-module-page">
            <div className="kv-module-heading">
              <span className="kv-module-symbol">
                {(() => {
                  const Icon = pages.find((p) => p.name === activePage)?.icon || FaUserCircle;
                  return <Icon />;
                })()}
              </span>
              <div>
                <span className="kv-eyebrow">KISANVISION AI / WORKSPACE</span>
                <h1>{activePage}</h1>
                <p>Module interface and real functionality will be implemented in this workflow.</p>
              </div>
            </div>
            <div className="kv-module-notice">
              <FaInfoCircle />
              <div>
                <strong>Not connected yet</strong>
                <p>
                  This page does not produce predictions or recommendations yet.
                  We will connect the required dataset, backend and verified data sources before enabling results.
                </p>
              </div>
            </div>
            <button className="kv-primary" onClick={() => goTo("Home")}>
              <FaHome /> Back to Home
            </button>
          </section>
        )}

        <footer className="kv-footer">
          <span>© KisanVision AI · BAI586 academic mini-project</span>
          <span>Development build · Not an official government service</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
