import React from "react";
import { Play, Trash2, Music, Clock, Sparkles } from "lucide-react";
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
  isCurated = false
}: PlaylistViewProps) {
  
  const isLikedSongs = playlist === null;
  const tracks = isLikedSongs ? likedTracks : (playlist.tracks || []);
  const title = isLikedSongs ? "Titres Likés" : playlist.name;
  const description = isLikedSongs 
    ? "Tous vos morceaux préférés, sauvegardés automatiquement." 
    : (playlist.description || "Ma playlist personnalisée.");
  const coverColor = isLikedSongs ? "from-indigo-900 to-indigo-600" : `from-[#2a2a2a] to-[#121212]`;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks);
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
      </div>

      {/* 2. Control Play Bar */}
      <div className="p-6 md:p-8 flex items-center gap-6">
        <button 
          id="playlist_play_btn"
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1db954]/10 disabled:opacity-45 disabled:pointer-events-none"
        >
          <Play className="w-6 h-6 text-black fill-current translate-x-[1px]" />
        </button>
      </div>

      {/* 3. Table list */}
      <div className="px-6 md:px-8">
        {tracks.length > 0 ? (
          <div className="flex flex-col gap-1">
            {/* Table headers */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider border-b border-neutral-800 mb-2">
              <span className="w-6 text-center">#</span>
              <span>Titre</span>
              <span>Artiste</span>
              <span className="flex justify-end pr-2"><Clock className="w-4 h-4" /></span>
            </div>

            {/* List entries */}
            {tracks.map((track, idx) => (
              <div 
                key={`${track.id}-${idx}`}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2.5 rounded-md hover:bg-white/5 transition-colors group relative cursor-pointer"
                onClick={() => onPlayTrack(track, tracks)}
              >
                {/* Index / Hover play */}
                <div className="w-6 flex items-center justify-center">
                  <span className="group-hover:hidden text-[#b3b3b3] font-mono text-sm">{idx + 1}</span>
                  <Play className="hidden group-hover:block w-4 h-4 text-white fill-current shrink-0" />
                </div>

                {/* Cover & Title */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <img referrerPolicy="no-referrer" src={track.thumbnail} alt={track.title} className="w-10 h-10 object-cover rounded shrink-0" />
                  <p className="font-semibold text-sm truncate text-white max-w-sm">{track.title}</p>
                </div>

                {/* Artist clickable */}
                <p 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist(track.artist);
                  }}
                  className="text-sm text-[#b3b3b3] truncate hover:underline hover:text-white"
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
            <Sparkles className="w-8 h-8 text-[#1DB954] mx-auto mb-3 opacity-50" />
            <h4 className="font-bold text-white mb-1">Cette playlist est vide</h4>
            <p className="text-xs">Recherchez vos morceaux favoris dans l'onglet Rechercher et cliquez sur le bouton "+" pour les ajouter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
