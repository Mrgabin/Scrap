import React, { useState } from "react";
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Music, 
  Heart, 
  Settings, 
  LogOut, 
  Disc 
} from "lucide-react";
import { Playlist, Track } from "../types";
import { auth } from "../firebase";
import PlaylistCover from "./PlaylistCover";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  customPlaylists: Playlist[];
  likedTracks: Track[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onSelectLikedSongs: () => void;
  user: any;
  onLogout: () => void;
  followedArtists: string[];
  onSelectArtist: (artistName: string) => void;
  artistAvatars?: Record<string, string>;
}

export default function Sidebar({
  currentView,
  setCurrentView,
  customPlaylists,
  likedTracks,
  onCreatePlaylist,
  onSelectPlaylist,
  onSelectLikedSongs,
  user,
  onLogout,
  followedArtists,
  onSelectArtist,
  artistAvatars
}: SidebarProps) {

  return (
    <nav className="w-[280px] shrink-0 flex flex-col gap-2 h-full select-none" id="spotify_sidebar">
      
      {/* Library, Playlists, Saved Songs */}
      <div className="bg-[#0a0a14]/30 backdrop-blur-md rounded-lg flex-1 flex flex-col overflow-hidden border border-white/5 shadow-xl">
        
        {/* Library Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#1f1f1f]">
          <div 
            onClick={() => !user?.isGuest && setCurrentView("library")}
            className={`flex items-center gap-3 text-[#b3b3b3] font-bold ${!user?.isGuest ? "hover:text-white cursor-pointer transition-colors" : "cursor-default"}`}
          >
            <Library className="w-6 h-6" />
            <span>Bibliothèque</span>
          </div>
          
          {/* Create playlist only available for registered users */}
          {!user?.isGuest && (
            <button 
              id="create_playlist_btn"
              onClick={onCreatePlaylist}
              title="Créer une playlist"
              className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#1a1a1a] transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Playlists and Liked Songs List */}
        <div className="flex-1 overflow-y-auto px-2 mt-2 space-y-1">
          {user?.isGuest ? (
            <div className="p-3 flex flex-col gap-3">
              <div className="bg-[#1f1f1f] p-4 rounded-lg shadow-md border border-neutral-800">
                <p className="font-bold text-xs text-white mb-1.5 uppercase tracking-wider text-[#1DB954]">Mode Limité</p>
                <p className="font-bold text-sm text-white mb-1">Créez des playlists</p>
                <p className="text-xs text-[#a7a7a7] mb-3 leading-relaxed">Connectez-vous avec Google pour créer et gérer vos propres playlists.</p>
                <button 
                  onClick={onLogout}
                  className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-bold rounded-full text-xs px-4 py-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  S'inscrire avec Google
                </button>
              </div>

              <div className="bg-[#1f1f1f] p-4 rounded-lg shadow-md border border-neutral-800">
                <p className="font-bold text-sm text-white mb-1">Enregistrez vos favoris</p>
                <p className="text-xs text-[#a7a7a7] mb-3 leading-relaxed">Aimez des titres et retrouvez-les à tout moment sur tous vos appareils.</p>
                <button 
                  onClick={onLogout}
                  className="bg-white text-black hover:bg-neutral-200 font-bold rounded-full text-xs px-4 py-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Se connecter
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Liked Songs Entry */}
              <div 
                id="nav_liked_songs"
                onClick={onSelectLikedSongs}
                className={`p-2.5 flex items-center gap-3 rounded-md cursor-pointer transition-all ${
                  currentView === "liked-songs" 
                    ? "bg-[#1a1a1a] border-l-4 border-[#1DB954]" 
                    : "hover:bg-[#1a1a1a]"
                }`}
              >
                <PlaylistCover isLikedSongs={true} size="sm" className="shadow-lg shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm truncate text-white">Titres Likés</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{likedTracks.length} titres</p>
                </div>
              </div>

              {/* User Playlists */}
              {customPlaylists.map((playlist) => (
                <div 
                  key={playlist.id}
                  onClick={() => onSelectPlaylist(playlist)}
                  className={`p-2.5 flex items-center gap-3 rounded-md cursor-pointer transition-all ${
                    currentView === `playlist-${playlist.id}` 
                      ? "bg-[#1a1a1a] border-l-4 border-[#1DB954]" 
                      : "hover:bg-[#1a1a1a]"
                  }`}
                >
                  <PlaylistCover playlist={playlist} size="sm" className="shadow-md shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm truncate text-white">{playlist.name}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">
                      Playlist • {playlist.tracks?.length || 0} titres
                    </p>
                  </div>
                </div>
              ))}



              {/* Followed Artists list in library */}
              {followedArtists && followedArtists.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                  <p className="px-2.5 text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Artistes Suivis ({followedArtists.length})</p>
                  <div className="flex flex-col gap-1">
                    {followedArtists.map((artistName) => (
                      <div 
                        key={artistName}
                        onClick={() => onSelectArtist(artistName)}
                        className={`p-2 flex items-center gap-3 rounded-md cursor-pointer transition-all ${
                          currentView === `artist-${artistName}` 
                            ? "bg-[#1a1a1a] border-l-4 border-[#1DB954]" 
                            : "hover:bg-[#1a1a1a]"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 text-xs shrink-0 uppercase border border-neutral-700/60 overflow-hidden">
                          {artistAvatars && artistAvatars[artistName] ? (
                            <img 
                              referrerPolicy="no-referrer" 
                              src={artistAvatars[artistName]} 
                              alt={artistName} 
                              className="w-full h-full object-cover animate-fade-in" 
                            />
                          ) : (
                            <span>{artistName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs truncate text-white">{artistName}</p>
                          <p className="text-[10px] text-[#1DB954]">Abonné</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>



      </div>
    </nav>
  );
}
