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
  Disc,
  Github
} from "lucide-react";
import { Playlist, Track } from "../types";
import { auth } from "../firebase";
import PlaylistCover from "./PlaylistCover";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";
// @ts-ignore
import scrapLogo from "../assets/images/regenerated_image_1783349595383.png";

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
      
      {/* Brand Header with New Logo */}
      <div 
        onClick={() => setCurrentView("home")}
        className="bg-[#0a0a14]/30 backdrop-blur-md rounded-lg p-5 flex items-center gap-3 border border-white/5 shadow-xl cursor-pointer hover:bg-white/[0.02] transition-all group"
      >
        <div className="w-10 h-10 group-hover:scale-105 transition-all flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(29,185,84,0.3)]">
          <img src={scrapLogo} className="w-full h-full object-contain" alt="Scrap Logo" referrerPolicy="no-referrer" />
        </div>
        <div>
          <span className="font-black text-lg tracking-tight text-white flex items-center gap-1">
            Scrap<span className="text-[#1DB954] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 ml-1">APP</span>
          </span>
          <p className="text-[10px] text-neutral-400 font-medium">Lecteur audio intelligent</p>
        </div>
      </div>

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
                          {(() => {
                            const avatarUrl = (artistAvatars && artistAvatars[artistName]) || getDeterministicArtistAvatar(artistName);
                            return (
                              <img 
                                referrerPolicy="no-referrer" 
                                src={avatarUrl} 
                                alt={artistName} 
                                className="w-full h-full object-cover animate-fade-in" 
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = getDeterministicArtistAvatar(artistName);
                                }}
                              />
                            );
                          })()}
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

      {/* En savoir plus (Discord & GitHub) */}
      <div className="bg-[#0a0a14]/30 backdrop-blur-md rounded-lg p-4 border border-white/5 shadow-xl flex flex-col gap-2.5 shrink-0" id="sidebar_about_section">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">En savoir plus</span>
        </div>
        <div className="flex items-center gap-2">
          {/* GitHub button */}
          <a
            href="https://github.com/Mrgabin/Scrap"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-md bg-[#242424] hover:bg-[#2e2e2e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-transparent hover:border-white/10"
            id="sidebar_github_btn"
          >
            <Github className="w-4 h-4 text-white" />
            GitHub
          </a>
          
          {/* Discord button */}
          <button
            type="button"
            className="flex-1 py-2 px-3 rounded-md bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#5865F2]/20 hover:border-[#5865F2]/40 cursor-pointer"
            id="sidebar_discord_btn"
            onClick={() => {
              alert("Le serveur Discord Scrap arrive très bientôt ! Restez connectés.");
            }}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.18,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,73,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.87,48.12,122.94,25.35,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.14-12.69,11.41-12.69S53.9,46,53.8,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53s5.14-12.69,11.41-12.69S96.13,46,96,53,91,65.69,84.69,65.69Z"/>
            </svg>
            Discord
          </button>
        </div>
      </div>
    </nav>
  );
}
