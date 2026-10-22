
import { useState } from "react";
import {
  FaUserCircle, FaSeedling, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaCalendarAlt, FaChartBar, FaMicroscope, FaCloudSun, FaLeaf,
  FaHistory, FaBell, FaLock, FaQuestionCircle, FaSignOutAlt,
  FaHome, FaTractor, FaTint, FaMountain, FaRulerCombined, FaEdit,
  FaCheck, FaTimes, FaCamera, FaInfoCircle
} from "react-icons/fa";
import "./FarmerProfile.css";

const cropOptions = ["Coffee", "Black Pepper", "Ginger", "Cardamom", "Arecanut"];

const initialProfile = {
  name: "", phone: "", email: "", location: "", memberSince: "",
  farmName: "", farmArea: "", landType: "", soilType: "", waterSource: "",
  farmingType: "", primaryCrops: [], interestedCrops: [],
  language: "English", emailNotifications: true, smsNotifications: false,
  weatherAlerts: true, recommendations: true
};

const tabs = [
  { label: "Farm Details", icon: FaHome },
  { label: "Crops & Preferences", icon: FaLeaf },
  { label: "Saved Recommendations", icon: FaSeedling },
  { label: "Analysis History", icon: FaHistory },
  { label: "Account Settings", icon: FaLock }
];

export default function FarmerProfile() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kisanvision-farmer-profile") || "{}");
      return { ...initialProfile, ...saved };
    } catch {
      return initialProfile;
    }
  });
  const [draft, setDraft] = useState(profile);
  const [activeTab, setActiveTab] = useState("Farm Details");
  const [activeSidebar, setActiveSidebar] = useState("Farmer Profile");
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });

  const updateDraft = (field, value) =>
    setDraft(current => ({ ...current, [field]: value }));

  const startEditing = () => {
    setDraft({ ...profile, primaryCrops: [...profile.primaryCrops], interestedCrops: [...profile.interestedCrops] });
    setEditing(true);
    setNotice("");
  };

  const saveProfile = event => {
    event.preventDefault();
    if (draft.phone && !/^[+\d\s()-]{7,20}$/.test(draft.phone)) {
      setNotice("Please enter a valid phone number.");
      return;
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setNotice("Please enter a valid email address.");
      return;
    }
    const updated = { ...draft };
    setProfile(updated);
    try {
      localStorage.setItem("kisanvision-farmer-profile", JSON.stringify(updated));
    } catch {
      setNotice("Profile updated for this session, but browser storage was unavailable.");
      setEditing(false);
      return;
    }
    setEditing(false);
    setNotice("Your profile has been saved on this device.");
  };

  const toggleCrop = (field, crop) => {
    setDraft(current => {
      const selected = current[field] || [];
      return {
        ...current,
        [field]: selected.includes(crop)
          ? selected.filter(item => item !== crop)
          : [...selected, crop]
      };
    });
  };

  const saveCropPreferences = () => {
    const updated = { ...profile, primaryCrops: [...draft.primaryCrops], interestedCrops: [...draft.interestedCrops] };
    setProfile(updated);
    localStorage.setItem("kisanvision-farmer-profile", JSON.stringify(updated));
    setActiveTab("Farm Details");
    setNotice("Crop preferences saved on this device.");
  };

  const selectSidebar = label => {
    setActiveSidebar(label);
    setNotice("");
    const map = {
      "Farmer Profile": "Farm Details",
      "My Farm Details": "Farm Details",
      "My Analyses": "Analysis History",
      "Saved Recommendations": "Saved Recommendations",
      "Notification Settings": "Account Settings",
      "Change Password": "Account Settings"
    };
    if (map[label]) setActiveTab(map[label]);
    if (label === "Help & Support") setNotice("Help and support will be available when connected.");
    if (label === "Logout") setNotice("Use the main application sign-out button to securely log out.");
  };

  const handlePasswordChange = event => {
    event.preventDefault();
    if (!password.current || !password.next || !password.confirm) {
      setNotice("Please fill in all password fields.");
    } else if (password.next.length < 8) {
      setNotice("Your new password must have at least 8 characters.");
    } else if (password.next !== password.confirm) {
      setNotice("The new password and confirmation do not match.");
    } else {
      setNotice("Password changes must be completed through the authenticated backend.");
    }
  };

  const sidebarItems = [
    { label: "Farmer Profile", icon: FaUserCircle },
    { label: "My Farm Details", icon: FaTractor },
    { label: "My Analyses", icon: FaMicroscope },
    { label: "Saved Recommendations", icon: FaSeedling },
    { label: "Notification Settings", icon: FaBell },
    { label: "Change Password", icon: FaLock },
    { label: "Help & Support", icon: FaQuestionCircle }
  ];

  const farmRows = [
    ["Farm Name", profile.farmName, FaHome],
    ["Location", profile.location, FaMapMarkerAlt],
    ["Farm Area", profile.farmArea ? `${profile.farmArea} acres` : "", FaRulerCombined],
    ["Land Type", profile.landType, FaMountain],
    ["Soil Type", profile.soilType, FaSeedling],
    ["Water Source", profile.waterSource, FaTint],
    ["Farming Type", profile.farmingType, FaTractor]
  ];

  return (
    <div className="fp-page">
      <aside className="fp-sidebar">
        <div className="fp-sidebar-heading">
          <FaUserCircle />
          <div><h2>Farmer Profile</h2><p>Manage your farming account</p></div>
        </div>
        <nav className="fp-sidebar-nav" aria-label="Farmer profile navigation">
          {sidebarItems.map(({ label, icon: Icon }) => (
            <button type="button" key={label}
              className={`fp-side-link ${activeSidebar === label ? "active" : ""}`}
              onClick={() => selectSidebar(label)}>
              <Icon /><span>{label}</span>
            </button>
          ))}
          <button type="button" className="fp-side-link" onClick={() => selectSidebar("Logout")}>
            <FaSignOutAlt /><span>Logout</span>
          </button>
        </nav>
        <div className="fp-sidebar-banner">
          <FaSeedling /><h3>Healthy Farms</h3>
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

        {notice && <div className="fp-notice" role="status">
          <FaInfoCircle /><span>{notice}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><FaTimes /></button>
        </div>}

        <section className="fp-overview">
          <div className="fp-identity">
            <div className="fp-avatar">
              {photo ? <img src={photo} alt="Farmer profile" /> : <FaUserCircle />}
              <label className="fp-camera-button" title="Upload profile photo">
                <FaCamera />
                <input type="file" accept="image/*" aria-label="Upload profile photo"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                      setNotice("Choose a valid image smaller than 5 MB.");
                      return;
                    }
                    setPhoto(URL.createObjectURL(file));
                    setNotice("Photo preview updated for this session.");
                  }} />
              </label>
            </div>
            <div className="fp-identity-info">
              <h2>{profile.name || "Your Name"}</h2>
              <span className="fp-status"><FaCheck /> Profile</span>
              <p><FaPhone /><span>{profile.phone || "Add phone number"}</span></p>
              <p><FaEnvelope /><span>{profile.email || "Add email address"}</span></p>
              <p><FaMapMarkerAlt /><span>{profile.location || "Add your location"}</span></p>
              <p><FaCalendarAlt /><span>{profile.memberSince || "Membership date unavailable"}</span></p>
            </div>
          </div>
          <div className="fp-stats">
            <h2><FaChartBar /> Quick Stats</h2>
            <div className="fp-stat-grid">
              <div className="fp-stat-card"><FaLeaf className="fp-stat-green" /><span>Total Analyses</span><strong>—</strong><small>Awaiting saved records</small></div>
              <div className="fp-stat-card"><FaMicroscope className="fp-stat-red" /><span>Disease Cases</span><strong>—</strong><small>Awaiting saved results</small></div>
              <div className="fp-stat-card"><FaSeedling className="fp-stat-green" /><span>Healthy Cases</span><strong>—</strong><small>Awaiting saved results</small></div>
              <div className="fp-stat-card"><FaCloudSun className="fp-stat-blue" /><span>Weather Checks</span><strong>—</strong><small>Awaiting saved records</small></div>
            </div>
          </div>
        </section>

        <nav className="fp-tabs" aria-label="Profile sections">
          {tabs.map(({ label, icon: Icon }) => (
            <button type="button" key={label}
              className={activeTab === label ? "active" : ""}
              onClick={() => { setActiveTab(label); setNotice(""); }}>
              <Icon />{label}
            </button>
          ))}
        </nav>

        {activeTab === "Farm Details" && <div className="fp-content-grid">
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaTractor /> Farm Information</h2>
              <button type="button" onClick={startEditing}><FaEdit /> Edit</button></div>
            <div className="fp-info-table">
              {farmRows.map(([label, value, Icon]) => <div className="fp-info-row" key={label}>
                <Icon /><span>{label}</span><strong>{value || "Not provided"}</strong>
              </div>)}
            </div>
          </section>
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaLeaf /> My Crops</h2>
              <button type="button" onClick={() => { setDraft(profile); setActiveTab("Crops & Preferences"); }}><FaEdit /> Edit</button></div>
            <div className="fp-crop-grid">
              {profile.primaryCrops.length ? profile.primaryCrops.map(crop => <div className="fp-crop-card" key={crop}>
                <span className="fp-crop-icon"><FaSeedling /></span><strong>{crop}</strong><small>Primary crop</small>
              </div>) : <div className="fp-empty-inline"><FaSeedling /><strong>No crops added yet</strong><p>Choose your primary crops to personalize your farming profile.</p><button type="button" onClick={() => setActiveTab("Crops & Preferences")}>Choose crops</button></div>}
            </div>
          </section>
        </div>}

        {activeTab === "Crops & Preferences" && <section className="fp-panel">
          <div className="fp-panel-heading"><h2><FaLeaf /> Crops & Preferences</h2></div>
          <p className="fp-help-text">Choose the crops you grow and the crops you are interested in.</p>
          <h3 className="fp-subheading">Primary crops</h3>
          <div className="fp-choice-grid">{cropOptions.map(crop => <label className="fp-choice" key={crop}>
            <input type="checkbox" checked={draft.primaryCrops.includes(crop)} onChange={() => toggleCrop("primaryCrops", crop)} /><span>{crop}</span>
          </label>)}</div>
          <h3 className="fp-subheading">Interested crops</h3>
          <div className="fp-choice-grid">{cropOptions.map(crop => <label className="fp-choice" key={crop}>
            <input type="checkbox" checked={draft.interestedCrops.includes(crop)} onChange={() => toggleCrop("interestedCrops", crop)} /><span>{crop}</span>
          </label>)}</div>
          <div className="fp-form-actions"><button type="button" className="fp-secondary-button" onClick={() => setDraft(profile)}>Cancel</button><button type="button" className="fp-primary-button" onClick={saveCropPreferences}><FaCheck /> Save Preferences</button></div>
        </section>}

        {activeTab === "Saved Recommendations" && <section className="fp-panel">
          <div className="fp-panel-heading"><h2><FaSeedling /> Saved Recommendations</h2></div>
          <div className="fp-empty-inline"><FaSeedling /><strong>No saved recommendations yet</strong><p>Recommendations will appear here when you save them from the recommendation feature.</p></div>
        </section>}

        {activeTab === "Analysis History" && <section className="fp-panel">
          <div className="fp-panel-heading"><h2><FaHistory /> Analysis History</h2></div>
          <div className="fp-empty-inline"><FaMicroscope /><strong>No analysis history yet</strong><p>Your saved crop analyses will appear here when analysis records are connected.</p></div>
        </section>}

        {activeTab === "Account Settings" && <div className="fp-settings-grid">
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaBell /> Notification Settings</h2></div>
            {[["emailNotifications", "Email notifications"], ["smsNotifications", "SMS notifications"], ["weatherAlerts", "Weather alerts"], ["recommendations", "Crop recommendations"]].map(([field, label]) =>
              <label className="fp-setting-row" key={field}><span>{label}</span><input type="checkbox" checked={Boolean(profile[field])} onChange={event => {
                const updated = { ...profile, [field]: event.target.checked };
                setProfile(updated);
                localStorage.setItem("kisanvision-farmer-profile", JSON.stringify(updated));
              }} /></label>)}
            <div className="fp-field"><label htmlFor="fp-language">Language preference</label>
              <select id="fp-language" value={profile.language} onChange={event => {
                const updated = { ...profile, language: event.target.value };
                setProfile(updated);
                localStorage.setItem("kisanvision-farmer-profile", JSON.stringify(updated));
              }}><option>English</option><option>Kannada</option><option>English / Kannada</option></select>
            </div>
          </section>
          <section className="fp-panel">
            <div className="fp-panel-heading"><h2><FaLock /> Change Password</h2></div>
            <form className="fp-password-form" onSubmit={handlePasswordChange}>
              {[["current", "Current password"], ["next", "New password"], ["confirm", "Confirm new password"]].map(([field, label]) =>
                <div className="fp-field" key={field}><label htmlFor={`fp-password-${field}`}>{label}</label>
                  <input id={`fp-password-${field}`} type="password" value={password[field]} onChange={event => setPassword(current => ({ ...current, [field]: event.target.value }))} autoComplete="current-password" /></div>)}
              <button type="submit" className="fp-primary-button"><FaLock /> Request Password Change</button>
            </form>
          </section>
        </div>}

        {editing && <div className="fp-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(false); }}>
          <section className="fp-edit-modal" role="dialog" aria-modal="true" aria-labelledby="fp-edit-title">
            <div className="fp-modal-heading"><div><h2 id="fp-edit-title">Edit Farmer Profile</h2><p>Enter your profile and farm information.</p></div>
              <button type="button" className="fp-modal-close" aria-label="Close dialog" onClick={() => setEditing(false)}><FaTimes /></button></div>
            <form onSubmit={saveProfile}>
              <div className="fp-edit-grid">
                {[["name", "Full name", "text"], ["phone", "Phone number", "tel"], ["email", "Email address", "email"], ["location", "Village, town or district", "text"], ["memberSince", "Member since", "date"], ["farmName", "Farm name", "text"], ["farmArea", "Farm area (acres)", "number"]].map(([field, label, type]) =>
                  <div className="fp-field" key={field}><label htmlFor={`fp-${field}`}>{label}</label><input id={`fp-${field}`} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={draft[field]} onChange={event => updateDraft(field, event.target.value)} /></div>)}
                {[["landType", "Land type", ["Flat land", "Hilly / Sloped Land", "Lowland", "Mixed terrain"]], ["soilType", "Soil type", ["Red soil", "Black soil", "Loamy soil", "Sandy soil", "Clay soil", "Laterite soil", "Unknown"]], ["waterSource", "Water source", ["Borewell", "Rainwater", "Canal", "River", "Tank / Lake", "Multiple sources", "Other"]], ["farmingType", "Farming type", ["Organic farming", "Conventional farming", "Natural farming", "Mixed farming"]]].map(([field, label, options]) =>
                  <div className="fp-field" key={field}><label htmlFor={`fp-${field}`}>{label}</label><select id={`fp-${field}`} value={draft[field]} onChange={event => updateDraft(field, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option}>{option}</option>)}</select></div>)}
              </div>
              <div className="fp-form-actions"><button type="button" className="fp-secondary-button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="fp-primary-button"><FaCheck /> Save Profile</button></div>
            </form>
          </section>
        </div>}

        <footer className="fp-footer">KisanVision AI · Farmer Profile<span>Profile details are saved in this browser on this device.</span></footer>
      </main>
    </div>
  );
}
