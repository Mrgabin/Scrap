export const DETERMINISTIC_AVATARS: string[] = [];

export function getDeterministicArtistAvatar(artistName: string): string {
  // Return empty string as requested by the user, so no random faces/placeholders are used
  // and the components can render a beautiful empty grey circle instead.
  return "";
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
