import React from "react";
import { Music, Heart, Sparkles } from "lucide-react";
import { Playlist, Track } from "../types";

interface PlaylistCoverProps {
  playlist?: Playlist | null;
  isLikedSongs?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function PlaylistCover({
  playlist,
  isLikedSongs = false,
  size = "md",
  className = ""
}: PlaylistCoverProps) {
  const isLiked = isLikedSongs || playlist === null;
  const tracks = playlist?.tracks || [];

  const sizeClasses = {
    sm: "w-11 h-11 text-xs rounded",
    md: "w-14 h-14 text-sm rounded",
    lg: "w-36 h-36 md:w-44 md:h-44 text-3xl rounded-md",
    xl: "w-full aspect-square rounded-md"
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  if (isLiked) {
    return (
      <div 
        className={`${selectedSizeClass} bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden group border border-white/5 ${className}`}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
        <Heart className={`text-white fill-current ${size === "lg" ? "w-16 h-16 animate-pulse" : size === "sm" ? "w-5 h-5" : "w-6 h-6"}`} />
        <div className="absolute bottom-1 right-1 opacity-20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  const coverColor = playlist?.coverColor || "#1b2a4a";

  // If we have at least 4 tracks with thumbnails, show a gorgeous 2x2 grid of album covers
  if (tracks.length >= 4) {
    return (
      <div className={`${selectedSizeClass} grid grid-cols-2 grid-rows-2 gap-[2px] bg-neutral-900 shadow-xl overflow-hidden shrink-0 relative group border border-white/10 ${className}`}>
        <img referrerPolicy="no-referrer" src={tracks[0].thumbnail} alt="" className="w-full h-full object-cover select-none" />
        <img referrerPolicy="no-referrer" src={tracks[1].thumbnail} alt="" className="w-full h-full object-cover select-none" />
        <img referrerPolicy="no-referrer" src={tracks[2].thumbnail} alt="" className="w-full h-full object-cover select-none" />
        <img referrerPolicy="no-referrer" src={tracks[3].thumbnail} alt="" className="w-full h-full object-cover select-none" />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-300" />
      </div>
    );
  }

  // If we have 1-3 tracks, show the first track thumbnail with a nice styling, or fallback
  if (tracks.length > 0 && tracks[0].thumbnail) {
    return (
      <div className={`${selectedSizeClass} relative bg-neutral-900 shadow-xl overflow-hidden shrink-0 group border border-white/10 ${className}`}>
        <img referrerPolicy="no-referrer" src={tracks[0].thumbnail} alt="" className="w-full h-full object-cover select-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-300" />
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-full border border-white/5">
          <Music className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    );
  }

  // Beautiful mesh gradient fallback with playlist letters and icon
  const initials = playlist?.name ? playlist.name.substring(0, 2).toUpperCase() : "PL";

  return (
    <div 
      className={`${selectedSizeClass} shadow-xl flex flex-col items-center justify-center font-black select-none shrink-0 relative overflow-hidden group border border-white/10 ${className}`}
      style={{ 
        background: `linear-gradient(135deg, ${coverColor}e6, #09090b)`
      }}
    >
      {/* Decorative ambient light in background */}
      <div 
        className="absolute w-24 h-24 rounded-full blur-2xl opacity-40 -top-6 -left-6" 
        style={{ backgroundColor: coverColor }} 
      />
      
      {/* Dynamic letter initials with refined shadows */}
      <span className={`relative z-10 text-white tracking-wide drop-shadow-md font-sans ${
        size === "lg" ? "text-5xl" : size === "xl" ? "text-4xl" : "text-sm"
      }`}>
        {initials}
      </span>

      {/* Decorative musical icon at the corner */}
      <div className="absolute bottom-2 right-2 opacity-35 group-hover:opacity-60 transition-opacity">
        <Music className={size === "lg" ? "w-6 h-6" : "w-3.5 h-3.5"} />
      </div>

      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
    </div>
  );
}
