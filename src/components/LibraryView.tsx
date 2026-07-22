import React from "react";
import { Heart, Plus, Music, Library, Sparkles, UserCheck, ChevronRight, LogIn } from "lucide-react";
import { Playlist, Track } from "../types";
import PlaylistCover from "./PlaylistCover";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";
import { CURATED_PLAYLISTS } from "../data/curatedPlaylists";

interface LibraryViewProps {
  customPlaylists: Playlist[];
  likedTracks: Track[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onSelectLikedSongs: () => void;
  user: any;
  followedArtists: string[];
  onSelectArtist: (artistName: string) => void;
  artistAvatars?: Record<string, string>;
  onOpenAuth?: () => void;
}

export default function LibraryView({
  customPlaylists,
  likedTracks,
  onCreatePlaylist,
  onSelectPlaylist,
  onSelectLikedSongs,
  user,
  followedArtists,
  onSelectArtist,
  artistAvatars = {},
  onOpenAuth
}: LibraryViewProps) {
  const [filter, setFilter] = React.useState<"all" | "playlists" | "artists">("all");

  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full text-white pb-36 md:pb-28" id="library_view">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ma Bibliothèque</h1>
            <p className="text-xs text-neutral-400 font-medium">Vos titres, playlists et artistes favoris</p>
          </div>
        </div>

        {!user?.isGuest && (
          <button
            onClick={onCreatePlaylist}
            className="flex items-center gap-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs px-3.5 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1db954]/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer</span>
          </button>
        )}
      </div>

      {/* Guest Banner if applicable */}
      {user?.isGuest && (
        <div className="bg-gradient-to-r from-neutral-900 via-[#181824] to-neutral-900 border border-neutral-800 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Mode Invité</p>
              <p className="text-xs text-neutral-400">Connectez-vous pour sauvegarder vos playlists et favoris dans le cloud.</p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="bg-white hover:bg-neutral-200 text-black font-bold text-xs px-4 py-2 rounded-full transition-all shrink-0 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Connexion
            </button>
          )}
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filter === "all" ? "bg-white text-black" : "bg-[#242424] text-neutral-300 hover:bg-[#2d2d2d]"
          }`}
        >
          Tout
        </button>
        <button
          onClick={() => setFilter("playlists")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filter === "playlists" ? "bg-white text-black" : "bg-[#242424] text-neutral-300 hover:bg-[#2d2d2d]"
          }`}
        >
          Playlists ({customPlaylists.length + CURATED_PLAYLISTS.length})
        </button>
        <button
          onClick={() => setFilter("artists")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filter === "artists" ? "bg-white text-black" : "bg-[#242424] text-neutral-300 hover:bg-[#2d2d2d]"
          }`}
        >
          Artistes ({followedArtists.length})
        </button>
      </div>

      {/* 1. Liked Songs Banner Card */}
      {(filter === "all" || filter === "playlists") && (
        <div
          onClick={onSelectLikedSongs}
          className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-neutral-900/60 hover:from-purple-900/60 hover:via-indigo-900/50 hover:to-neutral-900/80 border border-indigo-500/20 p-4 sm:p-5 rounded-2xl mb-6 flex items-center justify-between cursor-pointer transition-all group shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Heart className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#1DB954] transition-colors">
                Titres Likés
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                {likedTracks.length} {likedTracks.length > 1 ? "morceaux enregistrés" : "morceau enregistré"}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-300 group-hover:bg-[#1DB954] group-hover:text-black transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* 2. Custom Playlists */}
      {(filter === "all" || filter === "playlists") && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Vos Playlists Personnel</h2>
            {!user?.isGuest && (
              <button
                onClick={onCreatePlaylist}
                className="text-xs font-bold text-[#1DB954] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nouvelle playlist
              </button>
            )}
          </div>

          {customPlaylists.length === 0 ? (
            <div className="bg-[#121218]/60 border border-neutral-800/80 rounded-2xl p-6 text-center">
              <Music className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-300">Aucune playlist créée</p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Créez votre première playlist pour organiser vos titres favoris.</p>
              {!user?.isGuest && (
                <button
                  onClick={onCreatePlaylist}
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs px-4 py-2 rounded-full transition-all"
                >
                  Créer une playlist
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {customPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="bg-[#12121c]/60 hover:bg-[#1a1a28] border border-white/5 p-3 rounded-2xl cursor-pointer transition-all group active:scale-95"
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative shadow-lg">
                    <PlaylistCover playlist={pl} size="md" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {pl.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {pl.tracks?.length || 0} titres
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Followed Artists */}
      {(filter === "all" || filter === "artists") && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Artistes Suivis ({followedArtists.length})</h2>

          {followedArtists.length === 0 ? (
            <div className="bg-[#121218]/60 border border-neutral-800/80 rounded-2xl p-6 text-center">
              <UserCheck className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-300">Aucun artiste suivi</p>
              <p className="text-xs text-neutral-500 mt-1">Recherchez vos artistes favoris et cliquez sur "Suivre".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {followedArtists.map((artist) => {
                const avatarUrl = artistAvatars[artist] || getDeterministicArtistAvatar(artist);
                return (
                  <div
                    key={artist}
                    onClick={() => onSelectArtist(artist)}
                    className="bg-[#12121c]/60 hover:bg-[#1a1a28] border border-white/5 p-3 rounded-2xl cursor-pointer transition-all text-center group active:scale-95"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mx-auto mb-2.5 border-2 border-white/10 shadow-lg group-hover:border-[#1DB954] transition-all">
                      <img
                        referrerPolicy="no-referrer"
                        src={avatarUrl}
                        alt={artist}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                      {artist}
                    </p>
                    <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider mt-0.5">
                      Artiste
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Curated Playlists */}
      {(filter === "all" || filter === "playlists") && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Playlists Recommandées</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {CURATED_PLAYLISTS.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="bg-[#12121c]/60 hover:bg-[#1a1a28] border border-white/5 p-3 rounded-2xl cursor-pointer transition-all group active:scale-95"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative shadow-lg">
                  <PlaylistCover playlist={pl} size="md" />
                </div>
                <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                  {pl.name}
                </p>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {pl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
