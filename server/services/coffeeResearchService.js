
const CROSSREF_URL = "https://api.crossref.org/works";
const EUROPE_PMC_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const SEARCH_CONFIG = {
  Cercospora: {
    query: '"coffee" Cercospora',
    terms: ["cercospora", "cercospora coffeicola"],
  },
  "Leaf Rust": {
    query: '"coffee" "leaf rust"',
    terms: ["leaf rust", "coffee rust", "hemileia vastatrix"],
  },
  Miner: {
    query: '"coffee" "coffee leaf miner"',
    terms: ["coffee leaf miner", "leucoptera coffeella"],
  },
  Phoma: {
    query: '"coffee" Phoma',
    terms: ["phoma", "phoma tarda", "phoma costarricensis"],
  },
};

const REQUEST_TIMEOUT_MS = 12000;
const MAX_RESULTS_PER_SOURCE = 15;

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPublicationYear(item) {
  const dateParts =
    item?.published?.["date-parts"]?.[0] ||
    item?.["published-print"]?.["date-parts"]?.[0] ||
    item?.["published-online"]?.["date-parts"]?.[0] ||
    item?.issued?.["date-parts"]?.[0];

  const year = dateParts?.[0];

  return Number.isInteger(year) ? year : null;
}

function getCrossrefDate(item) {
  const parts =
    item?.published?.["date-parts"]?.[0] ||
    item?.["published-print"]?.["date-parts"]?.[0] ||
    item?.["published-online"]?.["date-parts"]?.[0] ||
    item?.issued?.["date-parts"]?.[0];

  if (!parts?.[0]) return null;

  const [year, month = 1, day = 1] = parts;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getEuropePmcDate(item) {
  const date = item?.firstPublicationDate || item?.pubYear;

  if (!date) return null;

  return /^\d{4}$/.test(String(date))
    ? `${date}-01-01`
    : String(date).slice(0, 10);
}

function isRelevant(item, config) {
  const text = [
    item.title,
    item.abstract,
    item.journal,
    item.keywords?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const mentionsCoffee =
    /\bcoffee\b|\bcoffea\b/.test(text);

  const mentionsTarget = config.terms.some((term) =>
    text.includes(term.toLowerCase())
  );

  return mentionsCoffee && mentionsTarget;
}

function normalizeCrossref(item, config) {
  const title = cleanText(item.title?.[0] || "");

  const authors = (item.author || [])
    .slice(0, 5)
    .map((author) =>
      cleanText(
        [author.given, author.family].filter(Boolean).join(" ")
      )
    )
    .filter(Boolean);

  const doi = item.DOI || null;

  const url =
    doi && /^[\w.]+\/.+/.test(doi)
      ? `https://doi.org/${encodeURIComponent(doi)}`
      : item.URL || null;

  return {
    title,
    authors,
    year: getPublicationYear(item),
    publicationDate: getCrossrefDate(item),
    journal: cleanText(item["container-title"]?.[0] || ""),
    source: "Crossref",
    doi,
    url,
    abstract: cleanText(item.abstract || ""),
    diseaseClass: config.diseaseClass,
  };
}

function normalizeEuropePmc(item, config) {
  const title = cleanText(item.title || "");
  const doi = item.doi || null;

  let url = null;

  if (item.pmid) {
    url = `https://europepmc.org/article/MED/${encodeURIComponent(item.pmid)}`;
  } else if (item.pmcid) {
    url = `https://europepmc.org/article/PMC/${encodeURIComponent(item.pmcid)}`;
  } else if (doi) {
    url = `https://doi.org/${encodeURIComponent(doi)}`;
  }

  return {
    title,
    authors: [],
    year: Number(item.pubYear) || null,
    publicationDate: getEuropePmcDate(item),
    journal: cleanText(item.journalTitle || ""),
    source: "Europe PMC",
    doi,
    url,
    abstract: cleanText(item.abstractText || ""),
    diseaseClass: config.diseaseClass,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "KisanVisionAI/1.0 (coffee research lookup)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Research provider returned HTTP ${response.status}`);
  }

  return response.json();
}

async function searchCrossref(config) {
  const url = new URL(CROSSREF_URL);

  url.searchParams.set("query.bibliographic", config.query);
  url.searchParams.set("rows", String(MAX_RESULTS_PER_SOURCE));
  url.searchParams.set("select", "DOI,title,author,published,published-print,published-online,issued,container-title,URL,abstract,type");

  const data = await fetchJson(url);

  return (data?.message?.items || [])
    .map((item) => normalizeCrossref(item, config))
    .filter((item) => item.title && item.url && isRelevant(item, config));
}

async function searchEuropePmc(config) {
  const url = new URL(EUROPE_PMC_URL);

  url.searchParams.set(
    "query",
    `TITLE_ABS:(${config.query}) AND OPEN_ACCESS:Y`
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", String(MAX_RESULTS_PER_SOURCE));
  url.searchParams.set(
    "resultType",
    "core"
  );

  const data = await fetchJson(url);

  return (data?.resultList?.result || [])
    .map((item) => normalizeEuropePmc(item, config))
    .filter((item) => item.title && item.url && isRelevant(item, config));
}

function deduplicate(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = (
      item.doi ||
      item.title
    )
      .toLowerCase()
      .trim();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export async function getCoffeeResearch(diseaseClass) {
  if (diseaseClass === "Healthy") {
    return {
      diseaseClass,
      results: [],
      sources: [],
      message:
        "Healthy is a prediction class, not a disease. Disease-specific research is not applicable.",
    };
  }

  const selectedConfig = SEARCH_CONFIG[diseaseClass];

  if (!selectedConfig) {
    const error = new Error("Unsupported coffee prediction class.");
    error.statusCode = 400;
    throw error;
  }

  const config = {
    ...selectedConfig,
    diseaseClass,
  };

  const [crossrefResult, europePmcResult] = await Promise.allSettled([
    searchCrossref(config),
    searchEuropePmc(config),
  ]);

  const results = [];

  if (crossrefResult.status === "fulfilled") {
    results.push(...crossrefResult.value);
  }

  if (europePmcResult.status === "fulfilled") {
    results.push(...europePmcResult.value);
  }

  const uniqueResults = deduplicate(results).sort(
    (a, b) => (b.year || 0) - (a.year || 0)
  );

  const sourcesAvailable = [];

  if (crossrefResult.status === "fulfilled") {
    sourcesAvailable.push("Crossref");
  }

  if (europePmcResult.status === "fulfilled") {
    sourcesAvailable.push("Europe PMC");
  }

  return {
    diseaseClass,
    results: uniqueResults,
    sources: sourcesAvailable,
    message:
      sourcesAvailable.length === 0
        ? "Research providers are temporarily unavailable. Please try again later."
        : uniqueResults.length === 0
          ? "No sufficiently relevant publications were found for this class. No placeholder research has been added."
          : null,
  };
}
