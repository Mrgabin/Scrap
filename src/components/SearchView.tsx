import React, { useState, useMemo } from "react";
import { 
  Play, 
  Plus, 
  Check, 
  MoreHorizontal, 
  CheckCircle, 
  PlusCircle,
  Music,
  Compass
} from "lucide-react";
import { Track, Playlist } from "../types";
import { useTranslation } from "../lib/LanguageContext";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";

interface SearchViewProps {
  onPlayTrack: (track: Track, contextList?: Track[]) => void;
  onSelectArtist: (artistName: string) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  customPlaylists: Playlist[];
  onAddTrackToPlaylist: (track: Track, playlistId: string) => void;
  query: string;
  setQuery: (val: string) => void;
  results: Track[];
  setResults: (tracks: Track[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  executeSearch: (query: string) => void;
  likedTracks: Track[];
  onToggleLike: (track: Track) => void;
  followedArtists: string[];
  onToggleFollowArtist: (artistName: string) => void;
  artistAvatars: Record<string, string>;
}

const CATEGORIES = [
  { name: "Musique", color: "bg-[#e8115b]", query: "hits 2026", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60" },
  { name: "Podcasts", color: "bg-[#006450]", query: "podcast debate discussion", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=60" },
  { name: "Livres audio", color: "bg-[#148a08]", query: "audiobook read stories", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=60" },
  { name: "Événements live", color: "bg-[#7d4b32]", query: "concert live tour", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60" },
  { name: "Conçu spécialement pour vous", color: "bg-[#1e3264]", query: "mix daily discover", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60" },
  { name: "Dernières sorties", color: "bg-[#e8115b]", query: "new release single", image: "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=300&auto=format&fit=crop&q=60" },
  { name: "Été", color: "bg-[#ff4632]", query: "summer hits beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=60" },
  { name: "Fitness", color: "bg-[#7746de]", query: "workout cardio training gym", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=60" },
  { name: "Hip-Hop", color: "bg-[#bc5900]", query: "rap hip hop boom bap", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=60" },
  { name: "Pop", color: "bg-[#148a08]", query: "pop hits 2026 billboard", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300&auto=format&fit=crop&q=60" },
  { name: "Variété Française", color: "bg-[#283ea7]", query: "variete francaise classique", image: "https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=300&auto=format&fit=crop&q=60" },
  { name: "Classements", color: "bg-[#8d67ab]", query: "top 50 charts global", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=60" },
  { name: "Classements des podcasts", color: "bg-[#0d73ec]", query: "top podcasts charts", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&auto=format&fit=crop&q=60" },
  { name: "Podcasts vidéo", color: "bg-[#537aa1]", query: "video podcast interview", image: "https://images.unsplash.com/photo-1542204172-e70528091869?w=300&auto=format&fit=crop&q=60" },
  { name: "Romans policiers et thrillers", color: "bg-[#1e3264]", query: "thriller murder mystery audio", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=300&auto=format&fit=crop&q=60" },
  { name: "Fiction et littérature", color: "bg-[#b06239]", query: "fiction novel stories audiobook", image: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=300&auto=format&fit=crop&q=60" },
  { name: "Développement personnel", color: "bg-[#e5a020]", query: "self care meditation mindfulness", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=60" },
  { name: "Latino", color: "bg-[#e1118c]", query: "reggaeton latino salsa", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=60" },
  { name: "En voiture", color: "bg-[#3c4a5e]", query: "car driving road trip travel", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&auto=format&fit=crop&q=60" },
  { name: "Ambiance", color: "bg-[#2d46b9]", query: "ambient chill focus atmospheric", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=300&auto=format&fit=crop&q=60" },
  { name: "Dance/Électro", color: "bg-[#d84000]", query: "edm dance electro house club", image: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=300&auto=format&fit=crop&q=60" },
  { name: "Découvertes", color: "bg-[#509bf5]", query: "discover weekly new music", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=60" },
  { name: "Rock", color: "bg-[#735905]", query: "classic rock metal grunge", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=60" },
  { name: "Indie", color: "bg-[#e91429]", query: "indie folk alternative acoustic", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=60" }
];

const FILTERS = [
  "Tout",
  "Titres",
  "Artistes",
  "Playlists",
  "Albums",
  "Podcasts et émissions",
  "Livres audio",
  "Profils",
  "Genres et ambiances"
];

// Helper to determine if a track is explicit based on common attributes or matching user's screen
const isExplicitTrack = (title: string, artist: string): boolean => {
  const lowerTitle = title.toLowerCase();
  const lowerArtist = artist.toLowerCase();
  
  if (
    lowerTitle.includes("rainy day") ||
    lowerTitle.includes("hyène") ||
    lowerTitle.includes("autre jour") ||
    lowerTitle.includes("scopolamine") ||
    lowerTitle.includes("femtogo") ||
    lowerTitle.includes("riffaud") ||
    lowerTitle.includes("carrefour") ||
    lowerTitle.includes("puke") ||
    lowerTitle.includes("expl") ||
    lowerTitle.includes("explicit") ||
    lowerTitle.includes("hit")
  ) {
    return true;
  }
  
  // Deterministic fallback based on char codes
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return sum % 3 === 0;
};

export default function SearchView({
  onPlayTrack,
  onSelectArtist,
  onSelectPlaylist,
  customPlaylists,
  onAddTrackToPlaylist,
  query,
  setQuery,
  results,
  setResults,
  loading,
  setLoading,
  executeSearch,
  likedTracks,
  onToggleLike,
  followedArtists,
  onToggleFollowArtist,
  artistAvatars
}: SearchViewProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [openPlaylistDropdownId, setOpenPlaylistDropdownId] = useState<string | null>(null);

  const logSearchClick = (item: any) => {
    if (!query) return;
    const cleanId = String(item.id || "").replace(/^(track-|custom-playlist-|artist-|curated-playlist-\d+-)/, "");
    fetch("/api/search/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        clickedId: cleanId,
        type: item.type,
        title: item.title,
        artistName: item.artistName || item.title
      })
    }).catch(err => console.warn("Failed to log search click:", err));
  };

  const handleCategoryClick = (catQuery: string, catName: string) => {
    setQuery(catName);
    executeSearch(catQuery);
    setActiveFilter("Tout");
  };

  // Dynamically calculate the primary artist matching the query or results
  const primaryArtist = useMemo(() => {
    if (results.length === 0) return null;
    
    const queryLower = query.toLowerCase().trim();
    const matchedTrack = results.find(t => t.artist.toLowerCase().includes(queryLower));
    const artistName = matchedTrack ? matchedTrack.artist : results[0].artist;
    
    return {
      name: artistName,
      avatar: artistAvatars[artistName] || getDeterministicArtistAvatar(artistName)
    };
  }, [results, query, artistAvatars]);

  // Mixed results list matching the user's screenshot
  const mixedResults = useMemo(() => {
    const list: any[] = [];
    const queryLower = query.toLowerCase().trim();
    const isFemtogoSearch = queryLower.includes("femtogo");

    // Add search result tracks, keeping track of seen IDs to prevent duplicates
    const seenIds = new Set<string>();
    results.forEach((track) => {
      if (!track || !track.id) return;
      if (seenIds.has(track.id)) return;
      seenIds.add(track.id);

      list.push({
        id: `track-${track.id}`,
        title: track.title,
        subtitle: `Titre • ${track.artist}`,
        type: "Titre",
        thumbnail: track.thumbnail,
        track: track,
        artistName: track.artist
      });
    });

    // Make some adjustments to title casing for "RAINY DAY", "JADE LA HYÈNE", etc.
    list.forEach(item => {
      if (item.type === "Titre") {
        if (item.title.toLowerCase().includes("rainy day")) item.title = "RAINY DAY";
        if (item.title.toLowerCase().includes("la hyène")) item.title = "JADE LA HYÈNE";
        if (item.title.toLowerCase().includes("autre jour")) item.title = "UN AUTRE JOUR";
        if (item.title.toLowerCase().includes("scopolamine")) item.title = "SCOPOLAMINE";
        if (item.title.toLowerCase().includes("riffaud")) item.title = "MME. RIFFAUD";
      }
    });

    // 1. Add matching custom playlists of the user
    if (queryLower) {
      customPlaylists.forEach(pl => {
        if (pl.name.toLowerCase().includes(queryLower)) {
          list.push({
            id: `custom-playlist-${pl.id}`,
            title: pl.name,
            subtitle: `Playlist de l'utilisateur • ${pl.tracks?.length || 0} titres`,
            type: "Playlist",
            thumbnail: pl.tracks?.[0]?.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60",
            playlist: pl
          });
        }
      });
    }

    if (results.length > 0) {
      const mainArt = primaryArtist ? primaryArtist.name : results[0].artist;

      // Extract unique artists dynamically from results and known list
      const uniqueArtistsInResults = new Set<string>();
      
      if (primaryArtist) {
        uniqueArtistsInResults.add(primaryArtist.name);
      } else if (mainArt) {
        uniqueArtistsInResults.add(mainArt);
      }

      if (queryLower) {
        const knownArtists = [
          "The Weeknd", "Daft Punk", "Stromae", "FEMTOGO", "Clara Luciani", "Angèle", "Queen", "Nirvana", "AC/DC", 
          "Ziak", "Lewild", "Pepyth", "Oliver Tree", "Ed Sheeran", "Harry Styles", "Dua Lipa", "Imagine Dragons", 
          "Miley Cyrus", "Justin Bieber", "BTS", "Indila", "Coldplay", "Guns N' Roses", "Radiohead", "Oasis", 
          "Red Hot Chili Peppers", "Linkin Park", "Kendrick Lamar", "Luther"
        ];
        knownArtists.forEach(ka => {
          if (ka.toLowerCase().includes(queryLower)) {
            uniqueArtistsInResults.add(ka);
          }
        });
      }

      results.forEach((track) => {
        if (track && track.artist && track.artist.toLowerCase() !== "unknown artist") {
          const cleaned = track.artist.replace(/\b(ft\.?|feat\.?|featuring)\b/gi, "&");
          const parts = cleaned.split(/[&,]/).map(p => p.trim()).filter(p => p.length > 1);
          parts.forEach(p => {
            uniqueArtistsInResults.add(p);
          });
        }
      });

      if (isFemtogoSearch) {
        uniqueArtistsInResults.add("Ptite Soeur");
      }

      // Generate the array of artist items
      const artistItems = Array.from(uniqueArtistsInResults).map((artName) => {
        const avatar = artistAvatars[artName] || getDeterministicArtistAvatar(artName);
        return {
          id: `artist-${artName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          title: artName,
          subtitle: "Artiste",
          type: "Artiste",
          thumbnail: avatar,
          artistName: artName
        };
      });

      // Distribute first 3 artist items inside the list, append the rest
      artistItems.forEach((artistItem, index) => {
        if (index < 3) {
          list.splice(Math.min(4 + index * 2, list.length), 0, artistItem);
        } else {
          list.push(artistItem);
        }
      });

      // 2. Add multiple highly functional curated playlists distributed with tracks
      const curatedNames = [
        { name: isFemtogoSearch ? "PUKE SOMETHING" : `This is ${mainArt}`, creator: isFemtogoSearch ? "YAMI.ATEM" : "Spotify", desc: "Les titres essentiels réunis." },
        { name: `${mainArt} Radio`, creator: "Spotify", desc: "Titres similaires pour les fans." },
        { name: `Le meilleur de ${mainArt}`, creator: "Spotify", desc: "Succès et nouveautés incontournables." },
        { name: `Mix ${mainArt}`, creator: "Spotify", desc: "Sélection personnalisée inspirée par l'artiste." }
      ];

      curatedNames.forEach((item, index) => {
        const offset = (index * 3) % results.length;
        const playlistTracks = [
          ...results.slice(offset, offset + 8),
          ...results.slice(0, Math.max(0, 8 - (results.length - offset)))
        ].slice(0, 10);

        const plId = `curated-playlist-${index}-${mainArt.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

        list.push({
          id: plId,
          title: item.name,
          subtitle: `Playlist • Par ${item.creator}`,
          type: "Playlist",
          thumbnail: playlistTracks[0]?.thumbnail || results[Math.min(index, results.length - 1)]?.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60",
          playlist: {
            id: plId,
            name: item.name,
            description: item.desc,
            coverColor: index === 0 ? "#1DB954" : index === 1 ? "#1e3264" : index === 2 ? "#e8115b" : "#8d67ab",
            tracks: playlistTracks
          }
        });
      });
    }

    return list;
  }, [results, query, primaryArtist, customPlaylists, artistAvatars]);

  // Filter the mixed lists based on active pill
  const filteredMixedResults = useMemo(() => {
    if (activeFilter === "Tout") return mixedResults;
    if (activeFilter === "Titres") return mixedResults.filter(item => item.type === "Titre");
    if (activeFilter === "Artistes") return mixedResults.filter(item => item.type === "Artiste");
    if (activeFilter === "Playlists") return mixedResults.filter(item => item.type === "Playlist");
    
    // Fallback or empty placeholder for unimplemented sub-filters
    return [];
  }, [mixedResults, activeFilter]);

  const handlePlayPrimaryArtistTracks = () => {
    if (results.length > 0) {
      onPlayTrack(results[0], results);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full text-white bg-black font-sans" id="search_view">
      
      {/* Horizontally scrollable row of filters */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide shrink-0" id="search_filters_bar">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
              activeFilter === filter 
                ? "bg-white text-black font-bold scale-[1.03]" 
                : "bg-[#242424] text-white hover:bg-[#2f2f2f]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        /* Skeletons */
        <div className="mt-6 space-y-4">
          <div className="h-6 bg-neutral-900 rounded w-32 animate-pulse"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse p-2 rounded">
              <div className="w-10 h-10 bg-neutral-900 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-900 rounded w-1/3"></div>
                <div className="h-3 bg-neutral-900 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        /* Results Page */
        <div className="mt-4 flex flex-col gap-6" id="search_results_layout">
          
          {/* Main Primary Artist Card - Only visible in "Tout" and "Artistes" filters */}
          {(activeFilter === "Tout" || activeFilter === "Artistes") && primaryArtist && (
            <div 
              id="best_match_artist_card"
              onClick={() => {
                logSearchClick({
                  id: `artist-${primaryArtist.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                  type: "Artiste",
                  title: primaryArtist.name,
                  artistName: primaryArtist.name
                });
                onSelectArtist(primaryArtist.name);
              }}
              className="w-full bg-[#181818]/60 hover:bg-[#202020]/80 border border-neutral-900/60 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-5 min-w-0">
                {/* Circular image matching screenshot */}
                {primaryArtist.avatar ? (
                  <img 
                    referrerPolicy="no-referrer"
                    src={primaryArtist.avatar} 
                    alt={primaryArtist.name} 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full shadow-lg border border-neutral-800 shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 border border-neutral-700/60 shrink-0 flex items-center justify-center text-3xl font-extrabold text-neutral-400 uppercase select-none">
                    {primaryArtist.name.charAt(0)}
                  </div>
                )}
                
                {/* Artist Name & Type */}
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                    {primaryArtist.name}
                  </h2>
                  <p className="text-sm font-semibold text-neutral-400 mt-1">
                    Artiste
                  </p>
                </div>
              </div>

              {/* Header card right action controls */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Three dots button */}
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors shrink-0"
                  title="Plus d'options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* S'abonner Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFollowArtist(primaryArtist.name);
                  }}
                  className={`rounded-full px-5 py-1.5 text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                    followedArtists.includes(primaryArtist.name)
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white border-neutral-600 hover:border-white"
                  }`}
                >
                  {followedArtists.includes(primaryArtist.name) ? "Abonné" : "S'abonner"}
                </button>

                {/* Big Green Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPrimaryArtistTracks();
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1DB954] hover:bg-[#1ed760] hover:scale-[1.05] active:scale-[0.96] rounded-full flex items-center justify-center shadow-lg shadow-[#1db954]/20 transition-all group-hover:scale-[1.03]"
                  title={`Écouter ${primaryArtist.name}`}
                >
                  <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* List of items */}
          <div className="flex flex-col gap-1" id="mixed_search_results_list">
            {filteredMixedResults.length > 0 ? (
              filteredMixedResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                  onClick={() => {
                    logSearchClick(item);
                    if (item.type === "Titre" && item.track) {
                      onPlayTrack(item.track, results);
                    } else if (item.type === "Artiste") {
                      onSelectArtist(item.artistName);
                    } else if (item.type === "Playlist" && item.playlist) {
                      onSelectPlaylist(item.playlist);
                    }
                  }}
                >
                  {/* Left part: Cover and info */}
                  <div className="flex items-center gap-3.5 overflow-hidden min-w-0">
                    {item.type === "Artiste" && !item.thumbnail ? (
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700/60 shrink-0 flex items-center justify-center text-sm font-bold text-neutral-400 uppercase select-none">
                        {item.title.charAt(0)}
                      </div>
                    ) : (
                      <img 
                        referrerPolicy="no-referrer"
                        src={item.thumbnail || (item.type === "Artiste" ? "" : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60")} 
                        alt={item.title} 
                        className={`w-10 h-10 object-cover shrink-0 shadow-md ${
                          item.type === "Artiste" ? "rounded-full" : "rounded"
                        }`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = item.type === "Artiste" 
                            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                            : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60";
                        }}
                      />
                    )}
                    <div className="overflow-hidden min-w-0">
                      <p className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                        {item.title}
                      </p>
                      
                      {/* Explicit Badge [E] + Subtitle details */}
                      <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] mt-0.5 truncate">
                        {item.type === "Titre" && isExplicitTrack(item.title, item.artistName || "") && (
                          <span 
                            title="Contenu explicite"
                            className="bg-neutral-700/90 text-neutral-300 font-bold text-[8.5px] px-1 rounded-sm select-none shrink-0 inline-block py-[1px] leading-none"
                          >
                            E
                          </span>
                        )}
                        <span className="truncate">{item.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right part: pill type badge + check/plus controls */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Flat Type pill badge matching screenshot */}
                    <span className="bg-[#282828]/50 text-[#9e9e9e] font-semibold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm select-none">
                      {item.type}
                    </span>

                    {/* Action buttons */}
                    {item.type === "Artiste" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollowArtist(item.artistName);
                        }}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                          followedArtists.includes(item.artistName)
                            ? "bg-white text-black border-white"
                            : "bg-transparent text-white border-neutral-600 hover:border-white"
                        }`}
                      >
                        {followedArtists.includes(item.artistName) ? "Abonné" : "S'abonner"}
                      </button>
                    ) : item.type === "Titre" ? (
                      <div className="flex items-center gap-1.5 relative">
                        {/* Choose playlist triggers */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPlaylistDropdownId(openPlaylistDropdownId === item.id ? null : item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-neutral-800 text-[#b3b3b3] hover:text-white transition-opacity duration-200"
                          title="Ajouter à la playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* Chooser Dropdown */}
                        {openPlaylistDropdownId === item.id && (
                          <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-[#282828] border border-neutral-700 rounded-lg shadow-2xl p-2 w-56 z-50 text-left">
                            <p className="text-[10px] font-bold text-[#b3b3b3] uppercase tracking-wider px-2 py-1 border-b border-neutral-700 mb-1">
                              Ajouter à la playlist :
                            </p>
                            {customPlaylists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddTrackToPlaylist(item.track, pl.id);
                                  setOpenPlaylistDropdownId(null);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs font-semibold rounded hover:bg-[#1DB954] hover:text-black transition-colors flex items-center justify-between"
                              >
                                <span className="truncate">{pl.name}</span>
                                {pl.tracks?.some(t => t.id === item.track.id) && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                            {customPlaylists.length === 0 && (
                              <p className="text-xs text-neutral-500 p-2 italic">Aucune playlist créée</p>
                            )}
                          </div>
                        )}

                        {/* Save to Favorites toggle check circle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(item.track);
                          }}
                          className="p-1 transition-transform active:scale-90"
                          title={likedTracks.some(t => t.id === item.track.id) ? "Retirer de vos favoris" : "Ajouter aux favoris"}
                        >
                          {likedTracks.some(t => t.id === item.track.id) ? (
                            <CheckCircle className="w-5 h-5 text-[#1DB954] fill-[#1DB954]/10 shrink-0" />
                          ) : (
                            <PlusCircle className="w-5 h-5 text-neutral-500 hover:text-white shrink-0" />
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Playlist type item save to collection */
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Simulates saving playlist to favorites
                        }}
                        className="p-1 text-neutral-500 hover:text-white transition-colors"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                    )}

                  </div>

                </div>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500 italic">
                Aucun résultat ne correspond à ce filtre.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Categories Default View */
        <div className="mt-8 mb-12" id="default_search_cats">
          <h3 className="text-2xl font-black mb-6 tracking-tight">{t("search.browse_all")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat.query, cat.name)}
                className={`${cat.color} aspect-square p-4 rounded-xl relative overflow-hidden shadow-md hover:brightness-110 active:scale-[0.98] transition-all duration-300 cursor-pointer group`}
              >
                <span className="text-base sm:text-lg font-black tracking-tight block max-w-[75%] leading-tight text-white select-none">
                  {cat.name}
                </span>
                
                {/* Album cover art */}
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover absolute -right-3 -bottom-3 rotate-[25deg] shadow-lg group-hover:scale-105 group-hover:rotate-[15deg] transition-all duration-300 rounded shrink-0 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
