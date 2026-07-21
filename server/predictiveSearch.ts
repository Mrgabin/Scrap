import { Track } from "../src/types";

export interface TrackProfile {
  genre: "rap" | "pop" | "electro" | "rock" | "lofi";
  language: "fr" | "en";
  rhythm: "fast" | "medium" | "slow";
  era: "2020s" | "2010s" | "2000s" | "classic";
  artist: string;
}

// Port of French classification rules for affinity matching
const FRENCH_KEYWORDS = [
  "le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "que", "pour", "dans", "avec", 
  "sur", "qui", "par", "aux", "au", "vie", "qu'on", "mène", "tchikita", "lettre", "femme", 
  "feu", "bois", "verra", "balance", "grenade", "alors", "danse", "papaoutai", "allemand", 
  "monde", "amour", "triste", "nuit", "soleil", "cœur", "coeur", "temps", "toujours", 
  "comme", "sans", "tout", "tous", "moi", "toi", "nous", "vous", "elle", "ils", "elles", 
  "femtogo", "boulevard", "chercheur", "fantôme", "mélodie"
];

const FRENCH_ARTISTS = [
  "sdm", "ninho", "gazo", "tiakola", "werenoi", "plk", "damso", "nekfeu", "booba", "sch", "pnl", 
  "orelsan", "lomepal", "soprano", "aya nakamura", "stromae", "angèle", "angele", "clara luciani", 
  "gims", "heuss", "jul", "koba", "femtogo", "dadju", "tayc", "franglish", "hamza"
];

// Server-side analyzer for profiling candidates
export function analyzeTrackMetadataServer(title: string, artist: string): TrackProfile {
  const cleanTitle = (title || "").toLowerCase().trim();
  const cleanArtist = (artist || "").toLowerCase().trim();
  const combined = `${cleanTitle} ${cleanArtist}`;

  let language: "fr" | "en" = "en";
  const hasFrenchArtist = FRENCH_ARTISTS.some(fa => cleanArtist.includes(fa));
  const hasFrenchTitleWord = FRENCH_KEYWORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(cleanTitle);
  });
  if (hasFrenchArtist || hasFrenchTitleWord) {
    language = "fr";
  }

  let genre: "rap" | "pop" | "electro" | "rock" | "lofi" = "pop";

  const rapKeywords = [
    "jul", "ninho", "gazo", "tiakola", "werenoi", "plk", "damso", "nekfeu", "booba", "sch", "pnl", 
    "orelsan", "lomepal", "soprano", "aya nakamura", "eminem", "drake", "juice wrld", "50 cent", 
    "central cee", "travis scott", "gunna", "sdm", "rap", "hip-hop", "hip hop", "trap", "freestyle", 
    "koba", "heuss", "gims", "fe!n", "moulaga", "meuda", "bolide", "laboratoire"
  ];
  
  const electroKeywords = [
    "daft punk", "stromae", "david guetta", "peggy gou", "fred again", "calvin harris", "kavinsky", 
    "dj snake", "shouse", "electro", "techno", "house", "edm", "dance", "ofenbach", "garrix", 
    "martin garrix", "synth", "remix", "blue", "nightcall", "get lucky", "papaoutai", "alors on danse"
  ];
  
  const rockKeywords = [
    "queen", "nirvana", "ac/dc", "coldplay", "imagine dragons", "guns n' roses", "linkin park", 
    "arctic monkeys", "måneskin", "radiohead", "red hot", "chili peppers", "rock", "metal", 
    "grunge", "indie", "alternative", "believer", "creep", "viva la vida", "smells like", "emptiness"
  ];
  
  const lofiKeywords = [
    "lofi", "chill", "relax", "study", "sleep", "ambient", "jinsang", "nujabes", "saib", 
    "snowman", "lofi girl", "rainy", "tokyo", "dreamscape"
  ];

  if (lofiKeywords.some(kw => combined.includes(kw))) {
    genre = "lofi";
  } else if (rockKeywords.some(kw => combined.includes(kw))) {
    genre = "rock";
  } else if (electroKeywords.some(kw => combined.includes(kw))) {
    genre = "electro";
  } else if (rapKeywords.some(kw => combined.includes(kw))) {
    genre = "rap";
  }

  let rhythm: "fast" | "medium" | "slow" = "medium";
  if (genre === "lofi" || cleanTitle.includes("sleep") || cleanTitle.includes("relax") || cleanTitle.includes("acoustic") || cleanTitle.includes("creep") || cleanTitle.includes("rain")) {
    rhythm = "slow";
  } else if (genre === "electro" || genre === "rap" && (cleanTitle.includes("fe!n") || cleanTitle.includes("bolide") || cleanArtist.includes("gazo") || cleanTitle.includes("moulaga")) || cleanTitle.includes("dance") || cleanTitle.includes("remix")) {
    rhythm = "fast";
  }

  let era: "2020s" | "2010s" | "2000s" | "classic" = "2020s";
  const classicArtists = ["queen", "ac/dc", "guns n' roses", "nirvana", "pink floyd", "led zeppelin", "beatles"];
  const keywords2000s = ["linkin park", "daft punk", "eminem", "radiohead", "creep", "lose yourself", "one more time"];
  const keywords2010s = ["ninho", "damso", "nekfeu", "stromae", "avicii", "david guetta", "calvin harris", "imagine dragons", "coldplay", "blinding lights", "starboy", "papaoutai", "as it was"];

  if (classicArtists.some(ca => cleanArtist.includes(ca))) {
    era = "classic";
  } else if (keywords2000s.some(k => combined.includes(k))) {
    era = "2000s";
  } else if (keywords2010s.some(k => combined.includes(k))) {
    era = "2010s";
  }

  return { genre, language, rhythm, era, artist: artist };
}

// Phase 2: Fuzzy & Phonetics implementation
export function getLevenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2];
}

export function getSimilarityScore(s1: string, s2: string): number {
  const clean1 = s1.toLowerCase().trim();
  const clean2 = s2.toLowerCase().trim();
  if (clean1 === clean2) return 1.0;
  if (clean2.includes(clean1) || clean1.includes(clean2)) {
    return Math.max(clean1.length, clean2.length) > 0 
      ? Math.min(clean1.length, clean2.length) / Math.max(clean1.length, clean2.length) * 0.9 
      : 0.0;
  }
  const maxLen = Math.max(clean1.length, clean2.length);
  if (maxLen === 0) return 1.0;
  const distance = getLevenshteinDistance(clean1, clean2);
  return (maxLen - distance) / maxLen;
}

// Phonetic Encoder tailored for bilingual French and English pronunciations
export function getPhoneticKey(str: string): string {
  let val = str.toLowerCase().trim();
  // Remove accents
  val = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  val = val.replace(/ph/g, "f");
  val = val.replace(/qu/g, "k");
  val = val.replace(/ch/g, "sh");
  val = val.replace(/x/g, "ks");
  val = val.replace(/eau/g, "o");
  val = val.replace(/au/g, "o");
  val = val.replace(/ai/g, "e");
  val = val.replace(/ei/g, "e");
  val = val.replace(/ou/g, "u");
  val = val.replace(/y/g, "i");
  
  let phonetic = "";
  for (let i = 0; i < val.length; i++) {
    const char = val[i];
    const next = val[i + 1] || "";
    if (char === "h") {
      if (i > 0 && val[i - 1] === "s") {
        phonetic += char;
      }
    } else if (char === "c") {
      if (["e", "i", "y"].includes(next)) {
        phonetic += "s";
      } else {
        phonetic += "k";
      }
    } else if (char === "g") {
      if (["e", "i", "y"].includes(next)) {
        phonetic += "j";
      } else {
        phonetic += "g";
      }
    } else {
      phonetic += char;
    }
  }
  
  let collapsed = "";
  for (let i = 0; i < phonetic.length; i++) {
    if (i === 0 || phonetic[i] !== phonetic[i - 1]) {
      collapsed += phonetic[i];
    }
  }
  
  return collapsed;
}

export function phoneticMatch(s1: string, s2: string): boolean {
  const k1 = getPhoneticKey(s1);
  const k2 = getPhoneticKey(s2);
  return k1.includes(k2) || k2.includes(k1);
}

export function wordPrefixMatch(text: string, query: string): boolean {
  const words = text.toLowerCase().split(/[\s\-_',.]+/);
  const q = query.toLowerCase().trim();
  return words.some(w => w.startsWith(q));
}

// Phase 4: Feedback Click Logs Storage
export interface ClickLogEntry {
  trackId: string;
  type: string;
  title: string;
  artistName: string;
  clickCount: number;
}

// In-memory click database map (query -> trackId -> ClickLogEntry)
export const clickLogs: Record<string, Record<string, ClickLogEntry>> = {};

// Warm-up clicks with pre-populated values for instant responsiveness on startup
export function warmUpClicks() {
  const presetQueries = {
    "luc": {
      "fHI8X4OXluQ": { trackId: "fHI8X4OXluQ", type: "Titre", title: "Blinding Lights", artistName: "The Weeknd", clickCount: 15 },
      "0WTrP7SscLs": { trackId: "0WTrP7SscLs", type: "Titre", title: "La Grenade", artistName: "Clara Luciani", clickCount: 42 }
    },
    "strom": {
      "oiKj0Hp8K3Y": { trackId: "oiKj0Hp8K3Y", type: "Titre", title: "Papaoutai", artistName: "Stromae", clickCount: 50 },
      "6S3_N-yXl-0": { trackId: "6S3_N-yXl-0", type: "Titre", title: "Tous Les Mêmes", artistName: "Stromae", clickCount: 22 }
    },
    "week": {
      "fHI8X4OXluQ": { trackId: "fHI8X4OXluQ", type: "Titre", title: "Blinding Lights", artistName: "The Weeknd", clickCount: 38 },
      "4NRXx6U8ABQ": { trackId: "4NRXx6U8ABQ", type: "Titre", title: "Starboy", artistName: "The Weeknd ft. Daft Punk", clickCount: 31 }
    },
    "daft": {
      "h5EofwRzit0": { trackId: "h5EofwRzit0", type: "Titre", title: "Get Lucky", artistName: "Daft Punk ft. Pharrell Williams", clickCount: 45 },
      "FGBhQbmPwH8": { trackId: "FGBhQbmPwH8", type: "Titre", title: "One More Time", artistName: "Daft Punk", clickCount: 20 }
    }
  };

  Object.entries(presetQueries).forEach(([q, items]) => {
    clickLogs[q] = items;
  });
}

warmUpClicks();

export function logClick(query: string, trackId: string, type: string, title: string, artistName: string) {
  const qClean = query.toLowerCase().trim();
  if (!qClean || !trackId) return;

  clickLogs[qClean] = clickLogs[qClean] || {};
  if (!clickLogs[qClean][trackId]) {
    clickLogs[qClean][trackId] = {
      trackId,
      type,
      title,
      artistName,
      clickCount: 0
    };
  }
  clickLogs[qClean][trackId].clickCount += 1;
}

// Phase 3: LTR Score Engine
export function calculateLTRScore(
  track: any,
  query: string,
  country: string,
  tasteScores?: any,
  recentArtists?: string[]
): {
  finalScore: number;
  components: { text: number; locale: number; affinity: number; trend: number };
} {
  const title = track.title || "";
  const artist = track.artist || "";
  const qClean = query.toLowerCase().trim();

  // 1. Text Score (S_text)
  let textScore = 0.0;
  if (title.toLowerCase() === qClean || artist.toLowerCase() === qClean) {
    textScore = 1.0;
  } else if (title.toLowerCase().includes(qClean) || artist.toLowerCase().includes(qClean)) {
    textScore = 0.85;
  } else if (wordPrefixMatch(title, qClean) || wordPrefixMatch(artist, qClean)) {
    textScore = 0.75;
  } else if (phoneticMatch(title, qClean) || phoneticMatch(artist, qClean)) {
    textScore = 0.60;
  } else {
    // Fuzzy matching fallback
    const titleFuzzy = getSimilarityScore(title, qClean);
    const artistFuzzy = getSimilarityScore(artist, qClean);
    textScore = Math.max(titleFuzzy, artistFuzzy) * 0.5;
  }

  // 2. Local Popularity (S_pop_locale)
  let localeScore = 0.0;
  const cClean = country.toUpperCase();
  
  // Specific national preferences
  const frenchKeywords = [
    "jul", "ninho", "gims", "nekfeu", "stromae", "angèle", "clara luciani", "daft punk", "femtogo", 
    "booba", "sch", "plk", "gazo", "tiakola", "pnl", "orelsan", "lomepal", "soprano", "aya nakamura",
    "indochine", "grand corps malade", "vianney", "slimane", "dadju", "tayc", "français", "french",
    "variété", "rap fr", "pop fr"
  ];

  const countryKeywords: Record<string, string[]> = {
    "BE": ["stromae", "angèle", "damso", "belge", "belgique"],
    "CH": ["suisse", "swiss"],
    "CA": ["the weeknd", "drake", "justin bieber", "celine dion", "shania twain", "canadien", "canada"],
    "US": ["taylor swift", "eminem", "drake", "bruno mars", "billie eilish", "american", "us"],
    "GB": ["queen", "ed sheeran", "adele", "coldplay", "dua lipa", "british", "uk"]
  };

  const aLower = artist.toLowerCase();
  const tLower = title.toLowerCase();

  if (cClean === "FR" && frenchKeywords.some(kw => aLower.includes(kw) || tLower.includes(kw))) {
    localeScore = 1.0;
  } else {
    const kws = countryKeywords[cClean];
    if (kws && kws.some(kw => aLower.includes(kw) || tLower.includes(kw))) {
      localeScore = 1.0;
    } else {
      // General base score from track views popularity
      const viewNum = parseInt((track.views || "0").replace(/[^0-9]/g, ""), 10);
      if (!isNaN(viewNum) && viewNum > 0) {
        localeScore = Math.min(1.0, viewNum / 200000000); // normalized against 200M plays
      } else {
        localeScore = 0.2;
      }
    }
  }

  // 3. User Taste Affinity Score (S_affinite)
  let affinityScore = 0.5; // default moderate affinity
  if (tasteScores) {
    const profile = analyzeTrackMetadataServer(title, artist);
    
    const gScore = tasteScores.genres?.[profile.genre] ?? 10;
    const lScore = tasteScores.languages?.[profile.language] ?? 10;
    const rScore = tasteScores.rhythms?.[profile.rhythm] ?? 10;
    const eScore = tasteScores.eras?.[profile.era] ?? 10;
    
    // Exact artist affinity boost
    let artScore = 10;
    const profileArtistClean = profile.artist.toLowerCase().trim();
    if (tasteScores.artists) {
      const artMatch = Object.keys(tasteScores.artists).find(k => k.includes(profileArtistClean) || profileArtistClean.includes(k));
      if (artMatch) {
        artScore = tasteScores.artists[artMatch];
      }
    }

    const totalRaw = gScore + lScore + rScore + eScore + artScore;
    // Normalized out of 100 (5 dimensions with max 20 each)
    affinityScore = Math.min(1.0, totalRaw / 100);
  }

  // Recent artist listener boost
  if (recentArtists && recentArtists.some(ra => ra.toLowerCase().trim() === artist.toLowerCase().trim())) {
    affinityScore = Math.min(1.0, affinityScore + 0.2);
  }

  // 4. Trend CTR Signal Score (S_tendance)
  let trendScore = 0.0;
  const qClicks = clickLogs[qClean];
  if (qClicks) {
    const totalClicks = Object.values(qClicks).reduce((sum, item) => sum + item.clickCount, 0);
    if (totalClicks > 0) {
      const trackClick = qClicks[track.id]?.clickCount || 0;
      trendScore = trackClick / totalClicks;
    }
  }

  // Linear Weighted Scoring Formula:
  // S = w1*S_text + w2*S_pop_locale + w3*S_affinite + w4*S_tendance
  const w1 = 0.40; // Text matching weight
  const w2 = 0.20; // Regional popularity weight
  const w3 = 0.25; // User Taste profile alignment weight
  const w4 = 0.15; // Feedback CTR dynamic trending weight

  const finalScore = (w1 * textScore) + (w2 * localeScore) + (w3 * affinityScore) + (w4 * trendScore);

  return {
    finalScore,
    components: {
      text: textScore,
      locale: localeScore,
      affinity: affinityScore,
      trend: trendScore
    }
  };
}

// Full pipeline dispatcher for candidate ranking
export function rankCandidates(
  candidates: any[],
  query: string,
  country: string,
  tasteScores?: any,
  recentArtists?: string[]
): any[] {
  const scored = candidates
    .map(c => {
      const { finalScore, components } = calculateLTRScore(c, query, country, tasteScores, recentArtists);
      return {
        ...c,
        ltrScore: finalScore,
        ltrComponents: components
      };
    });

  // Filter out completely unrelated candidates (text score < 0.20) if there are any decent matches
  const hasDecentMatches = scored.some(item => item.ltrComponents.text >= 0.20);
  const filtered = hasDecentMatches 
    ? scored.filter(item => item.ltrComponents.text >= 0.20)
    : scored;

  return filtered.sort((a, b) => b.ltrScore - a.ltrScore);
}
