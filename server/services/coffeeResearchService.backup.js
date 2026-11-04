
const CROSSREF_URL = "https://api.crossref.org/works";
const EUROPE_PMC_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const REQUEST_TIMEOUT = 12000;
const MAX_RESULTS_PER_SOURCE = 15;

const SEARCH_CONFIG = {
  Cercospora: {
    terms: [
      "coffee Cercospora coffeicola",
      "Coffea Cercospora leaf spot",
    ],
    patterns: [
      /\bcercospora\b/i,
      /\bmycosphaerella\b/i,
    ],
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
    patterns: [
      /\bphoma\b/i,
      /\bphoma\s+costarricensis\b/i,
    ],
  },
};

const VALID_CLASSES = Object.keys(SEARCH_CONFIG);

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

function normalizeSpaces(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value = "") {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean).join(" ");
  }

  let text = String(value ?? "");

  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  text = text.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:39|x27);/gi,
    (entity) => {
      const key = entity.toLowerCase();

      if (key === "&#39;" || key === "&#x27;") {
        return "'";
      }

      return entities[key] ?? entity;
    }
  );

  return normalizeSpaces(
    text
      .replace(/<[^>]*>/g, " ")
      .replace(/<\/?jats:[^>]*>/gi, " ")
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

  return normalized
    ? `https://doi.org/${normalized}`
    : "";
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

  if (
    type.includes("preprint") ||
    type.includes("posted content")
  ) {
    return "Preprint / posted content";
  }

  if (
    type.includes("dissertation") ||
    type.includes("thesis")
  ) {
    return "Dissertation / thesis";
  }

  if (
    type.includes("review article") ||
    type.includes("review article") ||
    type === "review" ||
    type.includes("review article")
  ) {
    return "Review article";
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
  const normalizedType =
    normalizeForComparison(publicationType);

  const abstractAvailable = Boolean(
    normalizeSpaces(abstract)
  );

  let evidenceType = "Publication type unclear";

  if (
    normalizedType.includes("preprint") ||
    normalizedType.includes("posted content")
  ) {
    evidenceType = "Preprint";
  } else if (
    normalizedType.includes("dissertation") ||
    normalizedType.includes("thesis")
  ) {
    evidenceType = "Thesis or dissertation";
  } else if (normalizedType.includes("review")) {
    evidenceType = "Review";
  } else if (
    normalizedType.includes("journal article") ||
    normalizedType.includes("research article") ||
    normalizedType.includes("original article")
  ) {
    evidenceType = "Journal article";
  } else if (normalizedType.includes("book chapter")) {
    evidenceType = "Book chapter";
  } else if (
    normalizedType.includes("proceedings") ||
    normalizedType.includes("conference paper")
  ) {
    evidenceType = "Conference proceedings";
  } else if (normalizedType.includes("article")) {
    evidenceType = "Article; subtype unclear";
  } else if (normalizedType.includes("report")) {
    evidenceType = "Report";
  } else if (normalizedType.includes("book")) {
    evidenceType = "Book";
  } else if (normalizedType.includes("dataset")) {
    evidenceType = "Dataset";
  }

  return {
    evidenceType,
    evidenceTypeSource: "Provider-reported publication metadata",
    publicationStatus: "Not independently verified",
    abstractAvailable,
    evidenceNote: abstractAvailable
      ? "An abstract is available. Publication type and abstract availability do not independently establish study quality or treatment effectiveness."
      : "No abstract is available in the retrieved record. The study's findings cannot be fully assessed from the abstract.",
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
    providerPublicationType: record.publicationType,
    providerPublicationTypeLabel: record.publicationTypeLabel,
    evidenceNote:
      `${record.evidenceNote} The publication label is supplemented by a DOI-specific publisher-record override; consult the publisher page for the current version and review history.`,
  };
}

function getAuthorsCrossref(item = {}) {
  return (item.author || [])
    .map((author) => {
      const given = cleanText(author.given || "");
      const family = cleanText(author.family || "");

      return normalizeSpaces(`${given} ${family}`);
    })
    .filter(Boolean);
}

function getAuthorsEuropePmc(item = {}) {
  const authorString = item.authorString;

  if (authorString) {
    return String(authorString)
      .split(/,\s*(?![^()]*\))/)
      .map(cleanText)
      .filter(Boolean);
  }

  return [];
}

function getCrossrefDate(item = {}) {
  const dateParts =
    item.published?.["date-parts"]?.[0] ||
    item["published-print"]?.["date-parts"]?.[0] ||
    item["published-online"]?.["date-parts"]?.[0] ||
    item.created?.["date-parts"]?.[0] ||
    [];

  const year = dateParts[0] || null;
  const month = dateParts[1] || null;
  const day = dateParts[2] || null;

  if (!year) {
    return {
      year: null,
      publicationDate: "",
    };
  }

  const publicationDate = [
    String(year),
    month ? String(month).padStart(2, "0") : null,
    day ? String(day).padStart(2, "0") : null,
  ]
    .filter(Boolean)
    .join("-");

  return {
    year: Number(year),
    publicationDate,
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
      year: item.pubYear
        ? Number(item.pubYear)
        : null,
      publicationDate: "",
    };
  }

  return {
    year: Number(match[1]),
    publicationDate: [
      match[1],
      match[2],
      match[3],
    ]
      .filter(Boolean)
      .join("-"),
  };
}

function getDiseaseClass(record, diseaseClass) {
  const title = cleanText(record.title || "");
  const abstract = cleanText(record.abstract || "");
  const keywords = cleanText(
    Array.isArray(record.keywords)
      ? record.keywords.join(" ")
      : record.keywords || ""
  );

  const text = `${title} ${abstract} ${keywords}`;
  const normalizedText = normalizeForComparison(text);

  // Do not classify general plant research as disease-specific.
  const coffeeMention =
    /\bcoffee\b/i.test(text) ||
    /\bcoffea\b/i.test(text) ||
    /\bcoffea arabica\b/i.test(text) ||
    /\bcoffea canephora\b/i.test(text);

  if (!coffeeMention) {
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

  // Require disease relevance in the title or in a meaningful
  // part of the abstract/keywords.
  const titleMatches = config.patterns.some((pattern) =>
    pattern.test(title)
  );

  const abstractMatches = config.patterns.some((pattern) =>
    pattern.test(`${abstract} ${keywords}`)
  );

  if (!titleMatches && !abstractMatches) {
    return false;
  }

  // "Miner" alone is too ambiguous. The specific pest or
  // coffee leaf-miner wording is required by SEARCH_CONFIG.
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

  // Keep normalizedText available for consistent text checks.
  return Boolean(normalizedText);
}

function calculateRelevance(record, diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  if (!config) {
    return {
      relevanceScore: 0,
      relevanceLevel: "Low relevance",
    };
  }

  const title = normalizeForComparison(record.title || "");
  const abstract = normalizeForComparison(
    record.abstract || ""
  );
  const keywords = normalizeForComparison(
    Array.isArray(record.keywords)
      ? record.keywords.join(" ")
      : record.keywords || ""
  );

  let score = 0;

  for (const pattern of config.patterns) {
    if (pattern.test(record.title || "")) {
      score += 5;
    }

    if (pattern.test(record.abstract || "")) {
      score += 3;
    }

    if (pattern.test(
      Array.isArray(record.keywords)
        ? record.keywords.join(" ")
        : record.keywords || ""
    )) {
      score += 2;
    }
  }

  if (/\bcoffee\b|\bcoffea\b/.test(title)) {
    score += 3;
  }

  if (/\bcoffee\b|\bcoffea\b/.test(abstract)) {
    score += 2;
  }

  if (/\bcoffee\b|\bcoffea\b/.test(keywords)) {
    score += 1;
  }

  let relevanceLevel = "Low relevance";

  if (score >= 8) {
    relevanceLevel = "High relevance";
  } else if (score >= 4) {
    relevanceLevel = "Relevant research";
  }

  return {
    relevanceScore: score,
    relevanceLevel,
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

  const journal =
    cleanText(item["container-title"]?.[0] || "");

  const keywords = Array.isArray(item.subject)
    ? item.subject.map(cleanText).filter(Boolean)
    : [];

  const metadata = getEvidenceMetadata(
    publicationType,
    abstract
  );

  const record = {
    title,
    authors,
    year: date.year,
    publicationDate: date.publicationDate,
    journal,
    publicationType,
    publicationTypeLabel:
      getPublicationTypeLabel(publicationType),
    ...metadata,
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
    item?.journalInfo?.journal?.title ||
    item?.journalTitle ||
    ""
  );

  const url =
    doiUrl(doi) ||
    (
      item.pmid
        ? `https://europepmc.org/article/MED/${item.pmid}`
        : item.id
          ? `https://europepmc.org/article/MED/${item.id}`
          : ""
    );

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
    publicationTypeLabel:
      getPublicationTypeLabel(publicationType),
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

  const normalizedTitle = normalizeForComparison(
    record.title || ""
  );

  if (normalizedTitle) {
    return `title:${normalizedTitle}`;
  }

  return "";
}

function mergeDuplicateRecords(existing, incoming) {
  const merged = {
    ...existing,
    ...incoming,
  };

  // Prefer an available abstract over an empty one.
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

  // Preserve useful metadata if one provider omits it.
  for (const field of [
    "doi",
    "url",
    "journal",
    "publicationDate",
    "year",
  ]) {
    if (
      existing[field] &&
      !incoming[field]
    ) {
      merged[field] = existing[field];
    }
  }

  // Retain the more informative title.
  if (
    String(existing.title || "").length >
    String(incoming.title || "").length
  ) {
    merged.title = existing.title;
  }

  // Keep source provenance for both records.
  const sources = [
    ...(Array.isArray(existing.sources)
      ? existing.sources
      : [existing.source]),
    ...(Array.isArray(incoming.sources)
      ? incoming.sources
      : [incoming.source]),
  ].filter(Boolean);

  merged.sources = [...new Set(sources)];

  // Preserve the highest relevance score.
  merged.relevanceScore = Math.max(
    Number(existing.relevanceScore || 0),
    Number(incoming.relevanceScore || 0)
  );

  if (
    merged.relevanceScore >= 8
  ) {
    merged.relevanceLevel = "High relevance";
  } else if (
    merged.relevanceScore >= 4
  ) {
    merged.relevanceLevel = "Relevant research";
  } else {
    merged.relevanceLevel = "Low relevance";
  }

  // Reapply DOI-specific metadata after merging provider data.
  return applyPublicationOverride(merged);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    headers: {
      Accept: "application/json",
      "User-Agent": "KisanVisionAI/1.0 (crop research service)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status} ${response.statusText})`
    );
  }

  return response.json();
}

async function fetchCrossref(diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  const query = config.terms.join(" ");

  const url = new URL(CROSSREF_URL);

  url.searchParams.set("query.bibliographic", query);
  url.searchParams.set("rows", String(MAX_RESULTS_PER_SOURCE));
  url.searchParams.set("select", [
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
  ].join(","));

  const data = await fetchJson(url.toString());

  const items = data?.message?.items || [];

  return items
    .map((item) => normalizeCrossref(item, diseaseClass))
    .filter((record) =>
      record.title &&
      getDiseaseClass(record, diseaseClass)
    );
}

async function fetchEuropePmc(diseaseClass) {
  const config = SEARCH_CONFIG[diseaseClass];

  const query = config.terms
    .map((term) => `"${term}"`)
    .join(" OR ");

  const url = new URL(EUROPE_PMC_URL);

  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set(
    "pageSize",
    String(MAX_RESULTS_PER_SOURCE)
  );
  url.searchParams.set("resultType", "core");

  const data = await fetchJson(url.toString());

  const items = data?.resultList?.result || [];

  return items
    .map((item) => normalizeEuropePmc(item, diseaseClass))
    .filter((record) =>
      record.title &&
      getDiseaseClass(record, diseaseClass)
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

    const dateA = Date.parse(
      a.publicationDate || ""
    ) || 0;

    const dateB = Date.parse(
      b.publicationDate || ""
    ) || 0;

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

  if (
    normalizeForComparison(requestedClass) === "healthy"
  ) {
    return {
      success: true,
      diseaseClass: "Healthy",
      results: [],
      sources: [],
      message:
        "Healthy is a prediction class, not a disease. Disease-specific research is not applicable.",
    };
  }

  if (!matchedClass) {
    return {
      success: false,
      diseaseClass: requestedClass,
      results: [],
      sources: [],
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
      message: crossrefResult.reason?.message ||
        "Crossref request failed",
    });
  }

  if (europePmcResult.status === "rejected") {
    errors.push({
      source: "Europe PMC",
      message: europePmcResult.reason?.message ||
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
      ? "Research results retrieved. Publication metadata and relevance labels should be interpreted as discovery aids, not proof of treatment effectiveness."
      : successfulSources.length
        ? "No matching research records were found for this class."
        : "Research providers could not be reached. Try again later.",
  };
}

export default {
  getCoffeeResearch,
};
