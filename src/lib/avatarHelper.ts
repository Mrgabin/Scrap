export const DETERMINISTIC_AVATARS: string[] = [];

export async function fetchArtistAvatarClient(artistName: string): Promise<string | null> {
  const normalized = (artistName || "").trim();
  if (!normalized) return null;

  try {
    // 1. Try French Wikipedia first (great for local French artists like Damso, Luther, Specy Men)
    const frUrl = `https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(normalized)}&gsrlimit=1&prop=pageimages&piprop=original&format=json&origin=*`;
    const frRes = await fetch(frUrl);
    if (frRes.ok) {
      const data = await frRes.json();
      const pages = data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const originalImg = pages[pageId]?.original?.source;
        if (originalImg) {
          return originalImg;
        }
      }
    }

    // 2. Try English Wikipedia (great for international artists like Michael Jackson, The Weeknd)
    const enUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(normalized)}&gsrlimit=1&prop=pageimages&piprop=original&format=json&origin=*`;
    const enRes = await fetch(enUrl);
    if (enRes.ok) {
      const data = await enRes.json();
      const pages = data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const originalImg = pages[pageId]?.original?.source;
        if (originalImg) {
          return originalImg;
        }
      }
    }

    // 3. Try iTunes Search API as a high-quality official music fallback (album artwork)
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(normalized)}&entity=album&limit=1`;
    const itunesRes = await fetch(itunesUrl);
    if (itunesRes.ok) {
      const data = await itunesRes.json();
      if (data.results && data.results.length > 0) {
        const artwork = data.results[0].artworkUrl100;
        if (artwork) {
          // Upgrade to high-resolution
          return artwork.replace("100x100bb.jpg", "600x600bb.jpg");
        }
      }
    }
  } catch (error) {
    console.warn("Error in client-side artist photo fetch:", error);
  }

  return null;
}

export function getDeterministicArtistAvatar(artistName: string): string {
  const normalized = (artistName || "").toLowerCase().trim();
  
  // Specific known high-quality matching Unsplash artist/music images
  if (normalized.includes("weeknd")) {
    return "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80"; // Moody retro neon male
  } else if (normalized.includes("daft punk")) {
    return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80"; // Synth/DJ stage light French Touch
  } else if (normalized.includes("stromae")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"; // Stylish Belgian male portrait
  } else if (normalized.includes("femtogo") || normalized.includes("ptite soeur")) {
    return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"; // French cloud-rap stylish streetwear male
  } else if (normalized.includes("clara luciani") || normalized.includes("luciani")) {
    return "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"; // Elegant classic French female portrait
  } else if (normalized.includes("angèle") || normalized.includes("angele")) {
    return "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"; // Bright charismatic Belgian pop female
  } else if (normalized.includes("ninho")) {
    return "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"; // Intense male portrait
  } else if (normalized.includes("gazo")) {
    return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"; // Stylish streetwear male
  } else if (normalized.includes("tiakola")) {
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"; // Joyful charisma
  } else if (normalized.includes("werenoi")) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80"; // Mysterious dark aesthetic
  } else if (normalized.includes("plk") || normalized.includes("nekfeu")) {
    return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"; // Clean French style streetwear portrait
  } else if (normalized.includes("damso")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"; // Dark beard portrait
  } else if (normalized.includes("sdm")) {
    return "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80"; // Powerful neon streetwear model
  } else if (normalized.includes("jul")) {
    return "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"; // Street sportswear cap look
  } else if (normalized.includes("booba") || normalized.includes("sch")) {
    return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"; // Alpha male model portrait
  } else if (normalized.includes("pnl")) {
    return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80"; // Night neon background brothers
  } else if (normalized.includes("hamza")) {
    return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"; // Trendy trap portrait
  } else if (normalized.includes("orelsan") || normalized.includes("lomepal")) {
    return "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"; // Indie alternative male
  } else if (normalized.includes("dadju") || normalized.includes("tayc")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"; // Elegant R&B pop male portrait
  } else if (normalized.includes("lofi girl") || normalized.includes("chill") || normalized.includes("sleep")) {
    return "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=300&q=80"; // Cozy lofi study desk / nature
  } else if (normalized.includes("queen")) {
    return "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=300&q=80"; // Classic arena rock concert light
  } else if (normalized.includes("nirvana")) {
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"; // Grunge retro microphone
  } else if (normalized.includes("ac/dc") || normalized.includes("acdc")) {
    return "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80"; // Energetic hard rock stage/guitar
  } else if (normalized.includes("ziak")) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80"; // Mysterious dark drill masked vibe
  } else if (normalized.includes("lewild") || normalized.includes("pepyth")) {
    return "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"; // Stylish modern afro-beat/hip-hop portrait
  } else if (normalized.includes("oliver tree")) {
    return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"; // Ecclectic stylish male portrait
  } else if (normalized.includes("sheeran")) {
    return "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"; // Acoustic singer/guitar portrait
  } else if (normalized.includes("styles")) {
    return "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"; // Fashionable retro male look
  } else if (normalized.includes("lipa")) {
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"; // Pop-diva elegant female portrait
  } else if (normalized.includes("dragons")) {
    return "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=300&q=80"; // Modern stadium rock band vibe
  } else if (normalized.includes("cyrus")) {
    return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"; // Confident stylish blonde female portrait
  } else if (normalized.includes("bieber") || normalized.includes("laroi")) {
    return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"; // Urban streetwear pop-star male portrait
  } else if (normalized.includes("bts")) {
    return "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"; // Korean pop-star style group portrait
  } else if (normalized.includes("indila")) {
    return "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"; // Mysterious classic female vocalist look
  } else if (normalized.includes("coldplay")) {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80"; // Melodic lights and stadium performance
  } else if (normalized.includes("guns")) {
    return "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80"; // Hard rock guitar action shot
  } else if (normalized.includes("radiohead")) {
    return "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"; // Moody, artistic, intellectual male portrait
  } else if (normalized.includes("oasis")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"; // 90s retro-style male portrait
  } else if (normalized.includes("peppers")) {
    return "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=300&q=80"; // Funky energetic rock stage
  } else if (normalized.includes("linkin")) {
    return "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80"; // Alternative rock emotional performance lighting
  }

  // Deterministic fallback based on name hash
  const defaultAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80"
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultAvatars[Math.abs(hash) % defaultAvatars.length];
}

export function getDeterministicArtistBanner(artistName: string): string {
  const name = artistName || "Artist";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // Palettes designed with deep, elegant backgrounds and vibrant accents matching Scrap's style
  const palettes = [
    { start: "%231DB954", end: "%23106B30" }, // Scrap green to dark green
    { start: "%238B5CF6", end: "%234C1D95" }, // Purple to deep violet
    { start: "%23EC4899", end: "%239D174D" }, // Pink to deep rose
    { start: "%233B82F6", end: "%231E3A8A" }, // Blue to deep navy
    { start: "%23F59E0B", end: "%2378350F" }, // Amber to deep brown
    { start: "%2306B6D4", end: "%23164E63" }, // Cyan to deep teal
    { start: "%23EF4444", end: "%237F1D1D" }, // Red to deep crimson
  ];

  const palette = palettes[hash % palettes.length];
  const angle = hash % 360;

  // Let's draw some beautiful soundwave paths, grid lines, or ambient floating circles
  const shapeType = hash % 3;
  let shapes = "";

  if (shapeType === 0) {
    // Elegant soundwaves/curves
    shapes = `
      <path d='M-100,200 C150,50 350,350 600,200 C850,50 1050,350 1300,200 L1300,400 L-100,400 Z' fill='url(%23g)' opacity='0.15' />
      <path d='M-100,250 C200,100 400,300 700,150 C1000,0 1100,300 1300,250 L1300,400 L-100,400 Z' fill='url(%23g)' opacity='0.1' />
      <path d='M-100,150 C100,250 300,50 500,200 C700,350 900,100 1300,150 L1300,400 L-100,400 Z' fill='url(%23g)' opacity='0.05' />
    `;
  } else if (shapeType === 1) {
    // Cyberpunk grids and sound bars
    shapes = `
      <g stroke='url(%23g)' stroke-width='1' opacity='0.08'>
        <line x1='0' y1='0' x2='1200' y2='400' />
        <line x1='1200' y1='0' x2='0' y2='400' />
        <line x1='0' y1='200' x2='1200' y2='200' />
        <line x1='600' y1='0' x2='600' y2='400' />
      </g>
      <rect x='100' y='150' width='30' height='100' rx='5' fill='url(%23g)' opacity='0.15' />
      <rect x='150' y='100' width='30' height='150' rx='5' fill='url(%23g)' opacity='0.12' />
      <rect x='200' y='180' width='30' height='70' rx='5' fill='url(%23g)' opacity='0.2' />
      <rect x='250' y='80' width='30' height='170' rx='5' fill='url(%23g)' opacity='0.08' />
      <rect x='300' y='130' width='30' height='120' rx='5' fill='url(%23g)' opacity='0.18' />
      <rect x='350' y='160' width='30' height='90' rx='5' fill='url(%23g)' opacity='0.25' />
    `;
  } else {
    // Soft geometric overlapping modern nodes
    shapes = `
      <circle cx='300' cy='200' r='250' fill='url(%23g)' opacity='0.12' />
      <circle cx='900' cy='150' r='180' fill='url(%23g)' opacity='0.08' />
      <circle cx='600' cy='300' r='150' fill='url(%23g)' opacity='0.15' />
    `;
  }

  // Beautiful SVG with background and linear gradient
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400' width='1200' height='400'>
    <defs>
      <linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'>
        <stop offset='0%25' stop-color='${palette.start}' />
        <stop offset='100%25' stop-color='${palette.end}' />
      </linearGradient>
      <linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'>
        <stop offset='0%25' stop-color='%23080808' />
        <stop offset='100%25' stop-color='%231a1a1a' />
      </linearGradient>
    </defs>
    <rect width='100%25' height='100%25' fill='url(%23bg)' />
    ${shapes}
    <circle cx='1000' cy='250' r='300' fill='url(%23g)' opacity='0.05' filter='blur(40px)' />
    <circle cx='200' cy='100' r='200' fill='url(%23g)' opacity='0.03' filter='blur(30px)' />
  </svg>`;

  // Clean and encode
  const cleanSvg = svg.replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${cleanSvg}`;
}
