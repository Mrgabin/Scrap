import React from "react";
import { Play, Sparkles, RefreshCw, Disc, Music, Heart } from "lucide-react";
import { Track, Playlist } from "../types";
import { CURATED_PLAYLISTS } from "../data/curatedPlaylists";
import PlaylistCover from "./PlaylistCover";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";

interface HomeViewProps {
  onPlayTrack: (track: Track, contextList?: Track[]) => void;
  onSelectArtist: (artistName: string) => void;
  recentTracks: Track[];
  recommendations: Track[];
  homeFeedData: any;
  loadingFeed: boolean;
  loadingRecommendations: boolean;
  onRefreshRecommendations: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  followedArtists: string[];
  artistAvatars?: Record<string, string>;
  tasteProfile?: any;
  personalizedPlaylists?: Playlist[];
  playlists?: Playlist[];
  onOpenTasteSurvey?: () => void;
  onRegenerateMixes?: () => void;
  loadingPersonalized?: boolean;
  recommendationTimestamp?: number;
  user?: any;
  onSelectView?: (view: string) => void;
}

export default function HomeView({
  onPlayTrack,
  onSelectArtist,
  recentTracks,
  recommendations,
  homeFeedData,
  loadingFeed,
  loadingRecommendations,
  onRefreshRecommendations,
  onSelectPlaylist,
  followedArtists,
  artistAvatars,
  tasteProfile = null,
  personalizedPlaylists = [],
  playlists = [],
  onOpenTasteSurvey = () => {},
  onRegenerateMixes = () => {},
  loadingPersonalized = false,
  recommendationTimestamp = 0,
  user = null,
  onSelectView
}: HomeViewProps) {

  // Active Filter state for mobile tab chips ("Tout", "Musique", etc.)
  const [activeFilter, setActiveFilter] = React.useState<string>("Tout");

  // Calculate remaining time for the 30-min auto-refresh
  const [timeLeftStr, setTimeLeftStr] = React.useState<string>("");

  React.useEffect(() => {
    if (!recommendationTimestamp) {
      setTimeLeftStr("");
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      const nextUpdate = recommendationTimestamp + thirtyMinutes;
      const diff = nextUpdate - now;

      if (diff <= 0) {
        setTimeLeftStr("Prêt à renouveler");
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`Renouvellement auto dans ${minutes}:${seconds.toString().padStart(2, "0")} min`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [recommendationTimestamp]);
  
  // Dynamic Greeting based on real time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bon matin";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Build 8 elements for the top quick-access grid
  const quickGridItems: any[] = [];
  
  // 1. Liked Songs tile (always first)
  quickGridItems.push({
    id: "liked-songs",
    title: "Titres likés",
    type: "liked",
    thumbnail: "gradient",
  });
  
  // 2. AI DJ tile
  quickGridItems.push({
    id: "ai-dj",
    title: "DJ",
    type: "dj",
    thumbnail: "dj-gradient",
  });

  // 3. Discovery Weekly Quick Card
  quickGridItems.push({
    id: "discovery-weekly",
    title: "Découvertes de la Semaine",
    type: "discovery",
    thumbnail: "discovery-gradient"
  });

  // User playlists
  playlists.slice(0, 4).forEach((pl, index) => {
    if (quickGridItems.length < 8) {
      quickGridItems.push({
        id: `pl-${pl.id}-${index}`,
        title: pl.name,
        type: "playlist",
        playlist: pl,
        thumbnail: pl.tracks?.[0]?.thumbnail || ""
      });
    }
  });

  // Recent tracks
  recentTracks.slice(0, 4).forEach((track, index) => {
    if (quickGridItems.length < 8) {
      quickGridItems.push({
        id: `recent-${track.id}-${index}`,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        type: "track",
        track: track,
      });
    }
  });

  // Followed artists
  followedArtists.slice(0, 4).forEach((artist, index) => {
    if (quickGridItems.length < 8) {
      quickGridItems.push({
        id: `artist-${artist}-${index}`,
        title: artist,
        thumbnail: (artistAvatars && artistAvatars[artist]) || getDeterministicArtistAvatar(artist),
        type: "artist",
        artistName: artist,
      });
    }
  });

  // Fill remaining slots up to 8 with real Curated Playlists (not fake listening history)
  if (CURATED_PLAYLISTS && CURATED_PLAYLISTS.length > 0) {
    for (const pl of CURATED_PLAYLISTS) {
      if (quickGridItems.length >= 8) break;
      if (!quickGridItems.some(item => item.title === pl.name)) {
        quickGridItems.push({
          id: `curated-${pl.id}`,
          title: pl.name,
          type: "curated-playlist",
          playlist: pl,
          thumbnail: pl.tracks?.[0]?.thumbnail || ""
        });
      }
    }
  }

  const finalQuickGrid = quickGridItems.slice(0, 8);

  const handleQuickGridClick = (item: any) => {
    if (item.type === "liked") {
      onSelectView?.("liked-songs");
    } else if (item.type === "dj") {
      if (recommendations.length > 0) {
        onPlayTrack(recommendations[0], recommendations);
      } else if (recentTracks.length > 0) {
        onPlayTrack(recentTracks[0], recentTracks);
      } else if (homeFeedData?.trending?.tracks?.length > 0) {
        onPlayTrack(homeFeedData.trending.tracks[0], homeFeedData.trending.tracks);
      }
    } else if (item.type === "discovery") {
      if (recommendations.length > 0) {
        onPlayTrack(recommendations[0], recommendations);
      }
    } else if (item.type === "track" && item.track) {
      onPlayTrack(item.track, recentTracks);
    } else if (item.type === "artist" && item.artistName) {
      onSelectArtist(item.artistName);
    } else if (item.type === "playlist" && item.playlist) {
      onSelectPlaylist(item.playlist);
    } else if (item.type === "curated-playlist" && item.playlist) {
      onSelectPlaylist(item.playlist);
    }
  };

  return (
    <div className="p-3 sm:p-6 pb-36 md:pb-28 overflow-y-auto h-full text-white" id="home_view">
      
      {/* 0. Mobile-only Header Row with filter chips */}
      <div className="md:hidden flex items-center justify-between mb-4 select-none" id="mobile_header_row">
        <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1 pr-2 no-scrollbar scrollbar-none">
          {/* Scrolling filter pills */}
          <button 
            onClick={() => setActiveFilter("Tout")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === "Tout" ? "bg-[#1DB954] text-black" : "bg-[#222] text-white hover:bg-[#333]"
            }`}
          >
            Tout
          </button>
          <button 
            onClick={() => setActiveFilter("Musique")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === "Musique" ? "bg-[#1DB954] text-black" : "bg-[#222] text-white hover:bg-[#333]"
            }`}
          >
            Musique
          </button>
          <button 
            onClick={() => setActiveFilter("Podcasts")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === "Podcasts" ? "bg-[#1DB954] text-black" : "bg-[#222] text-white hover:bg-[#333]"
            }`}
          >
            Podcasts
          </button>
          <button 
            onClick={() => setActiveFilter("Livres aud")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === "Livres aud" ? "bg-[#1DB954] text-black" : "bg-[#222] text-white hover:bg-[#333]"
            }`}
          >
            Livres aud
          </button>
        </div>
      </div>

      {/* 1. Header Greeting & Quick Grid */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 tracking-tight">{getGreeting()}</h2>
        
        {/* Quick Access Grid: 2 columns on mobile, 3-4 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 font-sans" id="quick_grid">
          {finalQuickGrid.map((item, index) => (
            <div 
              key={item.id || `quick-grid-${index}`}
              onClick={() => handleQuickGridClick(item)}
              className="bg-white/[0.05] hover:bg-white/[0.1] transition-all duration-300 rounded overflow-hidden flex items-center gap-2 sm:gap-3 cursor-pointer group border border-transparent hover:border-white/5 h-12 sm:h-16"
            >
              {/* Thumbnail rendering based on item type */}
              {item.type === "liked" ? (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#450e74] via-[#5b169c] to-[#71169c] shadow-lg shrink-0 flex items-center justify-center relative">
                  <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-current" />
                </div>
              ) : item.type === "dj" ? (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0c2f6d] to-[#040f26] shadow-lg shrink-0 flex items-center justify-center relative overflow-hidden">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#1DB954] flex items-center justify-center animate-[spin_6s_linear_infinite] relative">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-[#1DB954] rounded-full absolute top-0" />
                  </div>
                  <span className="absolute text-[8px] sm:text-[9px] font-black tracking-widest text-[#1DB954]">DJ</span>
                </div>
              ) : item.type === "discovery" ? (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-800 to-emerald-500 shadow-xl shrink-0 flex items-center justify-center relative">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white absolute group-hover:scale-110 transition-transform" />
                </div>
              ) : (
                <img referrerPolicy="no-referrer" src={item.thumbnail} alt={item.title} className="w-12 h-12 sm:w-16 sm:h-16 object-cover shrink-0" />
              )}

              <div className="flex-1 min-w-0 pr-2 flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="font-bold text-[11px] sm:text-xs text-white truncate leading-snug">{item.title}</p>
                  {item.artist && (
                    <p className="text-[10px] text-[#b3b3b3] truncate mt-0.5 leading-snug">{item.artist}</p>
                  )}
                </div>
                {/* Desktop Play Indicator button */}
                <button className="hidden sm:flex w-8 h-8 bg-[#1DB954] rounded-full items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shrink-0">
                  <Play className="w-4 h-4 text-black fill-current translate-x-[0.5px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Intelligent AI Recommendations: "Découvertes de la Semaine" */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1DB954]" />
            <h3 className="text-2xl font-bold hover:underline cursor-pointer">Découvertes de la Semaine</h3>
          </div>
        </div>

        {loadingRecommendations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#181818] p-4 rounded-lg animate-pulse">
                <div className="w-full aspect-square bg-[#2a2a2a] rounded-md mb-4"></div>
                <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none gap-4 md:gap-5 no-scrollbar snap-x" id="recommendations_shelf">
            {recommendations.slice(0, 12).map((track, index) => (
              <div 
                key={`recommendation-${track.id}-${index}`}
                onClick={() => onPlayTrack(track, recommendations)}
                className="bg-[#181818] p-3 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer group border border-transparent hover:border-neutral-800 w-[145px] shrink-0 md:w-auto md:shrink snap-start"
              >
                <div className="relative mb-3">
                  <div className="w-full aspect-square bg-neutral-800 rounded shadow-lg overflow-hidden">
                    <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <button className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-[#1DB954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shrink-0">
                    <Play className="w-4 h-4 text-black fill-current translate-x-[1px]" />
                  </button>
                </div>
                <h4 className="font-bold text-xs mb-1 truncate text-white">{track.title}</h4>
                <p 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist(track.artist);
                  }}
                  className="text-[11px] text-[#b3b3b3] truncate hover:underline"
                >
                  {track.artist}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#181818] border border-dashed border-[#282828] p-8 rounded-xl text-center max-w-2xl mx-auto">
            <Sparkles className="w-8 h-8 text-[#1DB954] mx-auto mb-3 opacity-60" />
            <h4 className="font-bold mb-1">Votre Algorithme Intelligent</h4>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              Pour que notre recommandation génère des musiques sur-mesure, écoutez quelques morceaux depuis l'onglet Rechercher, puis cliquez sur "Recalculer l'algorithme" !
            </p>
          </div>
        )}
      </div>

      {/* Mes artistes suivis ❤️ */}
      {followedArtists && followedArtists.length > 0 && (
        <div className="mb-10" id="followed_artists_home_section">
          <h3 className="text-2xl font-black text-white tracking-tight mb-4">Mes artistes suivis ❤️</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {followedArtists.map((artist, index) => (
              <div
                key={`followed-artist-${artist}-${index}`}
                onClick={() => onSelectArtist(artist)}
                className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer flex flex-col items-center text-center shrink-0 w-36 border border-transparent hover:border-neutral-800"
              >
                <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-3xl text-neutral-400 shadow-xl mb-3 relative group overflow-hidden border border-neutral-700/60">
                  {(() => {
                    const avatarUrl = (artistAvatars && artistAvatars[artist]) || getDeterministicArtistAvatar(artist);
                    return (
                      <>
                        <img 
                          referrerPolicy="no-referrer" 
                          src={avatarUrl} 
                          alt={artist} 
                          className="w-full h-full object-cover animate-fade-in" 
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = getDeterministicArtistAvatar(artist);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
                      </>
                    );
                  })()}
                </div>
                <p className="font-bold text-xs text-white truncate w-full">{artist}</p>
                <p className="text-[10px] text-[#1DB954] font-medium mt-1 uppercase tracking-wider">Abonné</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Algorithmic & Personalized Playlists */}
      <div className="mb-10" id="personalized_mixes_section">
        {tasteProfile && personalizedPlaylists.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 border-b border-neutral-900 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-ping" />
                  <h3 className="text-2xl font-black text-white tracking-tight">Vos Mixs Algorithmiques Persos ⚡️</h3>
                </div>
                <p className="text-xs text-[#b3b3b3]">3 playlists sur-mesure de 25 titres chacune, actualisées selon vos goûts & historique.</p>
              </div>
              <button
                onClick={onRegenerateMixes}
                disabled={loadingPersonalized}
                className="flex items-center gap-2 text-xs text-black font-extrabold bg-[#1DB954] hover:bg-[#1ed760] transition-all rounded-full px-4 py-2 disabled:opacity-40 shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPersonalized ? "animate-spin" : ""}`} />
                Mettre à jour les mixes
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {personalizedPlaylists.map((pl) => (
                <div 
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer group border border-transparent hover:border-[#1DB954]/20 flex flex-col justify-between h-full relative overflow-hidden"
                >
                  <div className="relative mb-4">
                    <PlaylistCover playlist={pl} size="xl" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pl.tracks && pl.tracks.length > 0) {
                          onPlayTrack(pl.tracks[0], pl.tracks);
                        }
                      }}
                      className="absolute right-3 bottom-3 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shrink-0 z-10"
                    >
                      <Play className="w-5.5 h-5.5 text-black fill-current translate-x-[1px]" />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base mb-1 text-white group-hover:text-[#1DB954] transition-colors">{pl.name}</h4>
                    <p className="text-xs text-[#b3b3b3] line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {pl.description}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-900/60">
                      <span className="text-[10px] text-neutral-400 font-mono">Algorithme Scrap</span>
                      <span className="text-[10px] text-[#1DB954] font-bold bg-[#1DB954]/10 px-2 py-0.5 rounded-full">
                        {pl.tracks?.length || 0} morceaux
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-r from-neutral-900 via-[#121212] to-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DB954]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="text-left max-w-lg">
              <div className="flex items-center gap-2 text-[#1DB954] text-xs font-bold uppercase tracking-wider mb-2 bg-[#1DB954]/10 w-fit px-3 py-1 rounded-full border border-[#1DB954]/20">
                <Sparkles className="w-3.5 h-3.5" /> Exclusivité Scrap
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-snug">Vos mixes personnalisés vous attendent !</h3>
              <p className="text-xs text-[#b3b3b3] mt-2 leading-relaxed">
                Scrap peut composer 3 playlists hebdomadaires de 25 titres uniques en analysant vos genres musicaux favoris et vos rythmes de prédilection.
              </p>
            </div>
            <button
              onClick={onOpenTasteSurvey}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold rounded-full px-6 py-3 shadow-lg shadow-[#1DB954]/15 hover:scale-105 active:scale-95 transition-all text-xs shrink-0 tracking-wide uppercase"
            >
              Lancer le test de goûts ⚡️
            </button>
          </div>
        )}
      </div>

      {/* 3. Dynamic YouTube Music Categories */}
      {loadingFeed ? (
        <div className="space-y-8 animate-pulse">
          {[...Array(2)].map((_, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="h-6 bg-[#181818] rounded w-48 mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#181818] p-4 rounded-lg">
                    <div className="w-full aspect-square bg-[#2a2a2a] rounded mb-3"></div>
                    <div className="h-3 bg-[#2a2a2a] rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-[#2a2a2a] rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : homeFeedData ? (
        <div className="space-y-10" id="dynamic_feed_sections">
          
          {/* Section: Trending */}
          {homeFeedData.trending?.tracks?.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-2xl font-black text-white tracking-tight">Vos mix préférés</h3>
                <p className="text-xs text-[#b3b3b3]">{homeFeedData.trending.description || "Inspiré par vos écoutes récentes"}</p>
              </div>
              <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none gap-4 md:gap-5 no-scrollbar snap-x">
                {homeFeedData.trending.tracks.slice(0, 6).map((track: Track, index: number) => (
                  <div 
                    key={`trending-${track.id}-${index}`}
                    onClick={() => onPlayTrack(track, homeFeedData.trending.tracks)}
                    className="bg-[#181818] p-3 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer group border border-transparent hover:border-neutral-800 w-[145px] shrink-0 md:w-auto md:shrink snap-start"
                  >
                    <div className="relative mb-3">
                      <div className="w-full aspect-square bg-neutral-800 rounded shadow-lg overflow-hidden">
                        <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <button className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-[#1DB954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shrink-0">
                        <Play className="w-4 h-4 text-black fill-current translate-x-[1px]" />
                      </button>
                    </div>
                    <h4 className="font-bold text-xs mb-1 truncate text-white">{track.title}</h4>
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(track.artist);
                      }}
                      className="text-[11px] text-[#b3b3b3] truncate hover:underline"
                    >
                      {track.artist}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: New Releases */}
          {homeFeedData.newReleases?.tracks?.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-2xl font-black text-white tracking-tight">Sauvegardez les sorties à venir</h3>
                <p className="text-xs text-[#b3b3b3]">{homeFeedData.newReleases.description || "Nouveaux singles et albums sélectionnés pour vous"}</p>
              </div>
              <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none gap-4 md:gap-5 no-scrollbar snap-x">
                {homeFeedData.newReleases.tracks.slice(0, 6).map((track: Track, index: number) => (
                  <div 
                    key={`newrelease-${track.id}-${index}`}
                    onClick={() => onPlayTrack(track, homeFeedData.newReleases.tracks)}
                    className="bg-[#181818] p-3 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer group border border-transparent hover:border-neutral-800 w-[145px] shrink-0 md:w-auto md:shrink snap-start"
                  >
                    <div className="relative mb-3">
                      <div className="w-full aspect-square bg-neutral-800 rounded shadow-lg overflow-hidden">
                        <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <button className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-[#1DB954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shrink-0">
                        <Play className="w-4 h-4 text-black fill-current translate-x-[1px]" />
                      </button>
                    </div>
                    <h4 className="font-bold text-xs mb-1 truncate text-white">{track.title}</h4>
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(track.artist);
                      }}
                      className="text-[11px] text-[#b3b3b3] truncate hover:underline"
                    >
                      {track.artist}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Moods */}
          {homeFeedData.moods?.tracks?.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-2xl font-black text-white tracking-tight">{homeFeedData.moods.title}</h3>
                <p className="text-xs text-[#b3b3b3]">{homeFeedData.moods.description}</p>
              </div>
              <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none gap-4 md:gap-5 no-scrollbar snap-x">
                {homeFeedData.moods.tracks.slice(0, 6).map((track: Track, index: number) => (
                  <div 
                    key={`mood-${track.id}-${index}`}
                    onClick={() => onPlayTrack(track, homeFeedData.moods.tracks)}
                    className="bg-[#181818] p-3 rounded-xl hover:bg-[#282828] transition-all duration-300 cursor-pointer group border border-transparent hover:border-neutral-800 w-[145px] shrink-0 md:w-auto md:shrink snap-start"
                  >
                    <div className="relative mb-3">
                      <div className="w-full aspect-square bg-neutral-800 rounded shadow-lg overflow-hidden">
                        <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <button className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-[#1DB954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shrink-0">
                        <Play className="w-4 h-4 text-black fill-current translate-x-[1px]" />
                      </button>
                    </div>
                    <h4 className="font-bold text-xs mb-1 truncate text-white">{track.title}</h4>
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(track.artist);
                      }}
                      className="text-[11px] text-[#b3b3b3] truncate hover:underline"
                    >
                      {track.artist}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 text-[#6a6a6a]">
          Impossible de charger le contenu de la page d'accueil.
        </div>
      )}

    </div>
  );
}
