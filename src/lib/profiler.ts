/**
 * Profiler IA - Classification et analyse en temps réel des morceaux de musique.
 * Ce module classifie chaque musique selon 5 dimensions : Style (genre), Langue, Rythme, Époque et Artiste.
 */

export interface TrackProfile {
  genre: "rap" | "pop" | "electro" | "rock" | "lofi";
  language: "fr" | "en";
  rhythm: "fast" | "medium" | "slow";
  era: "2020s" | "2010s" | "2000s" | "classic";
  artist: string;
}

// Mots-clés pour la détection de la langue française
const FRENCH_KEYWORDS = [
  "le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "que", "pour", "dans", "avec", 
  "sur", "qui", "par", "aux", "au", "vie", "qu'on", "mène", "tchikita", "lettre", "femme", 
  "feu", "bois", "verra", "balance", "grenade", "alors", "danse", "papaoutai", "allemand", 
  "monde", "amour", "triste", "nuit", "soleil", "cœur", "coeur", "temps", "toujours", 
  "comme", "sans", "tout", "tous", "moi", "toi", "nous", "vous", "elle", "ils", "elles", 
  "femtogo", "boulevard", "chercheur", "fantôme", "mélodie"
];

// Artistes typiquement francophones
const FRENCH_ARTISTS = [
  "sdm", "ninho", "gazo", "tiakola", "werenoi", "plk", "damso", "nekfeu", "booba", "sch", "pnl", 
  "orelsan", "lomepal", "soprano", "aya nakamura", "stromae", "angèle", "angele", "clara luciani", 
  "gims", "heuss", "jul", "koba", "femtogo", "dadju", "tayc", "franglish", "hamza", "sch"
];

// Artistes et genres pour la classification
export function analyzeTrackMetadata(title: string, artist: string): TrackProfile {
  const cleanTitle = (title || "").toLowerCase().trim();
  const cleanArtist = (artist || "").toLowerCase().trim();
  const combined = `${cleanTitle} ${cleanArtist}`;

  // 1. Détection de la Langue
  let language: "fr" | "en" = "en";
  const hasFrenchArtist = FRENCH_ARTISTS.some(fa => cleanArtist.includes(fa));
  const hasFrenchTitleWord = FRENCH_KEYWORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(cleanTitle);
  });
  if (hasFrenchArtist || hasFrenchTitleWord) {
    language = "fr";
  }

  // 2. Détection du Style / Genre (Thème de musique)
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

  // 3. Détection du Rythme (Rhythm / Tempo)
  let rhythm: "fast" | "medium" | "slow" = "medium";
  if (genre === "lofi" || cleanTitle.includes("sleep") || cleanTitle.includes("relax") || cleanTitle.includes("acoustic") || cleanTitle.includes("creep") || cleanTitle.includes("rain")) {
    rhythm = "slow";
  } else if (genre === "electro" || genre === "rap" && (cleanTitle.includes("fe!n") || cleanTitle.includes("bolide") || cleanArtist.includes("gazo") || cleanTitle.includes("moulaga")) || cleanTitle.includes("dance") || cleanTitle.includes("remix")) {
    rhythm = "fast";
  }

  // 4. Détection de l'Époque (Decade / Era)
  let era: "2020s" | "2010s" | "2000s" | "classic" = "2020s";

  const classicArtists = ["queen", "ac/dc", "guns n' roses", "nirvana", "pink floyd", "led zeppelin", "beatles"];
  const keywords2000s = ["linkin park", "daft punk", "eminem", "radiohead", "creep", "lose yourself", "one more time"];
  const keywords2010s = ["ninho", "damso", "nekfeu", "stromae", "avicii", "david guetta", "calvin harris", "imagine dragons", "coldplay", "blinding lights", "starboy", "papaoutai", "as it was"];

  if (classicArtists.some(ca => cleanArtist.includes(ca))) {
    era = "classic";
  } else if (keywords2000s.some(kw => combined.includes(kw))) {
    era = "2000s";
  } else if (keywords2010s.some(kw => combined.includes(kw))) {
    era = "2010s";
  }

  return {
    genre,
    language,
    rhythm,
    era,
    artist: cleanArtist
  };
}
