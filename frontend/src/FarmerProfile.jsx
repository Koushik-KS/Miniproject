
import { useState } from "react";
import {
  FaUserCircle,
  FaSeedling,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaChartBar,
  FaMicroscope,
  FaCloudSun,
  FaLeaf,
  FaHistory,
  FaBell,
  FaLock,
  FaQuestionCircle,
  FaSignOutAlt,
  FaHome,
  FaTractor,
  FaTint,
  FaMountain,
  FaRulerCombined,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCamera,
  FaInfoCircle,
  FaGlobe,
  FaChevronRight,
  FaClipboardList,
} from "react-icons/fa";
import "./FarmerProfile.css";

const cropOptions = [
  "Coffee", "Arecanut", "Black Pepper", "Rice", "Maize",
  "Ragi", "Jowar", "Sugarcane", "Red Gram", "Bengal Gram",
  "Groundnut", "Sunflower", "Cotton", "Coconut", "Tomato",
  "Potato", "Onion", "Green Chilli", "Mango", "Banana",
  "Grapes", "Shunti", "Elakki",
];

const initialProfile = {
  name: "",
  phone: "",
  email: "",
  location: "",
  memberSince: "",
  farmName: "",
  farmArea: "",
  landType: "",
  soilType: "",
  waterSource: "",
  farmingType: "",
  primaryCrops: [],
  interestedCrops: [],
  language: "English",
  emailNotifications: true,
  smsNotifications: false,
  weatherAlerts: true,
  recommendations: true,
};

const tabs = [
  { label: "Farm Details", icon: FaHome },
  { label: "Crops & Preferences", icon: FaLeaf },
  { label: "Saved Recommendations", icon: FaSeedling },
  { label: "Analysis History", icon: FaHistory },
  { label: "Account Settings", icon: FaLock },
];

function FarmerProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState("Farm Details");
  const [activeSidebar, setActiveSidebar] = useState("Farmer Profile");
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const startEditing = () => {
    setDraft({
      ...profile,
      primaryCrops: [...profile.primaryCrops],
      interestedCrops: [...profile.interestedCrops],
    });
    setEditing(true);
    setNotice("");
  };

  // Open crop selection without leaving the profile modal open.
  const openCropPreferences = () => {
    setDraft({
      ...profile,
      primaryCrops: [...profile.primaryCrops],
      interestedCrops: [...profile.interestedCrops],
    });
    setEditing(false);
    setActiveTab("Crops & Preferences");
    setActiveSidebar("Farmer Profile");
    setNotice("");
  };

  const saveProfile = (event) => {
    event.preventDefault();

    if (draft.phone && !/^[+\d\s()-]{7,20}$/.test(draft.phone)) {
      setNotice("Please enter a valid phone number.");
      return;
    }

    if (
      draft.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
    ) {
      setNotice("Please enter a valid email address.");
      return;
    }

    setProfile({
      ...draft,
      primaryCrops: [...draft.primaryCrops],
      interestedCrops: [...draft.interestedCrops],
    });
    setEditing(false);
    setNotice("Profile updated for this session. Permanent saving requires a backend.");
  };

  const toggleCrop = (field, crop) => {
    setDraft((current) => {
      const selected = current[field] || [];
      const updated = selected.includes(crop)
        ? selected.filter((item) => item !== crop)
        : [...selected, crop];

      return { ...current, [field]: updated };
    });
  };

  const saveCropPreferences = () => {
    setProfile((current) => ({
      ...current,
      primaryCrops: [...draft.primaryCrops],
      interestedCrops: [...draft.interestedCrops],
    }));
    setEditing(false);
    setActiveTab("Farm Details");
    setNotice("Crop preferences updated for this session.");
  };

  const selectSidebar = (label) => {
    setActiveSidebar(label);
    setNotice("");

    const tabMap = {
      "Farmer Profile": "Farm Details",
      "My Farm Details": "Farm Details",
      "My Analyses": "Analysis History",
      "Saved Recommendations": "Saved Recommendations",
      "Notification Settings": "Account Settings",
      "Change Password": "Account Settings",
    };

    if (tabMap[label]) {
      setActiveTab(tabMap[label]);
    } else if (label === "Help & Support") {
      setNotice("Help and support will be available when connected.");
    }
  };

  const handlePasswordChange = (event) => {
    event.preventDefault();

    if (!password.current || !password.next || !password.confirm) {
      setNotice("Please fill in all password fields.");
      return;
    }

    if (password.next.length < 8) {
      setNotice("Your new password must have at least 8 characters.");
      return;
    }

    if (password.next !== password.confirm) {
      setNotice("The new password and confirmation do not match.");
      return;
    }

    setNotice("Password changes require backend authentication.");
  };

  const sidebarItems = [
    { label: "Farmer Profile", icon: FaUserCircle },
    { label: "My Farm Details", icon: FaTractor },
    { label: "My Analyses", icon: FaMicroscope },
    { label: "Saved Recommendations", icon: FaSeedling },
    { label: "Notification Settings", icon: FaBell },
    { label: "Change Password", icon: FaLock },
    { label: "Help & Support", icon: FaQuestionCircle },
  ];

  const farmRows = [
    ["Farm Name", profile.farmName, FaHome],
    ["Location", profile.location, FaMapMarkerAlt],
    ["Farm Area", profile.farmArea ? `${profile.farmArea} acres` : "", FaRulerCombined],
    ["Land Type", profile.landType, FaMountain],
    ["Soil Type", profile.soilType, FaSeedling],
    ["Water Source", profile.waterSource, FaTint],
    ["Farming Type", profile.farmingType, FaTractor],
  ];

  return (
    <div className="fp-page">
      <aside className="fp-sidebar">
        <div className="fp-sidebar-heading">
          <FaUserCircle />
          <div>
            <h2>Farmer Profile</h2>
            <p>Manage your farming account</p>
          </div>
        </div>

        <nav className="fp-sidebar-nav" aria-label="Farmer profile navigation">
          {sidebarItems.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={activeSidebar === label ? "fp-side-link active" : "fp-side-link"}
              onClick={() => selectSidebar(label)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            className="fp-side-link"
            onClick={() => setNotice("Sign-out requires authentication to be connected.")}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>

        <div className="fp-sidebar-banner">
          <FaSeedling />
          <h3>Healthy Farms</h3>
          <p>Smarter decisions for sustainable farming.</p>
        </div>
      </aside>

      <main className="fp-content">
        <header className="fp-page-heading">
          <div className="fp-heading-symbol"><FaSeedling /></div>
          <div className="fp-heading-copy">
            <span className="fp-eyebrow">KISANVISION AI / ACCOUNT</span>
            <h1>Farmer Profile</h1>
            <p>Manage your profile, farm details and preferences.</p>
          </div>
          <button type="button" className="fp-primary-button" onClick={startEditing}>
            <FaEdit /> Edit Profile
          </button>
        </header>

        {notice && (
          <div className="fp-notice" role="status">
            <FaInfoCircle />
            <span>{notice}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>
              <FaTimes />
            </button>
          </div>
        )}

        <section className="fp-overview">
          <div className="fp-identity">
            <div className="fp-avatar">
              {photo ? <img src={photo} alt="Farmer profile" /> : <FaUserCircle />}
              <label className="fp-camera-button" title="Upload profile photo">
                <FaCamera />
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload profile photo"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                      setNotice("Please choose an image file.");
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setNotice("Choose an image smaller than 5 MB.");
                      return;
                    }

                    setPhoto(URL.createObjectURL(file));
                    setNotice("Photo preview updated for this session only.");
                  }}
                />
              </label>
            </div>

            <div className="fp-identity-info">
              <h2>{profile.name || "Your Name"}</h2>
              <span className="fp-status"><FaCheck /> Profile</span>
              <p><FaPhone /><span>{profile.phone || "Add phone number"}</span></p>
              <p><FaEnvelope /><span>{profile.email || "Add email address"}</span></p>
              <p><FaMapMarkerAlt /><span>{profile.location || "Add your location"}</span></p>
              <p>
                <FaCalendarAlt />
                <span>{profile.memberSince ? `Member since ${profile.memberSince}` : "Membership date unavailable"}</span>
              </p>
            </div>
          </div>

          <div className="fp-stats">
            <h2><FaChartBar /> Quick Stats</h2>
            <div className="fp-stat-grid">
              <article className="fp-stat-card">
                <FaLeaf className="fp-stat-green" />
                <span>Total Analyses</span>
                <strong>—</strong>
                <small>Awaiting saved records</small>
              </article>
              <article className="fp-stat-card">
                <FaMicroscope className="fp-stat-red" />
                <span>Disease Cases</span>
                <strong>—</strong>
                <small>Awaiting saved results</small>
              </article>
              <article className="fp-stat-card">
                <FaSeedling className="fp-stat-green" />
                <span>Healthy Cases</span>
                <strong>—</strong>
                <small>Awaiting saved results</small>
              </article>
              <article className="fp-stat-card">
                <FaCloudSun className="fp-stat-blue" />
                <span>Weather Checks</span>
                <strong>—</strong>
                <small>Awaiting saved records</small>
              </article>
            </div>
          </div>
        </section>

        <nav className="fp-tabs" aria-label="Profile sections">
          {tabs.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={activeTab === label ? "active" : ""}
              onClick={() => {
                setActiveTab(label);
                setNotice("");
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {activeTab === "Farm Details" && (
          <div className="fp-content-grid">
            <section className="fp-panel">
              <div className="fp-panel-heading">
                <h2><FaTractor /> Farm Information</h2>
                <button type="button" onClick={startEditing}><FaEdit /> Edit</button>
              </div>

              <div className="fp-info-table">
                {farmRows.map(([label, value, Icon]) => (
                  <div className="fp-info-row" key={label}>
                    <Icon />
                    <span>{label}</span>
                    <strong>{value || "Not provided"}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="fp-panel">
              <div className="fp-panel-heading">
                <h2><FaLeaf /> My Crop Preferences</h2>
                <button type="button" onClick={openCropPreferences}><FaEdit /> Edit</button>
              </div>

              {profile.primaryCrops.length > 0 ? (
                <div className="fp-crop-grid">
                  {profile.primaryCrops.map((crop) => (
                    <div className="fp-crop-card" key={crop}>
                      <span className="fp-crop-icon"><FaSeedling /></span>
                      <strong>{crop}</strong>
                      <small>Selected crop</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fp-empty-inline">
                  <FaSeedling />
                  <strong>No crops selected yet</strong>
                  <p>Add the crops you grow to personalize your profile.</p>
                  <button type="button" onClick={openCropPreferences}>
                    Choose crops
                  </button>
                </div>
              )}
            </section>

            <section className="fp-panel">
              <div className="fp-panel-heading">
                <h2><FaHistory /> Recent Activity</h2>
                <button type="button" onClick={() => setActiveTab("Analysis History")}>
                  View All <FaChevronRight />
                </button>
              </div>
              <div className="fp-empty-inline">
                <FaClipboardList />
                <strong>No activity available</strong>
                <p>Recent analyses will appear after real records are connected.</p>
              </div>
            </section>

            <section className="fp-panel">
              <div className="fp-panel-heading">
                <h2><FaGlobe /> Preferences</h2>
                <button type="button" onClick={() => setActiveTab("Account Settings")}>
                  <FaEdit /> Edit
                </button>
              </div>
              <div className="fp-info-table">
                <div className="fp-info-row"><FaGlobe /><span>Language</span><strong>{profile.language}</strong></div>
                <div className="fp-info-row"><FaEnvelope /><span>Email Notifications</span><strong>{profile.emailNotifications ? "Enabled" : "Disabled"}</strong></div>
                <div className="fp-info-row"><FaPhone /><span>SMS Notifications</span><strong>{profile.smsNotifications ? "Enabled" : "Disabled"}</strong></div>
                <div className="fp-info-row"><FaCloudSun /><span>Weather Alerts</span><strong>{profile.weatherAlerts ? "Enabled" : "Disabled"}</strong></div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Crops & Preferences" && (
          <section className="fp-panel">
            <div className="fp-panel-heading">
              <h2><FaLeaf /> Crops & Preferences</h2>
            </div>
            <p className="fp-help-text">
              Select the crops you grow and the crops you are interested in.
            </p>

            <h3 className="fp-subheading">Primary crops</h3>
            <div className="fp-choice-grid">
              {cropOptions.map((crop) => (
                <label className="fp-choice" key={`primary-${crop}`}>
                  <input
                    type="checkbox"
                    checked={draft.primaryCrops.includes(crop)}
                    onChange={() => toggleCrop("primaryCrops", crop)}
                  />
                  <span>{crop}</span>
                </label>
              ))}
            </div>

            <h3 className="fp-subheading">Interested crops</h3>
            <div className="fp-choice-grid">
              {cropOptions.map((crop) => (
                <label className="fp-choice" key={`interested-${crop}`}>
                  <input
                    type="checkbox"
                    checked={draft.interestedCrops.includes(crop)}
                    onChange={() => toggleCrop("interestedCrops", crop)}
                  />
                  <span>{crop}</span>
                </label>
              ))}
            </div>

            <div className="fp-form-actions">
              <button
                type="button"
                className="fp-secondary-button"
                onClick={() => {
                  setDraft({
                    ...profile,
                    primaryCrops: [...profile.primaryCrops],
                    interestedCrops: [...profile.interestedCrops],
                  });
                  setActiveTab("Farm Details");
                }}
              >
                Cancel
              </button>
              <button type="button" className="fp-primary-button" onClick={saveCropPreferences}>
                <FaCheck /> Save Preferences
              </button>
            </div>
          </section>
        )}

        {activeTab === "Saved Recommendations" && (
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaSeedling /> Saved Recommendations</h2></div>
            <div className="fp-empty-inline">
              <FaInfoCircle />
              <strong>No saved recommendations</strong>
              <p>Saved recommendations will appear after the recommendation workflow and storage are connected.</p>
            </div>
          </section>
        )}

        {activeTab === "Analysis History" && (
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaHistory /> Analysis History</h2></div>
            <div className="fp-empty-inline">
              <FaClipboardList />
              <strong>No saved analyses</strong>
              <p>Actual analysis records will appear here after history storage is connected.</p>
            </div>
          </section>
        )}

        {activeTab === "Account Settings" && (
          <div className="fp-settings-grid">
            <section className="fp-panel">
              <div className="fp-panel-heading"><h2><FaBell /> Notification Settings</h2></div>

              {[
                ["emailNotifications", "Email notifications"],
                ["smsNotifications", "SMS notifications"],
                ["weatherAlerts", "Weather alerts"],
                ["recommendations", "Crop recommendation updates"],
              ].map(([field, label]) => (
                <label className="fp-setting-row" key={field}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={profile[field]}
                    onChange={(event) => setProfile((current) => ({
                      ...current,
                      [field]: event.target.checked,
                    }))}
                  />
                </label>
              ))}

              <div className="fp-field">
                <label htmlFor="fp-language">Language preference</label>
                <select
                  id="fp-language"
                  value={profile.language}
                  onChange={(event) => setProfile((current) => ({
                    ...current,
                    language: event.target.value,
                  }))}
                >
                  <option>English</option>
                  <option>Kannada</option>
                  <option>English / Kannada</option>
                </select>
              </div>
              <p className="fp-help-text">Preferences are currently kept in session state only.</p>
            </section>

            <section className="fp-panel">
              <div className="fp-panel-heading"><h2><FaLock /> Change Password</h2></div>
              <form className="fp-password-form" onSubmit={handlePasswordChange}>
                <div className="fp-field">
                  <label htmlFor="fp-current-password">Current password</label>
                  <input id="fp-current-password" type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} />
                </div>
                <div className="fp-field">
                  <label htmlFor="fp-new-password">New password</label>
                  <input id="fp-new-password" type="password" autoComplete="new-password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} />
                </div>
                <div className="fp-field">
                  <label htmlFor="fp-confirm-password">Confirm new password</label>
                  <input id="fp-confirm-password" type="password" autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} />
                </div>
                <button type="submit" className="fp-primary-button"><FaLock /> Request Password Change</button>
              </form>
            </section>
          </div>
        )}

        {editing && (
          <div
            className="fp-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setEditing(false);
            }}
          >
            <section className="fp-edit-modal" role="dialog" aria-modal="true" aria-labelledby="fp-edit-title">
              <div className="fp-modal-heading">
                <div>
                  <h2 id="fp-edit-title">Edit Farmer Profile</h2>
                  <p>Enter your own profile and farm information.</p>
                </div>
                <button type="button" className="fp-modal-close" aria-label="Close dialog" onClick={() => setEditing(false)}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={saveProfile}>
                <div className="fp-edit-grid">
                  {[
                    ["name", "Full name", "text"],
                    ["phone", "Phone number", "tel"],
                    ["email", "Email address", "email"],
                    ["location", "Village, town or district", "text"],
                    ["memberSince", "Member since", "date"],
                    ["farmName", "Farm name", "text"],
                    ["farmArea", "Farm area (acres)", "number"],
                  ].map(([field, label, type]) => (
                    <div className="fp-field" key={field}>
                      <label htmlFor={`fp-${field}`}>{label}</label>
                      <input
                        id={`fp-${field}`}
                        type={type}
                        min={type === "number" ? "0" : undefined}
                        step={type === "number" ? "any" : undefined}
                        value={draft[field]}
                        onChange={(event) => updateDraft(field, event.target.value)}
                      />
                    </div>
                  ))}

                  <div className="fp-field">
                    <label htmlFor="fp-land-type">Land type</label>
                    <select id="fp-land-type" value={draft.landType} onChange={(event) => updateDraft("landType", event.target.value)}>
                      <option value="">Select land type</option>
                      <option>Flat land</option>
                      <option>Hilly / Sloped Land</option>
                      <option>Lowland</option>
                      <option>Mixed terrain</option>
                    </select>
                  </div>

                  <div className="fp-field">
                    <label htmlFor="fp-soil-type">Soil type</label>
                    <select id="fp-soil-type" value={draft.soilType} onChange={(event) => updateDraft("soilType", event.target.value)}>
                      <option value="">Select soil type</option>
                      <option>Red soil</option>
                      <option>Black soil</option>
                      <option>Loamy soil</option>
                      <option>Sandy soil</option>
                      <option>Clay soil</option>
                      <option>Laterite soil</option>
                      <option>Unknown</option>
                    </select>
                  </div>

                  <div className="fp-field">
                    <label htmlFor="fp-water-source">Water source</label>
                    <select id="fp-water-source" value={draft.waterSource} onChange={(event) => updateDraft("waterSource", event.target.value)}>
                      <option value="">Select water source</option>
                      <option>Borewell</option>
                      <option>Rainwater</option>
                      <option>Canal</option>
                      <option>River</option>
                      <option>Tank / Lake</option>
                      <option>Multiple sources</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="fp-field">
                    <label htmlFor="fp-farming-type">Farming type</label>
                    <select id="fp-farming-type" value={draft.farmingType} onChange={(event) => updateDraft("farmingType", event.target.value)}>
                      <option value="">Select farming type</option>
                      <option>Organic farming</option>
                      <option>Conventional farming</option>
                      <option>Natural farming</option>
                      <option>Mixed farming</option>
                    </select>
                  </div>
                </div>

                <div className="fp-form-actions">
                  <button type="button" className="fp-secondary-button" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="fp-primary-button"><FaCheck /> Save Profile</button>
                </div>
              </form>
            </section>
          </div>
        )}

        <footer className="fp-footer">
          KisanVision AI · Farmer Profile
          <span>Profile data remains in this session until storage is connected.</span>
        </footer>
      </main>
    </div>
  );
}

export default FarmerProfile;
