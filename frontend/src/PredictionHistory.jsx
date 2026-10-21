
import { useMemo, useState } from "react";
import {
  FaHistory,
  FaLeaf,
  FaMicroscope,
  FaImages,
  FaCloudSun,
  FaFileExport,
  FaTrashAlt,
  FaQuestionCircle,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaEye,
  FaDownload,
  FaTimes,
  FaInfoCircle,
  FaSeedling,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
} from "react-icons/fa";
import "./PredictionHistory.css";

const historyNavigation = [
  { label: "All Analyses", icon: FaHistory, value: "All" },
  {
    label: "Disease Detection",
    icon: FaMicroscope,
    value: "Disease Detection",
  },
  {
    label: "Plant Identification",
    icon: FaLeaf,
    value: "Plant Identification",
  },
  {
    label: "Multi-Image Analysis",
    icon: FaImages,
    value: "Multi-Image Analysis",
  },
  {
    label: "Weather Recommendations",
    icon: FaCloudSun,
    value: "Weather Recommendations",
  },
  { label: "Export Reports", icon: FaFileExport, value: "Export Reports" },
  { label: "Delete Records", icon: FaTrashAlt, value: "Delete Records" },
  { label: "FAQs", icon: FaQuestionCircle, value: "FAQs" },
];

function PredictionHistory() {
  const [records] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [analysisType, setAnalysisType] = useState("All Types");
  const [selectedCrop, setSelectedCrop] = useState("All Crops");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const searchableText = [
        record.crop,
        record.disease,
        record.type,
        record.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesType =
        analysisType === "All Types" || record.type === analysisType;

      const matchesCrop =
        selectedCrop === "All Crops" || record.crop === selectedCrop;

      const recordDate = record.createdAt
        ? new Date(record.createdAt)
        : null;

      const matchesStart =
        !startDate ||
        (recordDate && recordDate >= new Date(`${startDate}T00:00:00`));

      const matchesEnd =
        !endDate ||
        (recordDate && recordDate <= new Date(`${endDate}T23:59:59`));

      const matchesCategory =
        activeCategory === "All" ||
        activeCategory === "Export Reports" ||
        activeCategory === "Delete Records" ||
        activeCategory === "FAQs" ||
        record.type === activeCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesCrop &&
        matchesStart &&
        matchesEnd &&
        matchesCategory
      );
    });
  }, [
    records,
    search,
    analysisType,
    selectedCrop,
    startDate,
    endDate,
    activeCategory,
  ]);

  const handleNavigation = (value) => {
    setActiveCategory(value);
    setSelectedRecord(null);

    if (value === "Export Reports") {
      setNotice(
        records.length
          ? "Export can be connected when report storage is implemented."
          : "There are no saved records to export yet."
      );
    } else if (value === "Delete Records") {
      setNotice(
        records.length
          ? "Record deletion will be available when persistent storage is connected."
          : "There are no saved records to delete."
      );
    } else if (value === "FAQs") {
      setNotice(
        "History stores analyses only after saving is connected. No predictions are generated on this page."
      );
    } else {
      setNotice("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setAnalysisType("All Types");
    setSelectedCrop("All Crops");
    setStartDate("");
    setEndDate("");
    setActiveCategory("All");
    setNotice("");
  };

  const handleExport = () => {
    if (!filteredRecords.length) {
      setNotice("No saved records are available to export.");
      return;
    }

    const headers = [
      "Crop",
      "Disease or Result",
      "Analysis Type",
      "Status",
      "Date",
    ];

    const rows = filteredRecords.map((record) => [
      record.crop,
      record.disease,
      record.type,
      record.status,
      record.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "kisanvision-analysis-history.csv";
    link.click();

    URL.revokeObjectURL(url);
    setNotice("The available history records were exported.");
  };

  return (
    <div className="ph-page">
      <aside className="ph-sidebar">
        <div className="ph-sidebar-heading">
          <span className="ph-sidebar-logo">
            <FaHistory />
          </span>
          <div>
            <h2>Prediction History</h2>
            <p>Review your past analyses</p>
          </div>
        </div>

        <nav className="ph-sidebar-nav" aria-label="History navigation">
          {historyNavigation.map(({ label, icon: Icon, value }) => (
            <button
              type="button"
              key={value}
              className={
                activeCategory === value
                  ? "ph-side-link active"
                  : "ph-side-link"
              }
              onClick={() => handleNavigation(value)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="ph-sidebar-note">
          <FaSeedling />
          <h3>Your analyses, in one place</h3>
          <p>
            Saved results will appear here when history storage is connected.
          </p>
        </div>
      </aside>

      <section className="ph-content">
        <header className="ph-page-heading">
          <div className="ph-heading-icon">
            <FaHistory />
          </div>

          <div className="ph-heading-copy">
            <span className="ph-eyebrow">KISANVISION AI / WORKSPACE</span>
            <h1>Prediction History</h1>
            <p>View and manage your past analyses, results and reports.</p>
          </div>
        </header>

        <section className="ph-filter-panel">
          <div className="ph-field ph-search-field">
            <label htmlFor="ph-search">Search</label>
            <div className="ph-input-wrap">
              <FaSearch />
              <input
                id="ph-search"
                type="search"
                placeholder="Search by crop, disease or result..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="ph-field">
            <label htmlFor="ph-type">Analysis Type</label>
            <div className="ph-select-wrap">
              <select
                id="ph-type"
                value={analysisType}
                onChange={(event) => setAnalysisType(event.target.value)}
              >
                <option>All Types</option>
                <option>Disease Detection</option>
                <option>Plant Identification</option>
                <option>Multi-Image Analysis</option>
                <option>Weather Recommendations</option>
              </select>
              <FaChevronDown />
            </div>
          </div>

          <div className="ph-field">
            <label htmlFor="ph-crop">Crop</label>
            <div className="ph-select-wrap">
              <select
                id="ph-crop"
                value={selectedCrop}
                onChange={(event) => setSelectedCrop(event.target.value)}
              >
                <option>All Crops</option>
                {[
                  "Rice",
                  "Maize",
                  "Ragi",
                  "Jowar",
                  "Sugarcane",
                  "Red Gram",
                  "Bengal Gram",
                  "Groundnut",
                  "Sunflower",
                  "Cotton",
                  "Coffee",
                  "Arecanut",
                  "Coconut",
                  "Tomato",
                  "Potato",
                  "Onion",
                  "Green Chilli",
                  "Mango",
                  "Banana",
                  "Grapes",
                  "Black Pepper",
                  "Shunti",
                  "Elakki",
                ].map((crop) => (
                  <option key={crop}>{crop}</option>
                ))}
              </select>
              <FaChevronDown />
            </div>
          </div>

          <div className="ph-field ph-date-field">
            <label htmlFor="ph-start-date">Date Range — From</label>
            <div className="ph-input-wrap">
              <FaCalendarAlt />
              <input
                id="ph-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>

          <div className="ph-field ph-date-field">
            <label htmlFor="ph-end-date">To</label>
            <div className="ph-input-wrap">
              <FaCalendarAlt />
              <input
                id="ph-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="ph-filter-button"
            onClick={() => setNotice("Filters applied to available saved records.")}
          >
            <FaFilter /> Filter
          </button>

          <button
            type="button"
            className="ph-clear-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </section>

        {notice && (
          <div className="ph-notice" role="status">
            <FaInfoCircle />
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {activeCategory === "FAQs" ? (
          <section className="ph-empty-panel">
            <FaQuestionCircle className="ph-empty-icon" />
            <h2>Prediction History FAQs</h2>
            <p>
              This page will display analyses after records are saved by the
              connected application. Search and filters work on available
              records; results are not invented.
            </p>
            <button
              type="button"
              className="ph-secondary-button"
              onClick={() => handleNavigation("All")}
            >
              Back to all analyses
            </button>
          </section>
        ) : (
          <>
            <div className="ph-summary-row">
              <div>
                <h2>
                  <FaHistory /> Analysis History
                </h2>
                <p>
                  {filteredRecords.length} saved{" "}
                  {filteredRecords.length === 1 ? "record" : "records"}
                </p>
              </div>

              <button
                type="button"
                className="ph-export-button"
                onClick={handleExport}
                disabled={!filteredRecords.length}
              >
                <FaDownload /> Export All
              </button>
            </div>

            <div className="ph-main-grid">
              <section className="ph-table-panel">
                <div className="ph-table-topline">
                  <h3>
                    {activeCategory === "All"
                      ? "All Analyses"
                      : activeCategory}
                  </h3>
                  <span>{filteredRecords.length} results</span>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="ph-empty-state">
                    <div className="ph-empty-illustration">
                      <FaClipboardList />
                    </div>
                    <h3>No saved analyses yet</h3>
                    <p>
                      When your application saves an analysis, its crop,
                      result, date and image will appear here.
                    </p>
                    {(search ||
                      analysisType !== "All Types" ||
                      selectedCrop !== "All Crops" ||
                      startDate ||
                      endDate ||
                      activeCategory !== "All") && (
                      <button
                        type="button"
                        className="ph-secondary-button"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="ph-table-scroll">
                    <table className="ph-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Crop</th>
                          <th>Disease / Result</th>
                          <th>Type</th>
                          <th>Date &amp; Time</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record, index) => (
                          <tr key={record.id}>
                            <td>{index + 1}</td>
                            <td>{record.crop}</td>
                            <td>{record.disease || "Not provided"}</td>
                            <td>{record.type}</td>
                            <td>
                              {record.createdAt
                                ? new Date(record.createdAt).toLocaleString()
                                : "Date unavailable"}
                            </td>
                            <td>{record.status || "Saved"}</td>
                            <td>
                              <button
                                type="button"
                                className="ph-view-button"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <FaEye /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <aside className="ph-details-panel">
                <div className="ph-details-heading">
                  <h2>
                    <FaEye /> Analysis Details
                  </h2>
                </div>

                {selectedRecord ? (
                  <div className="ph-record-details">
                    <h3>{selectedRecord.crop}</h3>
                    <p>{selectedRecord.disease || "Result unavailable"}</p>
                    <dl>
                      <dt>Analysis type</dt>
                      <dd>{selectedRecord.type}</dd>
                      <dt>Status</dt>
                      <dd>{selectedRecord.status || "Saved"}</dd>
                      <dt>Date</dt>
                      <dd>
                        {selectedRecord.createdAt
                          ? new Date(selectedRecord.createdAt).toLocaleString()
                          : "Unavailable"}
                      </dd>
                    </dl>
                    {selectedRecord.imageUrl && (
                      <img
                        src={selectedRecord.imageUrl}
                        alt={`Saved analysis of ${selectedRecord.crop}`}
                      />
                    )}
                  </div>
                ) : (
                  <div className="ph-details-empty">
                    <FaEye />
                    <h3>Select a record</h3>
                    <p>
                      Select a saved analysis from the history table to see
                      its details here.
                    </p>
                  </div>
                )}

                <div className="ph-detail-actions">
                  <h3>Actions</h3>
                  <p>
                    Export and deletion actions require saved records and
                    connected storage.
                  </p>
                  <button
                    type="button"
                    className="ph-delete-button"
                    disabled={!selectedRecord}
                    onClick={() =>
                      setNotice(
                        "Connect persistent storage before deleting saved records."
                      )
                    }
                  >
                    <FaTrashAlt /> Delete Record
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default PredictionHistory;
