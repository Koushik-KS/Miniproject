
const CROSSREF_URL = "https://api.crossref.org/works";
const EUROPE_PMC_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const REQUEST_TIMEOUT = 12000;
const MAX_RETRIES = 3;
const MAX_RESULTS_PER_SOURCE = 15;

const SEARCH_CONFIG = {
  Cercospora: {
    terms: [
      "coffee Cercospora coffeicola",
      "Coffea Cercospora leaf spot",
    ],
    patterns: [/\bcercospora\b/i, /\bmycosphaerella\b/i],
  },
  "Leaf Rust": {
    terms: [
      "coffee leaf rust Hemileia vastatrix",
      "Coffea rust disease",
    ],
    patterns: [
      /\bhemileia\s+vastatrix\b/i,
      /\bcoffee\s+leaf\s+rust\b/i,
      /\bcoffee\s+rust\b/i,
    ],
  },
  Miner: {
    terms: [
      "coffee leaf miner Leucoptera coffeella",
      "Coffea leaf miner pest",
    ],
    patterns: [
      /\bleucoptera\s+coffeella\b/i,
      /\bcoffee\s+leaf\s+miner\b/i,
      /\bcoffee\s+miner\b/i,
    ],
  },
  Phoma: {
    terms: [
      "coffee Phoma disease",
      "Coffea Phoma leaf disease",
    ],
    patterns: [/\bphoma\b/i, /\bphoma\s+costarricensis\b/i],
  },
};

const VALID_CLASSES = [...Object.keys(SEARCH_CONFIG), "Healthy"];

const KNOWN_PUBLICATION_OVERRIDES = {
  "10.12688/f1000research.177569.2": {
    evidenceType: "Published journal article",
    publicationTypeLabel:
      "Published journal article — publisher record",
    publicationStatus: "Published",
    evidenceTypeSource:
      "Publisher-specific DOI override; provider metadata also retained",
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeSpaces(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanText(value = "") {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean).join(" ");
  }

  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  return normalizeSpaces(
    String(value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(
        /&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:39|x27);/gi,
        (entity) => {
          const key = entity.toLowerCase();
          return key === "&#x27;" ? "'" : entities[key] ?? entity;
        }
      )
      .replace(/&(?:#\d+|#x[0-9a-f]+);/gi, " ")
  );
}

function normalizeForComparison(value = "") {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeDoi(value = "") {
  return String(value)
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[.,;]+$/, "")
    .toLowerCase();
}

function doiUrl(doi = "") {
  const normalized = normalizeDoi(doi);
  return normalized ? `https://doi.org/${normalized}` : "";
}

function getCrossrefType(item = {}) {
  return cleanText(item.type || "unknown");
}

function getEuropePmcType(item = {}) {
  const types = item?.pubTypeList?.pubType;

  if (Array.isArray(types)) {
    return types.map(cleanText).filter(Boolean).join(", ");
  }

  if (types) {
    return cleanText(types);
  }

  return cleanText(item?.publicationType || "unknown");
}

function getPublicationTypeLabel(publicationType = "") {
  const type = normalizeForComparison(publicationType);

  if (type.includes("preprint") || type.includes("posted content")) {
    return "Preprint / posted content";
  }
  if (type.includes("dissertation") || type.includes("thesis")) {
    return "Dissertation / thesis";
  }
  if (type.includes("review")) {
    return "Review article";
  }
  if (
    type.includes("proceedings article") ||
    type.includes("conference paper") ||
    type.includes("conference proceedings")
  ) {
    return "Conference proceedings article";
  }
  if (type.includes("book chapter")) {
    return "Book chapter";
  }
  if (type.includes("book")) {
    return "Book";
  }
  if (
    type.includes("journal article") ||
    type.includes("research article") ||
    type.includes("original article")
  ) {
    return "Journal article";
  }
  if (type.includes("report")) {
    return "Report";
  }
  if (type.includes("dataset")) {
    return "Dataset";
  }
  if (type.includes("article")) {
    return "Article; subtype unclear";
  }

  return "Publication type unclear";
}

function getEvidenceMetadata(publicationType = "", abstract = "") {
  const type = normalizeForComparison(publicationType);
  const abstractAvailable = Boolean(normalizeSpaces(abstract));

  let evidenceType = "Publication type unclear";

  if (type.includes("preprint") || type.includes("posted content")) {
    evidenceType = "Preprint";
  } else if (
    type.includes("dissertation") ||
    type.includes("thesis")
  ) {
    evidenceType = "Thesis or dissertation";
  } else if (type.includes("review")) {
    evidenceType = "Review";
  } else if (
    type.includes("journal article") ||
    type.includes("research article") ||
    type.includes("original article")
  ) {
    evidenceType = "Journal article";
  } else if (type.includes("book chapter")) {
    evidenceType = "Book chapter";
  } else if (
    type.includes("proceedings") ||
    type.includes("conference paper")
  ) {
    evidenceType = "Conference proceedings";
  } else if (type.includes("article")) {
    evidenceType = "Article; subtype unclear";
  } else if (type.includes("report")) {
    evidenceType = "Report";
  } else if (type.includes("book")) {
    evidenceType = "Book";
  } else if (type.includes("dataset")) {
    evidenceType = "Dataset";
  }

  return {
    evidenceType,
    evidenceTypeSource: "Provider-reported publication metadata",
    publicationStatus: "Not independently verified",
    abstractAvailable,
    evidenceNote: abstractAvailable
      ? "An abstract is available. Publication type and abstract availability do not independently establish study quality or treatment effectiveness."
      : "No abstract is available in the retrieved record. The study's findings cannot be fully assessed because no abstract is available.",
  };
}

function applyPublicationOverride(record) {
  const doi = normalizeDoi(record.doi);
  const override = KNOWN_PUBLICATION_OVERRIDES[doi];

  if (!override) {
    return record;
  }

  return {
    ...record,
    ...override,
    providerPublicationType:
      record.providerPublicationType || record.publicationType,
    providerPublicationTypeLabel:
      record.providerPublicationTypeLabel || record.publicationTypeLabel,
    evidenceNote:
      `${record.evidenceNote} The publication label is supplemented by a DOI-specific publisher-record override; consult the publisher page for the current version and review history.`,
  };
}

function getAuthorsCrossref(item = {}) {
  return (item.author || [])
    .map((author) =>
      normalizeSpaces(
        `${cleanText(author.given || "")} ${cleanText(author.family || "")}`
      )
    )
    .filter(Boolean);
}

function getAuthorsEuropePmc(item = {}) {
  if (!item.authorString) {
    return [];
  }

  return String(item.authorString)
    .split(/,\s*/)
    .map(cleanText)
    .filter(Boolean);
}

function getCrossrefDate(item = {}) {
  const dateParts =
    item.published?.["date-parts"]?.[0] ||
    item["published-print"]?.["date-parts"]?.[0] ||
    item["published-online"]?.["date-parts"]?.[0] ||
    item.created?.["date-parts"]?.[0] ||
    [];

  const [year, month, day] = dateParts;

  if (!year) {
    return { year: null, publicationDate: "" };
  }

  return {
    year: Number(year),
    publicationDate: [
      String(year),
      month ? String(month).padStart(2, "0") : null,
      day ? String(day).padStart(2, "0") : null,
    ]
      .filter(Boolean)
      .join("-"),
  };
}

function getEuropePmcDate(item = {}) {
  const date =
    item.firstPublicationDate ||
    item.dateOfCreation ||
    item.dateOfRevision ||
    item.pubYear ||
    "";

  const match = String(date).match(
    /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/
  );

  if (!match) {
    return {
      year: item.pubYear ? Number(item.pubYear) : null,
      publicationDate: "",
    };
  }

  return {
    year: Number(match[1]),
    publicationDate: [match[1], match[2], match[3]]
      .filter(Boolean)
      .join("-"),
  };
}

function getDiseaseClass(record, diseaseClass) {
  const title = cleanText(record.title || "");
  const abstract = cleanText(record.abstract || "");
  const keywords = cleanText(record.keywords || "");
  const text = `${title} ${abstract} ${keywords}`;
  const normalizedText = normalizeForComparison(text);

  if (!/\bcoffee\b|\bcoffea\b/i.test(text)) {
    return false;
  }

  const config = SEARCH_CONFIG[diseaseClass];

  if (!config) {
    return false;
  }

  const diseaseMention = config.patterns.some((pattern) =>
    pattern.test(text)
  );

  if (!diseaseMention) {
    return false;
  }

  const titleMatches = config.patterns.some((pattern) =>
    pattern.test(title)
  );

  const abstractMatches = config.patterns.some((pattern) =>
    pattern.test(`${abstract} ${keywords}`)
  );

  if (!titleMatches && !abstractMatches) {
    return false;
  }

  if (
    diseaseClass === "Miner" &&
    !(
      /\bleucoptera\s+coffeella\b/i.test(text) ||
      /\bcoffee\s+leaf\s+miner\b/i.test(text) ||
      /\bcoffee\s+miner\b/i.test(text)
    )
  ) {
    return false;
  }

  return Boolean(normalizedText);
}

function calculateRelevance(record, diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  if (!config) {
    return { relevanceScore: 0, relevanceLevel: "Low relevance" };
  }

  const title = normalizeForComparison(record.title || "");
  const abstract = normalizeForComparison(record.abstract || "");
  const keywords = normalizeForComparison(
    Array.isArray(record.keywords)
      ? record.keywords.join(" ")
      : record.keywords || ""
  );

  let score = 0;

  for (const pattern of config.patterns) {
    if (pattern.test(record.title || "")) score += 5;
    if (pattern.test(record.abstract || "")) score += 3;

    if (
      pattern.test(
        Array.isArray(record.keywords)
          ? record.keywords.join(" ")
          : record.keywords || ""
      )
    ) {
      score += 2;
    }
  }

  if (/\bcoffee\b|\bcoffea\b/.test(title)) score += 3;
  if (/\bcoffee\b|\bcoffea\b/.test(abstract)) score += 2;
  if (/\bcoffee\b|\bcoffea\b/.test(keywords)) score += 1;

  return {
    relevanceScore: score,
    relevanceLevel:
      score >= 8
        ? "High relevance"
        : score >= 4
          ? "Relevant research"
          : "Low relevance",
  };
}

function normalizeCrossref(item, diseaseClass) {
  const title = cleanText(item.title?.[0] || "");
  const abstract = cleanText(item.abstract || "");
  const publicationType = getCrossrefType(item);
  const doi = normalizeDoi(item.DOI || "");
  const date = getCrossrefDate(item);
  const url = doiUrl(doi) || item.URL || "";
  const authors = getAuthorsCrossref(item);
  const journal = cleanText(item["container-title"]?.[0] || "");
  const keywords = Array.isArray(item.subject)
    ? item.subject.map(cleanText).filter(Boolean)
    : [];

  const record = {
    title,
    authors,
    year: date.year,
    publicationDate: date.publicationDate,
    journal,
    publicationType,
    publicationTypeLabel: getPublicationTypeLabel(publicationType),
    ...getEvidenceMetadata(publicationType, abstract),
    source: "Crossref",
    doi,
    url,
    abstract,
    keywords,
    diseaseClass,
  };

  const verifiedRecord = applyPublicationOverride(record);

  return {
    ...verifiedRecord,
    ...calculateRelevance(verifiedRecord, diseaseClass),
  };
}

function normalizeEuropePmc(item, diseaseClass) {
  const title = cleanText(item.title || "");
  const abstract = cleanText(item.abstractText || "");
  const publicationType = getEuropePmcType(item);
  const doi = normalizeDoi(item.doi || "");
  const date = getEuropePmcDate(item);

  const journal = cleanText(
    item?.journalInfo?.journal?.title || item?.journalTitle || ""
  );

  const url =
    doiUrl(doi) ||
    (item.pmid
      ? `https://europepmc.org/article/MED/${encodeURIComponent(item.pmid)}`
      : item.id
        ? `https://europepmc.org/article/MED/${encodeURIComponent(item.id)}`
        : "");

  const keywords = Array.isArray(item.keywordList?.keyword)
    ? item.keywordList.keyword
        .map((keyword) =>
          typeof keyword === "string"
            ? cleanText(keyword)
            : cleanText(keyword?.keyword || "")
        )
        .filter(Boolean)
    : [];

  const record = {
    title,
    authors: getAuthorsEuropePmc(item),
    year: date.year,
    publicationDate: date.publicationDate,
    journal,
    publicationType,
    publicationTypeLabel: getPublicationTypeLabel(publicationType),
    ...getEvidenceMetadata(publicationType, abstract),
    source: "Europe PMC",
    doi,
    url,
    abstract,
    keywords,
    diseaseClass,
  };

  const verifiedRecord = applyPublicationOverride(record);

  return {
    ...verifiedRecord,
    ...calculateRelevance(verifiedRecord, diseaseClass),
  };
}

function makeRecordKey(record) {
  const doi = normalizeDoi(record.doi);

  if (doi) {
    return `doi:${doi}`;
  }

  const normalizedTitle = normalizeForComparison(record.title || "");

  return normalizedTitle ? `title:${normalizedTitle}` : "";
}

function mergeDuplicateRecords(existing, incoming) {
  const merged = { ...existing, ...incoming };

  if (
    !normalizeSpaces(existing.abstract) &&
    normalizeSpaces(incoming.abstract)
  ) {
    merged.abstract = incoming.abstract;
  } else if (
    normalizeSpaces(existing.abstract) &&
    !normalizeSpaces(incoming.abstract)
  ) {
    merged.abstract = existing.abstract;
  }

  for (const field of [
    "doi",
    "url",
    "journal",
    "publicationDate",
    "year",
  ]) {
    if (existing[field] && !incoming[field]) {
      merged[field] = existing[field];
    }
  }

  if (
    String(existing.title || "").length >
    String(incoming.title || "").length
  ) {
    merged.title = existing.title;
  }

  merged.authors = [
    ...new Set([
      ...(existing.authors || []),
      ...(incoming.authors || []),
    ]),
  ];

  merged.keywords = [
    ...new Set([
      ...(existing.keywords || []),
      ...(incoming.keywords || []),
    ]),
  ];

  const sources = [
    ...(Array.isArray(existing.sources)
      ? existing.sources
      : [existing.source]),
    ...(Array.isArray(incoming.sources)
      ? incoming.sources
      : [incoming.source]),
  ].filter(Boolean);

  merged.sources = [...new Set(sources)];

  merged.relevanceScore = Math.max(
    Number(existing.relevanceScore || 0),
    Number(incoming.relevanceScore || 0)
  );

  merged.relevanceLevel =
    merged.relevanceScore >= 8
      ? "High relevance"
      : merged.relevanceScore >= 4
        ? "Relevant research"
        : "Low relevance";

  return applyPublicationOverride(merged);
}

/**
 * Fetch JSON with retries for temporary network errors and HTTP 429.
 * Respects Retry-After, while limiting an individual wait to 15 seconds.
 */
async function fetchJson(url) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    let response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        headers: {
          Accept: "application/json",
          "User-Agent": "KisanVisionAI/1.0 (crop research service)",
        },
      });
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }

      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429 && attempt < MAX_RETRIES - 1) {
      const retryAfter = response.headers.get("Retry-After");
      let delayMs = 3000 * 2 ** attempt;

      if (retryAfter) {
        const seconds = Number(retryAfter);

        if (Number.isFinite(seconds) && seconds >= 0) {
          delayMs = seconds * 1000;
        } else {
          const retryDate = Date.parse(retryAfter);

          if (!Number.isNaN(retryDate)) {
            delayMs = Math.max(0, retryDate - Date.now());
          }
        }
      }

      delayMs = Math.min(delayMs, 15000);

      console.warn(
        `Research provider returned HTTP 429. Retrying in ${delayMs} ms (attempt ${attempt + 2}/${MAX_RETRIES}).`
      );

      await sleep(delayMs);
      continue;
    }

    throw new Error(
      `Request failed (${response.status} ${response.statusText})`
    );
  }

  throw new Error("Research provider request failed after retries.");
}

async function fetchCrossref(diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  if (!config) {
    return [];
  }

  const query = config.terms.join(" ");
  const url = new URL(CROSSREF_URL);

  url.searchParams.set("query.bibliographic", query);
  url.searchParams.set("rows", String(MAX_RESULTS_PER_SOURCE));
  url.searchParams.set(
    "select",
    [
      "DOI",
      "title",
      "author",
      "published",
      "published-print",
      "published-online",
      "created",
      "type",
      "abstract",
      "container-title",
      "subject",
      "URL",
    ].join(",")
  );

  const data = await fetchJson(url.toString());
  const items = data?.message?.items || [];

  const records = items
    .map((item) => normalizeCrossref(item, diseaseClass))
    .filter(
      (record) =>
        record.title && getDiseaseClass(record, diseaseClass)
    );

  const targetDoi =
    diseaseClass === "Leaf Rust"
      ? "10.12688/f1000research.177569.2"
      : null;

  if (targetDoi) {
    try {
      const directUrl =
        `${CROSSREF_URL}/${encodeURIComponent(targetDoi)}`;

      const doiResponse = await fetchJson(directUrl);
      const item = doiResponse?.message;

      if (item) {
        const record = normalizeCrossref(item, diseaseClass);

        if (
          record.title &&
          getDiseaseClass(record, diseaseClass)
        ) {
          records.push(record);
        }
      }
    } catch (error) {
      console.warn(
        "Direct Crossref DOI lookup failed:",
        error.message
      );
    }
  }

  return records;
}

async function fetchEuropePmc(diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  if (!config) {
    return [];
  }

  const query = config.terms
    .map((term) => `"${term}"`)
    .join(" OR ");

  const url = new URL(EUROPE_PMC_URL);

  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", String(MAX_RESULTS_PER_SOURCE));
  url.searchParams.set("resultType", "core");

  const data = await fetchJson(url.toString());
  const items = data?.resultList?.result || [];

  return items
    .map((item) => normalizeEuropePmc(item, diseaseClass))
    .filter(
      (record) =>
        record.title && getDiseaseClass(record, diseaseClass)
    );
}

function deduplicateRecords(records) {
  const recordMap = new Map();

  for (const record of records) {
    const key = makeRecordKey(record);

    if (!key) {
      continue;
    }

    const existing = recordMap.get(key);

    if (existing) {
      recordMap.set(
        key,
        mergeDuplicateRecords(existing, record)
      );
    } else {
      recordMap.set(key, {
        ...record,
        sources: [record.source].filter(Boolean),
      });
    }
  }

  return [...recordMap.values()];
}

function sortResearchRecords(records) {
  return records.sort((a, b) => {
    const scoreDifference =
      Number(b.relevanceScore || 0) -
      Number(a.relevanceScore || 0);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const dateA = Date.parse(a.publicationDate || "") || 0;
    const dateB = Date.parse(b.publicationDate || "") || 0;

    return dateB - dateA;
  });
}

export async function getCoffeeResearch(diseaseClass) {
  const requestedClass = cleanText(diseaseClass);

  const matchedClass = VALID_CLASSES.find(
    (item) =>
      normalizeForComparison(item) ===
      normalizeForComparison(requestedClass)
  );

  if (normalizeForComparison(requestedClass) === "healthy") {
    return {
      success: true,
      diseaseClass: "Healthy",
      totalResults: 0,
      results: [],
      sources: [],
      errors: [],
      message:
        "Healthy is a prediction class, not a disease. Disease-specific research is not applicable.",
    };
  }

  if (!matchedClass) {
    return {
      success: false,
      diseaseClass: requestedClass,
      totalResults: 0,
      results: [],
      sources: [],
      errors: [],
      message:
        `Unsupported coffee disease class. Supported classes: ${VALID_CLASSES.join(", ")}.`,
    };
  }

  const [crossrefResult, europePmcResult] =
    await Promise.allSettled([
      fetchCrossref(matchedClass),
      fetchEuropePmc(matchedClass),
    ]);

  const crossrefRecords =
    crossrefResult.status === "fulfilled"
      ? crossrefResult.value
      : [];

  const europePmcRecords =
    europePmcResult.status === "fulfilled"
      ? europePmcResult.value
      : [];

  const errors = [];

  if (crossrefResult.status === "rejected") {
    errors.push({
      source: "Crossref",
      message:
        crossrefResult.reason?.message ||
        "Crossref request failed",
    });
  }

  if (europePmcResult.status === "rejected") {
    errors.push({
      source: "Europe PMC",
      message:
        europePmcResult.reason?.message ||
        "Europe PMC request failed",
    });
  }

  const results = sortResearchRecords(
    deduplicateRecords([
      ...crossrefRecords,
      ...europePmcRecords,
    ])
  );

  const successfulSources = [];

  if (crossrefResult.status === "fulfilled") {
    successfulSources.push("Crossref");
  }

  if (europePmcResult.status === "fulfilled") {
    successfulSources.push("Europe PMC");
  }

  return {
    success: successfulSources.length > 0,
    diseaseClass: matchedClass,
    totalResults: results.length,
    sources: successfulSources,
    results,
    errors,
    message: results.length
      ? "Research results retrieved. Publication metadata and relevance labels are discovery aids, not proof of treatment effectiveness."
      : successfulSources.length
        ? "No matching research records were found for this class."
        : "Research providers could not be reached. Try again later.",
  };
}

export default {
  getCoffeeResearch,
};
