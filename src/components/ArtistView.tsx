import React, { useState, useEffect } from "react";
import { Play, Pause, Disc, Heart, Check, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Track } from "../types";
import { CURATED_PLAYLISTS } from "../data/curatedPlaylists";
import { useTranslation } from "../lib/LanguageContext";
import { getDeterministicArtistAvatar, getDeterministicArtistBanner } from "../lib/avatarHelper";

interface ArtistViewProps {
  artistName: string;
  onPlayTrack: (track: Track, contextList?: Track[]) => void;
  onSelectArtist: (artistName: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  followedArtists: string[];
  onToggleFollowArtist: (artistName: string) => void;
}

const getArtistMetadata = (name: string) => {
  const normalized = name.toLowerCase().trim();
  
  const known: Record<string, { banner: string; listeners: string; bio: string }> = {
    "the weeknd": {
      banner: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
      listeners: "114 205 391",
      bio: "The Weeknd est un artiste canadien acclamé par la critique, connu pour sa voix de fausset caractéristique et sa pop sombre teintée de R&B rétro."
    },
    "daft punk": {
      banner: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
      listeners: "52 409 118",
      bio: "Daft Punk est le duo de musique électronique français le plus influent de l'histoire, pionnier de la French Touch avec leurs casques robotiques légendaires."
    },
    "stromae": {
      banner: "https://images.unsplash.com/photo-1484876065684-b683cf17d276?auto=format&fit=crop&w=1200&q=80",
      listeners: "15 892 410",
      bio: "Stromae est un auteur-compositeur-interprète belge qui mélange habilement l'électro, le hip-hop et la chanson française avec des textes poignants."
    },
    "femtogo": {
      banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
      listeners: "2 767 206",
      bio: "FEMTOGO est un rappeur et producteur d'exception, reconnu pour son atmosphère cloud-rap immersive, ses mélodies envoûtantes et ses textes mélancoliques."
    },
    "lofi girl": {
      banner: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
      listeners: "8 410 395",
      bio: "Lofi Girl est la marque et la radio de détente de référence mondiale, accompagnant des millions d'auditeurs dans leurs études et moments de calme."
    },
    "clara luciani": {
      banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      listeners: "4 891 024",
      bio: "Clara Luciani est une autrice-compositrice-interprète française, figure de proue de la nouvelle scène pop avec sa voix envoûtante de contralto."
    },
    "angèle": {
      banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      listeners: "9 123 456",
      bio: "Angèle est une autrice-compositrice-interprète et productrice belge, icône de la pop francophone avec ses textes engagés et ses mélodies ultra-efficaces."
    },
    "queen": {
      banner: "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=1200&q=80",
      listeners: "48 912 045",
      bio: "Queen est l'un des plus grands groupes de rock de tous les temps, mené par le légendaire Freddie Mercury, célèbre pour son lyrisme et ses performances d'arène."
    },
    "nirvana": {
      banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      listeners: "31 560 219",
      bio: "Nirvana est le groupe de grunge emblématique des années 90 mené par Kurt Cobain, qui a révolutionné la musique alternative avec des hymnes générationnels."
    },
    "ac/dc": {
      banner: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80",
      listeners: "35 890 120",
      bio: "AC/DC est le groupe légendaire de hard rock australien, caractérisé par ses riffs de guitare surpuissants et l'énergie scénique inimitable d'Angus Young."
    }
  };

  if (known[normalized]) {
    return known[normalized];
  }

  // Generate deterministic statistics using a simple string hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const baseListeners = (hash % 12000000) + 500000;
  const formattedListeners = baseListeners.toLocaleString("fr-FR");
  
  return {
    banner: "",
    listeners: formattedListeners,
    bio: `${name} est un artiste de talent qui redéfinit constamment les frontières de son genre musical, captivant des auditeurs du monde entier par ses compositions innovantes.`
  };
};

interface CachedArtist {
  profileData: any;
  topTracks: Track[];
}

const artistCache: Record<string, CachedArtist> = {};

const getLocalArtistTracks = (name: string): Track[] => {
  const localArtistTracks: Track[] = [];
  const seenIds = new Set<string>();

  CURATED_PLAYLISTS.forEach(playlist => {
    playlist.tracks.forEach(track => {
      const lowerArtist = track.artist.toLowerCase();
      const lowerTarget = name.toLowerCase();
      if (lowerArtist.includes(lowerTarget) || lowerTarget.includes(lowerArtist)) {
        if (!seenIds.has(track.id)) {
          seenIds.add(track.id);
          localArtistTracks.push({
            ...track,
            artist: name
          });
        }
      }
    });
  });

  return localArtistTracks.slice(0, 8);
};

export default function ArtistView({
  artistName,
  onPlayTrack,
  onSelectArtist,
  currentTrack,
  isPlaying,
  onPlayPauseToggle,
  followedArtists,
  onToggleFollowArtist
}: ArtistViewProps) {
  const { t } = useTranslation();
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    avatarUrl: string | null;
    bannerUrl: string;
    subscribersText: string;
    bio: string;
    listeners?: string;
    followers?: string;
    worldRank?: string;
    totalStreams?: string;
    popularCities?: string;
  } | null>(null);
  
  // Custom states for album details and tracklists
  const [albums, setAlbums] = useState<any[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [loadingAlbumTracks, setLoadingAlbumTracks] = useState(false);

  const isFollowing = followedArtists.includes(artistName);
  
  // Custom states for realistic Spotify artist page details
  const metadata = getArtistMetadata(artistName);
  const monthlyListeners = profileData?.listeners 
    ? `${profileData.listeners} ${t("artist.listeners").toLowerCase()}`
    : `${metadata.listeners} ${t("artist.listeners").toLowerCase()}`;
  const bannerUrl = profileData?.bannerUrl || metadata.banner;
  const artistBio = profileData?.bio || metadata.bio;

  useEffect(() => {
    if (!artistName) return;

    let active = true;
    const cacheKey = artistName.toLowerCase().trim();
    const cached = artistCache[cacheKey];

    // Compute fallback metadata and tracks instantly for 0ms visual load
    const meta = getArtistMetadata(artistName);
    
    // Retrieve cached avatar if available in localStorage
    let cachedAvatarUrl = "";
    try {
      const saved = localStorage.getItem("spotify_artist_avatars");
      if (saved) {
        const parsed = JSON.parse(saved);
        cachedAvatarUrl = parsed[artistName] || "";
      }
    } catch (e) {
      console.warn("Error reading cached avatars in ArtistView:", e);
    }

    const initialProfile = {
      avatarUrl: cachedAvatarUrl || getDeterministicArtistAvatar(artistName),
      bannerUrl: meta.banner || "",
      subscribersText: `${meta.listeners} auditeurs`,
      bio: meta.bio,
      listeners: meta.listeners
    };

    const localTracks = getLocalArtistTracks(artistName);

    // Reset album selection
    setSelectedAlbum(null);
    setAlbumTracks([]);

    if (cached) {
      setProfileData(cached.profileData);
      setTopTracks(cached.topTracks);
      setLoading(false);
    } else {
      setProfileData(initialProfile);
      setTopTracks(localTracks);
      setLoading(false); // Immediate visual feedback, no skeleton screens
    }

    // Run parallel background fetches to retrieve high-quality stats/results without delaying view entry
    const fetchFullArtistData = async () => {
      let fetchedProfile = null;
      try {
        const res = await fetch(`/api/artist-profile?name=${encodeURIComponent(artistName)}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data && !data.error) {
              fetchedProfile = data;
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching profile in bg:", err);
      }

      let fetchedTracks: Track[] = [];
      try {
        const response = await fetch(`/api/artist-tracks?name=${encodeURIComponent(artistName)}`);
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data && data.results && data.results.length > 0) {
              fetchedTracks = data.results;
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching tracks in bg:", err);
      }

      if (active) {
        const finalProfile = fetchedProfile || cached?.profileData || initialProfile;
        if (finalProfile && !finalProfile.avatarUrl) {
          finalProfile.avatarUrl = getDeterministicArtistAvatar(artistName);
        }
        const finalTracks = fetchedTracks.length > 0 ? fetchedTracks : (cached?.topTracks || localTracks);

        // Update the client-side cache
        artistCache[cacheKey] = {
          profileData: finalProfile,
          topTracks: finalTracks
        };

        setProfileData(finalProfile);
        setTopTracks(finalTracks);
      }
    };

    // Fetch actual artist albums from Deezer/Gemini
    const fetchArtistAlbums = async () => {
      setLoadingAlbums(true);
      try {
        const response = await fetch(`/api/artist-albums?name=${encodeURIComponent(artistName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.results && active) {
            setAlbums(data.results);
          }
        }
      } catch (err) {
        console.warn("Error fetching artist albums:", err);
      } finally {
        if (active) setLoadingAlbums(false);
      }
    };

    fetchFullArtistData();
    fetchArtistAlbums();

    return () => {
      active = false;
    };
  }, [artistName]);

  // Fetch album tracks on selectedAlbum change
  const selectedAlbumId = selectedAlbum?.id;
  const selectedAlbumTitle = selectedAlbum?.title;

  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumTracks([]);
      return;
    }

    let active = true;
    const fetchTracks = async () => {
      setLoadingAlbumTracks(true);
      try {
        const response = await fetch(
          `/api/album-tracks?albumId=${selectedAlbumId}&albumTitle=${encodeURIComponent(
            selectedAlbumTitle || ""
          )}&artistName=${encodeURIComponent(artistName)}`
        );
        if (response.ok && active) {
          const data = await response.json();
          if (data && data.results) {
            setAlbumTracks(data.results);
            const count = data.results.length;
            
            // Dynamically update the track count in the main albums list so they are 100% exact!
            setAlbums(prevAlbums => 
              prevAlbums.map(alb => 
                alb.id === selectedAlbumId 
                  ? { ...alb, tracksCount: count } 
                  : alb
              )
            );

            // Update selectedAlbum's trackCount as well so the modal displays the exact count
            setSelectedAlbum(prev => prev && prev.id === selectedAlbumId ? { ...prev, tracksCount: count } : prev);
          }
        }
      } catch (err) {
        console.warn("Error fetching album tracks:", err);
      } finally {
        if (active) setLoadingAlbumTracks(false);
      }
    };

    fetchTracks();

    return () => {
      active = false;
    };
  }, [selectedAlbumId, selectedAlbumTitle, artistName]);

  const handlePlayArtistPopular = () => {
    if (topTracks.length > 0) {
      onPlayTrack(topTracks[0], topTracks);
    }
  };

  const mockAlbums = [
    { title: "Live at Wembley (Chronicles)", year: "2024", tracks: "14 titres" },
    { title: "Universal Horizon (Deluxe Edition)", year: "2022", tracks: "18 titres" },
    { title: "Atmosphere & Echoes", year: "2019", tracks: "12 titres" },
    { title: "Acoustic Sessions (EP)", year: "2017", tracks: "6 titres" }
  ];

  return (
    <div className="h-full overflow-y-auto text-white select-none pb-20" id="artist_profile_view">
      
      {/* 1. Jumbotron Header Banner with circular avatar and stable metrics */}
      <div 
        className="h-[360px] relative bg-cover bg-center flex flex-col justify-end p-6 md:p-8"
        style={bannerUrl ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(18,18,18,1) 100%), url("${bannerUrl}")` } : { backgroundImage: `linear-gradient(to bottom, rgba(18,18,18,0.2) 0%, rgba(18,18,18,1) 100%)` }}
      >
        <div className="flex items-center gap-4 md:gap-6 mb-2">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-[3px] border-white/20 shadow-2xl overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center font-bold text-3xl text-neutral-400 relative select-none">
            {profileData?.avatarUrl ? (
              <img 
                referrerPolicy="no-referrer" 
                src={profileData.avatarUrl} 
                alt={artistName} 
                className="w-full h-full object-cover animate-fade-in" 
              />
            ) : (
              <span className="text-2xl md:text-5xl font-extrabold uppercase">{artistName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#1DB954] mb-1.5 bg-black/50 px-2.5 py-1 rounded-full w-fit backdrop-blur-sm border border-[#1db954]/10">
              <ShieldCheck className="w-3.5 h-3.5" /> {t("artist.verified")}
            </div>
            <h1 className="text-3xl md:text-6xl font-black tracking-tight drop-shadow-xl text-white truncate">
              {artistName}
            </h1>
            <p className="text-xs md:text-sm font-semibold text-neutral-300 drop-shadow-md mt-2">
              {monthlyListeners}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Control Row */}
      <div className="p-6 md:p-8 flex items-center gap-6">
        <button 
          id="play_artist_btn"
          onClick={handlePlayArtistPopular}
          className="w-14 h-14 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1db954]/10 shrink-0"
        >
          <Play className="w-6 h-6 text-black fill-current translate-x-[1px]" />
        </button>

        <button 
          id="follow_artist_btn"
          onClick={() => onToggleFollowArtist(artistName)}
          className={`border px-6 py-2 rounded-full font-bold text-sm tracking-wide transition-all uppercase hover:scale-105 active:scale-95 ${
            isFollowing ? "border-[#1DB954] text-[#1DB954]" : "border-white/40 text-white hover:border-white"
          }`}
        >
          {isFollowing ? t("artist.unfollow") : t("artist.follow")}
        </button>
      </div>

      {loading ? (
        /* Skeletons */
        <div className="px-6 md:px-8 space-y-4">
          <div className="h-6 bg-neutral-800 rounded w-48 animate-pulse mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#181818] rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="px-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. Popular Songs List (Span 2) */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">{t("artist.popular")}</h3>
            <div className="flex flex-col gap-1 bg-black/10 rounded-lg p-2 border border-neutral-900">
              {topTracks.map((track, idx) => (
                <div 
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track, topTracks)}
                  className="flex items-center justify-between p-3 rounded hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <span className="w-5 text-center text-[#b3b3b3] group-hover:hidden font-mono text-sm">{idx + 1}</span>
                    <Play className="hidden group-hover:block w-4 h-4 text-white fill-current shrink-0" />
                    <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-10 h-10 object-cover rounded shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-white truncate max-w-sm">{track.title}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5 shrink-0">
                    {track.views && (
                      <span className="text-xs text-[#b3b3b3]/80 font-mono select-none group-hover:text-white transition-colors">
                        {track.views}
                      </span>
                    )}
                    <span className="text-xs text-[#b3b3b3] font-mono">{track.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Similar Artists & About Panel */}
          <div>
            {/* Micro About Bio & Real Stats */}
            <div className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] p-5 rounded-xl border border-neutral-900 relative overflow-hidden group flex flex-col gap-4">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1DB954] mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t("artist.about")}
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed italic">
                  "{artistBio}"
                </p>
              </div>

              {/* Statistical insights */}
              <div className="relative z-10 border-t border-neutral-900/80 pt-4 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  {t("artist.real_stats")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-800/40">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">{t("artist.listeners")}</p>
                    <p className="text-sm font-extrabold text-[#1DB954] font-mono mt-0.5">
                      {profileData?.listeners || metadata.listeners}
                    </p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-800/40">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">{t("artist.followers")}</p>
                    <p className="text-sm font-extrabold text-white font-mono mt-0.5">
                      {profileData?.followers || "—"}
                    </p>
                  </div>
                  {profileData?.worldRank && (
                    <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-800/40">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">{t("artist.world_rank")}</p>
                      <p className="text-sm font-extrabold text-yellow-500 font-mono mt-0.5">
                        {profileData.worldRank}
                      </p>
                    </div>
                  )}
                  {profileData?.totalStreams && (
                    <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-800/40">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">{t("artist.streams")}</p>
                      <p className="text-xs font-extrabold text-white font-mono mt-0.5">
                        {profileData.totalStreams}
                      </p>
                    </div>
                  )}
                </div>
                {profileData?.popularCities && (
                  <div className="mt-3 bg-black/40 p-2.5 rounded-lg border border-neutral-800/40">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">{t("artist.popular_cities")}</p>
                    <p className="text-xs font-medium text-neutral-300 mt-1">
                      {profileData.popularCities}
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-[#1DB954]/5 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </div>

        </div>
      )}

      {/* 5. Chronological Albums Row */}
      {!loading && (loadingAlbums || (albums && albums.length > 0)) && (
        <div className="mt-12 px-6 md:px-8 mb-8" id="artist_albums_row">
          <h3 className="text-2xl font-bold mb-4">{t("artist.discography")}</h3>
          {loadingAlbums ? (
            <div className="flex items-center gap-3 text-neutral-500 py-6">
              <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono">Chargement des albums...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-5">
              {albums.map((album) => (
                <div 
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="bg-[#181818] p-4 rounded-lg border border-neutral-900 hover:bg-[#242424] transition-all cursor-pointer group hover:-translate-y-1 duration-300"
                >
                  <div className="w-full aspect-square rounded shadow-lg overflow-hidden bg-neutral-800 mb-4 flex items-center justify-center relative">
                    {album.cover ? (
                      <img referrerPolicy="no-referrer" src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Disc className="w-16 h-16 text-neutral-600 group-hover:rotate-180 transition-transform duration-700 shrink-0" />
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold">
                      {album.year}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-white truncate">{album.title}</h4>
                  <p className="text-xs text-[#b3b3b3] mt-1">{album.tracksCount} {t("artist.tracks_count") || "titres"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Album Tracks Modal Overlay */}
      {selectedAlbum && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" 
          onClick={() => setSelectedAlbum(null)}
        >
          <div 
            className="bg-[#121212] w-full max-w-3xl rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left/Top Panel - Album Cover & Metadata */}
            <div className="md:w-1/3 bg-neutral-900/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-2xl bg-neutral-800 mb-6 border border-neutral-700">
                {selectedAlbum.cover ? (
                  <img referrerPolicy="no-referrer" src={selectedAlbum.cover} alt={selectedAlbum.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900"><Disc className="w-20 h-20 text-neutral-600" /></div>
                )}
              </div>
              <h4 className="font-extrabold text-base md:text-lg text-center text-white line-clamp-2 px-2">{selectedAlbum.title}</h4>
              <p className="text-xs text-[#1DB954] font-bold mt-2 uppercase tracking-wider">{artistName}</p>
              <div className="flex gap-4 mt-3 text-xs text-neutral-400 font-medium">
                <span>{selectedAlbum.year}</span>
                <span>•</span>
                <span>{selectedAlbum.tracksCount || albumTracks.length} {t("artist.tracks_count") || "titres"}</span>
              </div>
              
              {albumTracks.length > 0 && (
                <button 
                  onClick={() => onPlayTrack(albumTracks[0], albumTracks)}
                  className="mt-6 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold px-6 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-lg shadow-[#1db954]/10"
                >
                  <Play className="w-4 h-4 fill-current text-black animate-pulse" /> Play
                </button>
              )}
            </div>

            {/* Right/Bottom Panel - Tracklist */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h5 className="font-bold text-base text-neutral-300">Titres ({albumTracks.length})</h5>
                <button 
                  onClick={() => setSelectedAlbum(null)}
                  className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Fermer
                </button>
              </div>

              {loadingAlbumTracks ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
                  <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono">Chargement des pistes...</span>
                </div>
              ) : albumTracks.length > 0 ? (
                <div className="space-y-1">
                  {albumTracks.map((track, idx) => {
                    const isCurrentlyPlaying = currentTrack?.title === track.title && isPlaying;
                    return (
                      <div 
                        key={track.id}
                        onClick={() => onPlayTrack(track, albumTracks)}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group ${isCurrentlyPlaying ? "bg-white/5" : ""}`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden min-w-0">
                          <span className={`w-5 text-center text-sm font-mono ${isCurrentlyPlaying ? "text-[#1DB954]" : "text-neutral-500 group-hover:hidden"}`}>
                            {idx + 1}
                          </span>
                          <Play className={`hidden group-hover:block w-4 h-4 shrink-0 ${isCurrentlyPlaying ? "text-[#1DB954]" : "text-white"}`} />
                          <div className="overflow-hidden">
                            <p className={`font-semibold text-sm truncate ${isCurrentlyPlaying ? "text-[#1DB954]" : "text-white"}`}>
                              {track.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 shrink-0">
                          {track.views && <span className="hidden sm:inline opacity-60 group-hover:opacity-100 transition-opacity">{track.views}</span>}
                          <span>{track.duration}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs py-12">
                  Aucun titre trouvé pour cet album.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
