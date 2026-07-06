import React from "react";
import { Play, Trash2, Music, Clock, Sparkles, Search, SlidersHorizontal, Check, ArrowUp, ArrowDown, X, Shuffle } from "lucide-react";
import { Track, Playlist } from "../types";
import PlaylistCover from "./PlaylistCover";

interface PlaylistViewProps {
  playlist: Playlist | null; // null represents Liked Songs
  likedTracks: Track[];
  onPlayTrack: (track: Track, contextList: Track[]) => void;
  onRemoveTrackFromPlaylist?: (trackId: string, playlistId: string) => void;
  onRemoveLikedSong?: (trackId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onSelectArtist: (artistName: string) => void;
  onImportPlaylist?: (playlist: Playlist) => void;
  isCurated?: boolean;
  onOpenSpotifyImport?: () => void;
  
  // Shuffle Mode Support
  shuffleMode?: number;
  onShuffleToggle?: () => void;
}

export default function PlaylistView({
  playlist,
  likedTracks,
  onPlayTrack,
  onRemoveTrackFromPlaylist,
  onRemoveLikedSong,
  onDeletePlaylist,
  onSelectArtist,
  onImportPlaylist,
  isCurated = false,
  onOpenSpotifyImport,
  shuffleMode = 0,
  onShuffleToggle
}: PlaylistViewProps) {
  
  const isLikedSongs = playlist === null;
  const tracks = isLikedSongs ? likedTracks : (playlist.tracks || []);
  const title = isLikedSongs ? "Titres Likés" : playlist.name;
  const description = isLikedSongs 
    ? "Tous vos morceaux préférés, sauvegardés automatiquement." 
    : (playlist.description || "Ma playlist personnalisée.");
  const coverColor = isLikedSongs ? "from-indigo-900 to-indigo-600" : `from-[#2a2a2a] to-[#121212]`;

  // Search & sorting state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"title" | "recent" | "artist" | "album">("recent");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = React.useState<"compact" | "list">("list");
  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);

  // 1. Filter tracks based on search query
  const filteredTracks = React.useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const query = searchQuery.toLowerCase().trim();
    return tracks.filter((track) => {
      const matchTitle = track.title?.toLowerCase().includes(query);
      const matchArtist = track.artist?.toLowerCase().includes(query);
      const matchAlbum = track.album?.toLowerCase().includes(query);
      return matchTitle || matchArtist || matchAlbum;
    });
  }, [tracks, searchQuery]);

  // 2. Sort tracks based on active sort options
  const sortedTracks = React.useMemo(() => {
    if (sortBy === "recent") return filteredTracks;
    
    return [...filteredTracks].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "artist") {
        comparison = (a.artist || "").localeCompare(b.artist || "");
      } else if (sortBy === "album") {
        comparison = (a.album || "").localeCompare(b.album || "");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredTracks, sortBy, sortDirection]);

  const handlePlayAll = () => {
    if (sortedTracks.length > 0) {
      onPlayTrack(sortedTracks[0], sortedTracks);
    }
  };

  return (
    <div className="h-full overflow-y-auto text-white select-none pb-24" id="playlist_detailed_view">
      
      {/* 1. Playlist Header */}
      <div 
        className={`bg-gradient-to-b ${coverColor} p-6 md:p-8 flex flex-col md:flex-row items-end gap-6 pt-16`}
        style={!isLikedSongs && playlist.coverColor ? { backgroundImage: `linear-gradient(to bottom, ${playlist.coverColor}80, #121212)` } : undefined}
      >
        {/* Cover Art */}
        <PlaylistCover playlist={playlist} isLikedSongs={isLikedSongs} size="lg" />

        {/* Text descriptions */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1DB954] mb-2">Playlist</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-white truncate">{title}</h1>
          <p className="text-sm text-neutral-300 mb-2 leading-relaxed">{description}</p>
          <p className="text-xs text-[#b3b3b3] font-medium">
            <span className="text-white font-semibold">Spotify Clone</span> • {tracks.length} titres
          </p>
        </div>

        {/* Delete Playlist button (Custom only) */}
        {!isLikedSongs && !isCurated && onDeletePlaylist && (
          <button
            id="delete_custom_playlist_btn"
            onClick={() => onDeletePlaylist(playlist.id)}
            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2 transition-colors self-end md:self-auto shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer la Playlist
          </button>
        )}

        {/* Import Playlist button (Curated only) */}
        {!isLikedSongs && isCurated && onImportPlaylist && (
          <button
            id="import_curated_playlist_btn"
            onClick={() => onImportPlaylist(playlist)}
            className="flex items-center gap-2 text-xs font-bold text-black hover:bg-[#1ed760] bg-[#1DB954] rounded-full px-5 py-2.5 transition-all hover:scale-105 active:scale-95 self-end md:self-auto shrink-0 shadow-lg shadow-[#1db954]/10"
          >
            <Sparkles className="w-4 h-4 fill-current text-black" /> Importer la Playlist
          </button>
        )}

        {/* Transfer Spotify Playlist button (Liked Songs only) */}
        {isLikedSongs && onOpenSpotifyImport && (
          <button
            id="transfer_spotify_playlist_btn"
            onClick={onOpenSpotifyImport}
            className="flex items-center gap-2 text-xs font-bold text-white hover:bg-[#1ed760]/20 bg-[#1DB954]/10 border border-[#1DB954]/40 hover:border-[#1DB954] rounded-full px-5 py-2.5 transition-all hover:scale-105 active:scale-95 self-end md:self-auto shrink-0 shadow-lg shadow-[#1db954]/5"
          >
            <Sparkles className="w-4 h-4 fill-current text-[#1DB954]" /> Transférer Spotify
          </button>
        )}
      </div>

      {/* 2. Control Play Bar */}
      <div className="p-6 md:p-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            id="playlist_play_btn"
            onClick={handlePlayAll}
            disabled={sortedTracks.length === 0}
            className="w-14 h-14 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1db954]/10 disabled:opacity-45 disabled:pointer-events-none"
          >
            <Play className="w-6 h-6 text-black fill-current translate-x-[1px]" />
          </button>

          {onShuffleToggle && (
            <button
              id="playlist_shuffle_btn"
              onClick={onShuffleToggle}
              disabled={sortedTracks.length === 0}
              className={`relative p-3 rounded-full hover:bg-white/5 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex flex-col items-center justify-center ${
                shuffleMode === 1 || shuffleMode === 2 
                  ? "text-[#1DB954] scale-105" 
                  : "text-[#b3b3b3] hover:text-white"
              }`}
              title={
                shuffleMode === 0 
                  ? "Activer la lecture aléatoire" 
                  : shuffleMode === 1 
                    ? (isLikedSongs ? "Activer l'Aléatoire Intelligent (Smart Shuffle)" : "Désactiver la lecture aléatoire")
                    : "Désactiver l'Aléatoire Intelligent (Smart Shuffle)"
              }
            >
              <div className="relative">
                <Shuffle className="w-6 h-6" />
                {shuffleMode === 2 && (
                  <Sparkles className="w-3 h-3 text-[#1DB954] absolute -top-1.5 -left-1.5 fill-current animate-pulse" />
                )}
              </div>
              {(shuffleMode === 1 || shuffleMode === 2) && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-[#1DB954] rounded-full shadow-[0_0_4px_#1DB954]" />
              )}
            </button>
          )}
        </div>

        {/* Interactive Search, Sort & Density view bar */}
        <div className="flex items-center gap-3 relative shrink-0">
          {/* Search Trigger */}
          <div className="flex items-center relative">
            {isSearchExpanded ? (
              <div className="flex items-center bg-white/10 rounded-full pl-3 pr-2 py-1.5 border border-white/10 animate-fadeIn focus-within:border-white/20 transition-all">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-400 pl-2 pr-1 w-32 sm:w-48 font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-0.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchQuery("");
                  }} 
                  className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                title="Rechercher dans la playlist"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sort Selection & Display Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-all text-xs font-bold tracking-wide border border-neutral-800 bg-neutral-900/40"
            >
              <span className="text-[#1DB954]">
                {sortBy === "recent" ? "Ajoutés récemment" : sortBy === "title" ? "Titre" : sortBy === "artist" ? "Artiste" : "Album"}
              </span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Custom Interactive Dropdown Menu */}
            {isSortMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSortMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-[#181818] border border-neutral-800 rounded-lg shadow-2xl p-1.5 z-50 animate-fadeIn text-left">
                  {/* Section: Trier par */}
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Trier par
                  </div>
                  
                  <button
                    onClick={() => {
                      if (sortBy === "title") {
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("title");
                        setSortDirection("asc");
                      }
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      sortBy === "title" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Titre</span>
                    {sortBy === "title" && (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("recent");
                      setSortDirection("asc");
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      sortBy === "recent" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Ajoutés récemment</span>
                    {sortBy === "recent" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (sortBy === "artist") {
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("artist");
                        setSortDirection("asc");
                      }
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      sortBy === "artist" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Artiste</span>
                    {sortBy === "artist" && (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (sortBy === "album") {
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("album");
                        setSortDirection("asc");
                      }
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      sortBy === "album" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Album</span>
                    {sortBy === "album" && (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="h-[1px] bg-neutral-800 my-1.5" />

                  {/* Section: Mode d'affichage */}
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Mode d'affichage
                  </div>

                  <button
                    onClick={() => {
                      setViewMode("compact");
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      viewMode === "compact" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Compact</span>
                    {viewMode === "compact" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setViewMode("list");
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors hover:bg-white/5 ${
                      viewMode === "list" ? "text-[#1DB954]" : "text-white/90"
                    }`}
                  >
                    <span>Liste</span>
                    {viewMode === "list" && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Table list */}
      <div className="px-6 md:px-8">
        {tracks.length > 0 ? (
          sortedTracks.length > 0 ? (
            <div className="flex flex-col gap-1">
              {/* Table headers */}
              <div className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider border-b border-neutral-800 ${
                viewMode === "compact" ? "mb-1.5" : "mb-3"
              }`}>
                <span className="w-6 text-center">#</span>
                <span>Titre</span>
                <span>Artiste</span>
                <span className="flex justify-end pr-2"><Clock className="w-4 h-4" /></span>
              </div>

              {/* List entries */}
              {sortedTracks.map((track, idx) => (
                <div 
                  key={`${track.id}-${idx}`}
                  className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 rounded-md hover:bg-white/5 transition-colors group relative cursor-pointer ${
                    viewMode === "compact" ? "py-1.5" : "py-2.5"
                  }`}
                  onClick={() => onPlayTrack(track, sortedTracks)}
                >
                  {/* Index / Hover play */}
                  <div className="w-6 flex items-center justify-center">
                    <span className="group-hover:hidden text-[#b3b3b3] font-mono text-xs">{idx + 1}</span>
                    <Play className="hidden group-hover:block w-3.5 h-3.5 text-white fill-current shrink-0" />
                  </div>

                  {/* Cover & Title */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img 
                      referrerPolicy="no-referrer" 
                      src={track.thumbnail} 
                      alt={track.title} 
                      className={`object-cover rounded shrink-0 transition-all ${
                        viewMode === "compact" ? "w-6 h-6" : "w-10 h-10"
                      }`} 
                    />
                    <p className={`font-semibold truncate text-white max-w-sm ${
                      viewMode === "compact" ? "text-xs" : "text-sm"
                    }`}>{track.title}</p>
                  </div>

                  {/* Artist clickable */}
                  <p 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(track.artist);
                    }}
                    className={`text-[#b3b3b3] truncate hover:underline hover:text-white ${
                      viewMode === "compact" ? "text-xs" : "text-sm"
                    }`}
                  >
                    {track.artist}
                  </p>

                  {/* Duration & Remove button */}
                  <div className="flex items-center gap-4 justify-end relative">
                    <span className="text-xs text-[#b3b3b3] font-mono pr-2">{track.duration}</span>
                    
                    {isLikedSongs && onRemoveLikedSong ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLikedSong(track.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-neutral-800 text-red-500 transition-opacity"
                        title="Enlever des Titres Likés"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : !isLikedSongs && onRemoveTrackFromPlaylist ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrackFromPlaylist(track.id, playlist.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-neutral-800 text-[#b3b3b3] hover:text-red-400 transition-opacity"
                        title="Retirer de la playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#6a6a6a] max-w-md mx-auto border border-dashed border-[#282828] rounded-xl p-8 bg-[#181818]/40">
              <Search className="w-8 h-8 text-[#1DB954] mx-auto mb-3 opacity-50" />
              <h4 className="font-bold text-white mb-1">Aucun résultat</h4>
              <p className="text-xs mb-3">Aucun titre ne correspond à votre recherche "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-[#1DB954] hover:underline"
              >
                Réinitialiser le filtre
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-20 text-[#6a6a6a] max-w-md mx-auto border border-dashed border-[#282828] rounded-xl p-8 bg-[#181818]/40">
            <Sparkles className="w-8 h-8 text-[#1DB954] mx-auto mb-3 opacity-50" />
            <h4 className="font-bold text-white mb-1">Cette playlist est vide</h4>
            <p className="text-xs">Recherchez vos morceaux favoris dans l'onglet Rechercher et cliquez sur le bouton "+" pour les ajouter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
