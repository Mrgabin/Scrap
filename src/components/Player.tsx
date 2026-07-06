import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Heart, 
  Maximize2,
  Shuffle,
  Sparkles,
  Ban
} from "lucide-react";
import { Track } from "../types";

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
  isLiked: boolean;
  onLikeToggle: () => void;
  onSelectArtist?: (artistName: string) => void;
  
  // Shuffle Mode Support
  shuffleMode: number; // 0: off, 1: shuffle, 2: smart shuffle
  onShuffleToggle: () => void;
  isLikedSongsContext?: boolean;
  
  // Smart Shuffle Recommendation attributes
  isRecommendation?: boolean;
  onDislikeRecommendation?: () => void;
}

export default function Player({
  currentTrack,
  isPlaying,
  onPlayPauseToggle,
  onNextTrack,
  onPrevTrack,
  currentTime,
  duration,
  onSeek,
  volume,
  setVolume,
  isLiked,
  onLikeToggle,
  onSelectArtist,
  shuffleMode,
  onShuffleToggle,
  isLikedSongsContext = false,
  isRecommendation = false,
  onDislikeRecommendation
}: PlayerProps) {
  const [prevVolume, setPrevVolume] = useState(volume);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = parseFloat(e.target.value);
    onSeek(targetSeconds);
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 50);
    }
  };

  // Safe percentage calculation for styling the track slider progress
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="h-[95px] bg-black/45 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-4 z-40 select-none text-white shrink-0" id="media_player_footer">
      
      {/* 1. Track Metadata Section */}
      <div className="flex items-center w-[30%] min-w-[180px] gap-4">
        {currentTrack ? (
          <>
            <div className="w-14 h-14 bg-[#282828] rounded overflow-hidden shadow-lg shrink-0 border border-[#1f1f1f]">
              <img referrerPolicy="no-referrer" src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white truncate max-w-[130px] hover:underline cursor-pointer">
                  {currentTrack.title}
                </p>
                {isRecommendation && (
                  <span className="bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0 animate-pulse" title="Lecture Aléatoire Intelligente">
                    <Sparkles className="w-2 h-2 fill-current" /> IA
                  </span>
                )}
              </div>
              <p 
                onClick={() => onSelectArtist?.(currentTrack.artist)}
                className="text-xs text-[#b3b3b3] truncate max-w-[160px] hover:underline hover:text-white cursor-pointer"
              >
                {currentTrack.artist}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                id="player_like_btn"
                onClick={onLikeToggle}
                className={`hover:scale-105 active:scale-95 transition-all p-1 ml-2 focus:outline-none ${
                  isLiked ? "text-[#1DB954]" : "text-[#b3b3b3] hover:text-white"
                }`}
                title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris (Signal positif fort)"}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </button>
              {isRecommendation && onDislikeRecommendation && (
                <button 
                  id="player_dislike_btn"
                  onClick={onDislikeRecommendation}
                  className="text-[#b3b3b3] hover:text-red-500 hover:scale-105 active:scale-95 transition-all p-1 focus:outline-none"
                  title="Masquer cette suggestion (Signal négatif fort)"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#121212] rounded flex items-center justify-center border border-[#1f1f1f] text-[10px] text-[#404040]">
              MUTE
            </div>
            <div>
              <p className="text-sm text-[#535353] font-medium">Aucun titre sélectionné</p>
              <p className="text-xs text-[#535353]">Choisissez un morceau</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Playback Control Center */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-[600px]">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          {/* Shuffle Button with 3 states */}
          <button 
            id="player_shuffle_btn"
            onClick={onShuffleToggle}
            disabled={!currentTrack}
            className={`relative p-2 rounded-full focus:outline-none transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex flex-col items-center justify-center ${
              shuffleMode === 1 || shuffleMode === 2 
                ? "text-[#1DB954] hover:text-[#1ed760] scale-105" 
                : "text-[#b3b3b3] hover:text-white"
            }`}
            title={
              shuffleMode === 0 
                ? "Activer la lecture aléatoire" 
                : shuffleMode === 1 
                  ? (isLikedSongsContext ? "Activer l'Aléatoire Intelligent (Smart Shuffle)" : "Désactiver la lecture aléatoire")
                  : "Désactiver l'Aléatoire Intelligent (Smart Shuffle)"
            }
          >
            <div className="relative">
              <Shuffle className="w-5 h-5" />
              {shuffleMode === 2 && (
                <Sparkles className="w-2.5 h-2.5 text-[#1DB954] absolute -top-1.5 -left-1.5 fill-current animate-pulse" />
              )}
            </div>
            {(shuffleMode === 1 || shuffleMode === 2) && (
              <span className="absolute bottom-[-1px] w-1.5 h-1.5 bg-[#1DB954] rounded-full shadow-[0_0_4px_#1DB954]" />
            )}
          </button>

          <button 
            onClick={onPrevTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button 
            id="player_play_pause_btn"
            onClick={onPlayPauseToggle}
            disabled={!currentTrack}
            className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-black" />
            ) : (
              <Play className="w-5 h-5 fill-current text-black translate-x-[1px]" />
            )}
          </button>

          <button 
            onClick={onNextTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] text-[#b3b3b3] min-w-[32px] text-right font-mono">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative group flex items-center">
            <input
              id="player_progress_slider"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              disabled={!currentTrack}
              className="w-full h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer outline-none focus:outline-none accent-[#1DB954] group-hover:bg-[#5a5a5a] relative z-10"
              style={{
                background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${progressPercent}%, #4d4d4d ${progressPercent}%, #4d4d4d 100%)`
              }}
            />
          </div>

          <span className="text-[11px] text-[#b3b3b3] min-w-[32px] font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Sound / Volume & Options Section */}
      <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3.5 text-[#b3b3b3]">
        <button 
          onClick={handleVolumeToggle}
          className="hover:text-white transition-colors"
        >
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-red-500" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <div className="w-24 relative flex items-center group">
          <input
            id="player_volume_slider"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer outline-none focus:outline-none accent-[#1DB954] relative z-10"
            style={{
              background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume}%, #4d4d4d ${volume}%, #4d4d4d 100%)`
            }}
          />
        </div>
      </div>

    </footer>
  );
}
