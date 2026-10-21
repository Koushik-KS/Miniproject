
import { useState } from "react";
import {
  FaCloudSun,
  FaSeedling,
  FaMapMarkerAlt,
  FaCloud,
  FaCloudRain,
  FaSun,
  FaWind,
  FaTint,
  FaThermometerHalf,
  FaLeaf,
  FaWater,
  FaMountain,
  FaSearch,
  FaHistory,
  FaQuestionCircle,
  FaInfoCircle,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaCalendarAlt,
  FaLocationArrow,
  FaSpinner,
} from "react-icons/fa";
import "./WeatherRecommendation.css";

const weatherCode = (code) => {
  if (code === 0) return { label: "Clear sky", icon: FaSun };
  if ([1, 2].includes(code)) return { label: "Partly cloudy", icon: FaCloudSun };
  if (code === 3) return { label: "Overcast", icon: FaCloud };
  if ([45, 48].includes(code)) return { label: "Fog", icon: FaCloud };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: FaCloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", icon: FaCloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", icon: FaCloud };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: FaCloudRain };
  return { label: "Weather unavailable", icon: FaCloudSun };
};

const navItems = [
  { id: "overview", label: "Crop Recommendation", icon: FaSeedling },
  { id: "current-weather", label: "Current Weather", icon: FaCloudSun },
  { id: "forecast", label: "Forecast & Analysis", icon: FaCalendarAlt },
  { id: "soil", label: "Soil Information", icon: FaMountain },
  { id: "crop-requirements", label: "Crop Requirements", icon: FaLeaf },
  { id: "saved", label: "Saved Recommendations", icon: FaHistory },
  { id: "faqs", label: "FAQs", icon: FaQuestionCircle },
];

const faqs = [
  {
    q: "How does weather-aware crop recommendation work?",
    a: "A reliable system combines local weather observations, forecast data, soil properties, water availability, crop requirements, and the local growing season. This interface currently retrieves weather data but does not yet calculate validated crop suitability.",
  },
  {
    q: "Where does the weather information come from?",
    a: "When you search for a location, the page uses Open-Meteo's geocoding and forecast APIs. An internet connection is required. The displayed values come from the API response, not from invented sample readings.",
  },
  {
    q: "Does this page recommend a crop now?",
    a: "Not yet. A validated recommendation engine, appropriate crop requirements, local agricultural guidance, and soil information must be connected before crop suitability can be calculated.",
  },
  {
    q: "Why do I need to enter soil and water details?",
    a: "Weather alone cannot determine the best crop. Soil type, soil pH, irrigation availability, land conditions, season, and local agricultural guidance also matter.",
  },
  {
    q: "Can I save my recommendations?",
    a: "Persistent saved recommendations are not implemented yet. This prototype does not claim to store records in a database.",
  },
];

export default function WeatherRecommendation() {
  const [location, setLocation] = useState("");
  const [locationName, setLocationName] = useState("");
  const [soilType, setSoilType] = useState("");
  const [soilPH, setSoilPH] = useState("");
  const [waterAvailability, setWaterAvailability] = useState("");
  const [landType, setLandType] = useState("");
  const [area, setArea] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [searched, setSearched] = useState(false);

  const navigateTo = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    document.getElementById(`wr-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const getWeather = async (event) => {
    event.preventDefault();
    setError("");
    setWeather(null);
    setForecast([]);
    setSearched(false);

    const query = location.trim();
    if (!query) {
      setError("Enter a city, town, or village to look up its weather.");
      return;
    }

    setLoading(true);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error("Location lookup failed. Try again.");

      const geoData = await geoResponse.json();
      const place = geoData.results?.[0];

      if (!place) {
        throw new Error("Location not found. Try a nearby town or city name.");
      }

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
        timezone: "auto",
        forecast_days: "5",
      });

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather service is unavailable. Please try again later.");
      }

      const data = await weatherResponse.json();

      if (!data.current || !data.daily) {
        throw new Error("The weather service did not return complete data.");
      }

      setLocationName(
        [place.name, place.admin1, place.country].filter(Boolean).join(", ")
      );
      setWeather(data.current);
      setForecast(
        data.daily.time.map((date, index) => ({
          date,
          code: data.daily.weather_code?.[index],
          max: data.daily.temperature_2m_max?.[index],
          min: data.daily.temperature_2m_min?.[index],
          rainChance: data.daily.precipitation_probability_max?.[index],
          rainfall: data.daily.precipitation_sum?.[index],
        }))
      );
      setSearched(true);
    } catch (err) {
      setError(err.message || "Unable to retrieve weather data.");
    } finally {
      setLoading(false);
    }
  };

  const currentCondition = weather
    ? weatherCode(weather.weather_code)
    : null;

  return (
    <div className="wr-page">
      <header className="wr-heading">
        <button
          type="button"
          className="wr-mobile-menu"
          aria-label="Toggle dashboard navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((value) => !value)}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="wr-heading-icon">
          <FaCloudSun />
        </div>

        <div className="wr-heading-copy">
          <span className="wr-eyebrow">KISANVISION AI / SMART FARMING</span>
          <h1>Weather-Aware Crop Recommendation</h1>
          <p>
            Explore local weather conditions and prepare for informed crop
            planning.
          </p>
        </div>

        <span className="wr-live-status">
          <span />
          LIVE WEATHER LOOKUP
        </span>
      </header>

      <div className="wr-layout">
        <aside
          className={`wr-sidebar ${mobileMenuOpen ? "wr-sidebar-open" : ""}`}
          aria-label="Weather dashboard navigation"
        >
          <div className="wr-sidebar-brand">
            <span><FaSeedling /></span>
            <div>
              <strong>Farm Dashboard</strong>
              <small>Weather & crop planning</small>
            </div>
          </div>

          <nav className="wr-nav">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={activeSection === id ? "active" : ""}
                onClick={() => navigateTo(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="wr-sidebar-photo">
            <strong>Plan Wisely</strong>
            <span>Grow Sustainably</span>
          </div>
        </aside>

        {mobileMenuOpen && (
          <button
            type="button"
            className="wr-backdrop"
            aria-label="Close dashboard navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="wr-main">
          <section className="wr-card wr-location-card" id="wr-overview">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">YOUR FARM DETAILS</span>
                <h2><FaMapMarkerAlt /> Location & Soil Information</h2>
                <p>Enter a location to retrieve weather from the weather service.</p>
              </div>
            </div>

            <form className="wr-location-form" onSubmit={getWeather}>
              <label className="wr-field wr-location-field">
                <span>City, town, or village</span>
                <div className="wr-input-with-icon">
                  <FaMapMarkerAlt />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. Mysuru, Karnataka"
                    autoComplete="off"
                  />
                </div>
              </label>

              <label className="wr-field">
                <span>Soil type</span>
                <select value={soilType} onChange={(event) => setSoilType(event.target.value)}>
                  <option value="">Select soil type</option>
                  <option value="Red soil">Red soil</option>
                  <option value="Black soil">Black soil</option>
                  <option value="Alluvial soil">Alluvial soil</option>
                  <option value="Laterite soil">Laterite soil</option>
                  <option value="Sandy soil">Sandy soil</option>
                  <option value="Clay soil">Clay soil</option>
                  <option value="Loamy soil">Loamy soil</option>
                  <option value="Unknown">Not sure</option>
                </select>
              </label>

              <label className="wr-field">
                <span>Soil pH (optional)</span>
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={soilPH}
                  onChange={(event) => setSoilPH(event.target.value)}
                  placeholder="e.g. 6.5"
                />
              </label>

              <label className="wr-field">
                <span>Water availability</span>
                <select value={waterAvailability} onChange={(event) => setWaterAvailability(event.target.value)}>
                  <option value="">Select availability</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Limited irrigation">Limited irrigation</option>
                  <option value="Reliable irrigation">Reliable irrigation</option>
                  <option value="Seasonal water source">Seasonal water source</option>
                </select>
              </label>

              <label className="wr-field">
                <span>Land type</span>
                <select value={landType} onChange={(event) => setLandType(event.target.value)}>
                  <option value="">Select land type</option>
                  <option value="Lowland">Lowland</option>
                  <option value="Upland">Upland</option>
                  <option value="Sloping land">Sloping land</option>
                  <option value="Flat land">Flat land</option>
                </select>
              </label>

              <label className="wr-field">
                <span>Farm area (optional)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  placeholder="Area in acres"
                />
              </label>

              <button className="wr-primary-button" type="submit" disabled={loading}>
                {loading ? <FaSpinner className="wr-spin" /> : <FaSearch />}
                {loading ? "Fetching weather..." : "Get Local Weather"}
              </button>
            </form>

            {error && (
              <div className="wr-error" role="alert">
                <FaInfoCircle />
                <span>{error}</span>
              </div>
            )}

            <p className="wr-data-note">
              <FaInfoCircle />
              Weather is retrieved from Open-Meteo when you search. Soil details
              are entered by you and are not laboratory measurements.
            </p>
          </section>

          <section className="wr-section" id="wr-current-weather">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">LOCAL CONDITIONS</span>
                <h2><FaCloudSun /> Current Weather</h2>
                <p>
                  {searched
                    ? locationName
                    : "Search for a location to view its current weather."}
                </p>
              </div>
              {searched && <span className="wr-data-badge">API data</span>}
            </div>

            {!weather ? (
              <div className="wr-empty-weather">
                <FaCloudSun />
                <strong>Weather data not loaded</strong>
                <p>Enter a location above and select “Get Local Weather”.</p>
              </div>
            ) : (
              <div className="wr-weather-grid">
                <article className="wr-weather-main">
                  <div className="wr-weather-place">
                    <FaMapMarkerAlt /> {locationName}
                  </div>
                  <div className="wr-current-summary">
                    <currentCondition.icon />
                    <div>
                      <strong>{Math.round(weather.temperature_2m)}°C</strong>
                      <span>{currentCondition.label}</span>
                    </div>
                  </div>
                  <p>
                    Feels like {Math.round(weather.apparent_temperature)}°C
                  </p>
                </article>

                <article className="wr-metric-card">
                  <FaTint />
                  <span>Relative humidity</span>
                  <strong>{weather.relative_humidity_2m}%</strong>
                </article>

                <article className="wr-metric-card">
                  <FaWind />
                  <span>Wind speed</span>
                  <strong>{weather.wind_speed_10m} km/h</strong>
                </article>

                <article className="wr-metric-card">
                  <FaCloudRain />
                  <span>Precipitation</span>
                  <strong>{weather.precipitation} mm</strong>
                </article>
              </div>
            )}
          </section>

          <section className="wr-card" id="wr-forecast">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">UPCOMING CONDITIONS</span>
                <h2><FaCalendarAlt /> 5-Day Weather Forecast</h2>
                <p>Forecast values are shown only after a successful API response.</p>
              </div>
            </div>

            {forecast.length === 0 ? (
              <div className="wr-inline-empty">
                <FaCalendarAlt />
                <span>Search for a location to load the five-day forecast.</span>
              </div>
            ) : (
              <div className="wr-forecast-grid">
                {forecast.map((day) => {
                  const condition = weatherCode(day.code);
                  const WeatherIcon = condition.icon;

                  return (
                    <article className="wr-forecast-day" key={day.date}>
                      <strong>
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                          "en-IN",
                          { weekday: "short" }
                        )}
                      </strong>
                      <span className="wr-forecast-date">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short" }
                        )}
                      </span>
                      <WeatherIcon />
                      <span className="wr-forecast-condition">{condition.label}</span>
                      <strong className="wr-forecast-temperatures">
                        {day.max == null ? "—" : `${Math.round(day.max)}°`}
                        {" / "}
                        {day.min == null ? "—" : `${Math.round(day.min)}°`}
                      </strong>
                      <span className="wr-forecast-detail">
                        <FaCloudRain /> {day.rainChance == null ? "—" : `${day.rainChance}%`}
                      </span>
                      <span className="wr-forecast-detail">
                        Rain: {day.rainfall == null ? "—" : `${day.rainfall} mm`}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="wr-footnote">
              Forecasts can change. Use local agricultural advisories before
              making planting or irrigation decisions.
            </p>
          </section>

          <section className="wr-card" id="wr-soil">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">FARM CONDITIONS</span>
                <h2><FaMountain /> Soil Information</h2>
                <p>Review the details you entered for this planning session.</p>
              </div>
            </div>

            <div className="wr-soil-grid">
              <div><FaMountain /><span>Soil type</span><strong>{soilType || "Not provided"}</strong></div>
              <div><FaTint /><span>Soil pH</span><strong>{soilPH ? `${soilPH} (user entered)` : "Not provided"}</strong></div>
              <div><FaWater /><span>Water availability</span><strong>{waterAvailability || "Not provided"}</strong></div>
              <div><FaSeedling /><span>Land type</span><strong>{landType || "Not provided"}</strong></div>
              <div><FaLeaf /><span>Farm area</span><strong>{area ? `${area} acres (user entered)` : "Not provided"}</strong></div>
            </div>

            <div className="wr-data-note">
              <FaInfoCircle />
              <span>
                For accurate soil-based advice, use a soil-test report and
                locally validated agronomic guidance. Selecting a soil type
                here does not verify its properties.
              </span>
            </div>
          </section>

          <section className="wr-card" id="wr-crop-requirements">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">DECISION SUPPORT</span>
                <h2><FaSeedling /> Recommended Crops</h2>
                <p>Crop suitability results will appear after the recommendation engine is implemented.</p>
              </div>
            </div>

            <div className="wr-recommendation-pending">
              <div className="wr-pending-icon"><FaSeedling /></div>
              <div>
                <strong>Crop recommendation engine not connected</strong>
                <p>
                  No crops are ranked or presented as suitable yet. The next
                  step is to integrate validated crop requirements, regional
                  growing seasons, soil conditions, water needs, and weather
                  rules.
                </p>
              </div>
            </div>

            <div className="wr-requirement-grid">
              <div><FaCloudSun /><strong>Weather suitability</strong><span>Requires defined crop-specific thresholds.</span></div>
              <div><FaMountain /><strong>Soil compatibility</strong><span>Requires verified soil and crop requirements.</span></div>
              <div><FaWater /><strong>Water requirements</strong><span>Requires local irrigation and rainfall criteria.</span></div>
            </div>
          </section>

          <section className="wr-card" id="wr-saved">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">YOUR RECORDS</span>
                <h2><FaHistory /> Saved Recommendations</h2>
              </div>
            </div>
            <div className="wr-inline-empty">
              <FaHistory />
              <span>No saved recommendations. Persistent storage has not been implemented.</span>
            </div>
          </section>

          <section className="wr-card" id="wr-faqs">
            <div className="wr-section-heading">
              <div>
                <span className="wr-kicker">HELP & GUIDANCE</span>
                <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
              </div>
            </div>

            {faqs.map((item, index) => (
              <div className="wr-faq" key={item.q}>
                <button
                  type="button"
                  aria-expanded={expandedFaq === index}
                  onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <FaChevronDown className={expandedFaq === index ? "rotated" : ""} />
                </button>
                {expandedFaq === index && <p>{item.a}</p>}
              </div>
            ))}
          </section>

          <footer className="wr-footer">
            <span>KisanVision AI · BAI586 academic mini-project</span>
            <span>Weather: Open-Meteo · Crop recommendations: not yet connected</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
