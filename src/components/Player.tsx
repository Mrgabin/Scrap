import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Heart, 
  Shuffle,
  Sparkles,
  Ban,
  ChevronDown,
  Maximize2,
  Laptop2,
  Headphones,
  Tv,
  Radio,
  Wifi,
  Check,
  X,
  RefreshCw,
  Sliders
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("this_device");
  const [isScanningDevices, setIsScanningDevices] = useState(false);

  const handleScanDevices = () => {
    setIsScanningDevices(true);
    setTimeout(() => {
      setIsScanningDevices(false);
    }, 1500);
  };

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
    <>
      {/* 1. DESKTOP MEDIA PLAYER FOOTER (visible on screens md and larger) */}
      <footer className="hidden md:flex h-[95px] bg-black/45 backdrop-blur-md border-t border-white/5 items-center justify-between px-4 z-40 select-none text-white shrink-0" id="media_player_footer">
        
        {/* Track Metadata Section */}
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
                  title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </button>
                {isRecommendation && onDislikeRecommendation && (
                  <button 
                    id="player_dislike_btn"
                    onClick={onDislikeRecommendation}
                    className="text-[#b3b3b3] hover:text-red-500 hover:scale-105 active:scale-95 transition-all p-1 focus:outline-none"
                    title="Masquer cette suggestion"
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

        {/* Playback Control Center */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-[600px]">
          <div className="flex items-center gap-5">
            <button 
              id="player_shuffle_btn"
              onClick={onShuffleToggle}
              disabled={!currentTrack}
              className={`relative p-2 rounded-full focus:outline-none transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex flex-col items-center justify-center ${
                shuffleMode === 1 || shuffleMode === 2 
                  ? "text-[#1DB954] hover:text-[#1ed760] scale-105" 
                  : "text-[#b3b3b3] hover:text-white"
              }`}
              title={shuffleMode === 0 ? "Activer l'aléatoire" : shuffleMode === 1 ? "Smart Shuffle" : "Désactiver"}
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

        {/* Sound / Volume & Options */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3 text-[#b3b3b3]">
          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className={`p-1.5 rounded-full transition-colors ${
              activeDeviceId !== "this_device" ? "text-[#1DB954] bg-[#1DB954]/10" : "hover:text-white text-[#b3b3b3]"
            }`}
            title="Sélecteur d'appareil d'écoute"
          >
            <Laptop2 className="w-5 h-5" />
          </button>

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

      {/* 2. MOBILE FLOATING MINI-PLAYER BAR (visible on screens < md) */}
      {currentTrack && (
        <div 
          className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-2 right-2 z-40 md:hidden bg-gradient-to-r from-[#0d5d67] to-[#073c43] border border-[#147a87]/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden select-none active:scale-[0.99] transition-all"
          id="mobile_mini_player"
        >
          <div 
            className="p-2 flex items-center justify-between gap-3 cursor-pointer relative pb-3"
            onClick={() => setIsMobileExpanded(true)}
          >
            {/* Thumbnail + Title */}
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <div className="w-10 h-10 rounded-lg bg-black/20 overflow-hidden shrink-0 border border-white/5 shadow-md relative">
                <img
                  referrerPolicy="no-referrer"
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover animate-fade-in"
                />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-[#b2d3d6] truncate mt-0.5 leading-tight">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsDeviceModalOpen(true)}
                className={`p-1.5 transition-colors ${
                  activeDeviceId !== "this_device" ? "text-[#1DB954]" : "text-white/80 hover:text-white"
                }`}
                title="Connecter un appareil"
              >
                <Laptop2 className="w-5 h-5" />
              </button>

              <button
                onClick={onPlayPauseToggle}
                className="p-1.5 text-white hover:text-white transition-all active:scale-90"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-current text-white translate-x-[0.5px]" />
                )}
              </button>
            </div>

            {/* Inline Progress Bar at the absolute bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE FULL-SCREEN PLAYER MODAL OVERLAY */}
      {currentTrack && isMobileExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-gradient-to-b from-[#18182c] via-[#0d0d16] to-[#08080f] flex flex-col p-6 text-white md:hidden animate-in slide-in-from-bottom duration-300 select-none overflow-y-auto"
          id="mobile_fullscreen_player"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6 shrink-0">
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                Lecteur Mobile
              </span>
              <p className="text-xs font-semibold text-neutral-200">
                En cours de lecture
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* Large High-Res Album Cover Art */}
          <div className="my-auto py-4 flex flex-col items-center">
            <div className="w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 relative group mb-6">
              <img
                referrerPolicy="no-referrer"
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Track Info */}
            <div className="w-full text-center px-2 mb-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-black text-white truncate max-w-[260px]">
                  {currentTrack.title}
                </h2>
                {isRecommendation && (
                  <span className="bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 fill-current" /> IA
                  </span>
                )}
              </div>
              <p 
                onClick={() => {
                  setIsMobileExpanded(false);
                  onSelectArtist?.(currentTrack.artist);
                }}
                className="text-sm font-semibold text-[#1DB954] mt-1 cursor-pointer hover:underline"
              >
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Interactive Progress Slider */}
          <div className="w-full mb-6 shrink-0 px-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer outline-none accent-[#1DB954]"
              style={{
                background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-xs font-mono text-neutral-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-around mb-8 shrink-0">
            {/* Shuffle */}
            <button
              onClick={onShuffleToggle}
              className={`p-3 rounded-full transition-all active:scale-90 relative flex flex-col items-center justify-center ${
                shuffleMode > 0 ? "text-[#1DB954] bg-[#1DB954]/10" : "text-neutral-400"
              }`}
              title={
                shuffleMode === 0 
                  ? "Activer l'aléatoire" 
                  : shuffleMode === 1 
                  ? "Aléatoire" 
                  : "Smart Shuffle (Mode IA)"
              }
            >
              <div className="relative flex items-center justify-center">
                <Shuffle className="w-6 h-6" />
                {shuffleMode === 2 && (
                  <Sparkles className="w-3.5 h-3.5 text-[#1DB954] absolute -top-2 -left-2 fill-current animate-pulse" />
                )}
              </div>
              {shuffleMode === 2 && (
                <span className="absolute -bottom-1.5 bg-[#1DB954] text-black text-[8px] font-black px-1.5 py-0.2 rounded-full tracking-wider uppercase shadow-[0_0_8px_#1DB954]">
                  IA
                </span>
              )}
              {shuffleMode === 1 && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 bg-[#1DB954] rounded-full shadow-[0_0_6px_#1DB954]" />
              )}
            </button>

            {/* Prev */}
            <button
              onClick={onPrevTrack}
              className="p-3 text-white active:scale-90 transition-transform"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            {/* Main Play/Pause Button */}
            <button
              onClick={onPlayPauseToggle}
              className="w-16 h-16 rounded-full bg-[#1DB954] text-black flex items-center justify-center font-bold shadow-xl shadow-[#1db954]/30 active:scale-90 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current text-black" />
              ) : (
                <Play className="w-7 h-7 fill-current text-black translate-x-[1px]" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNextTrack}
              className="p-3 text-white active:scale-90 transition-transform"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            {/* Heart */}
            <button
              onClick={onLikeToggle}
              className={`p-3 rounded-full transition-all active:scale-90 ${
                isLiked ? "text-[#1DB954]" : "text-neutral-400"
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Volume Row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl shrink-0">
            <button onClick={handleVolumeToggle} className="text-neutral-400">
              {volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none outline-none accent-[#1DB954]"
              style={{
                background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* 4. FUNCTIONAL DEVICE SELECTOR MODAL */}
      {isDeviceModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setIsDeviceModalOpen(false)}
        >
          <div 
            className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white relative flex flex-col gap-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
                  <Laptop2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Sélecteur d'appareil</h3>
                  <p className="text-xs text-neutral-400">Écoutez votre musique sur n'importe quel dispositif</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeviceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Playing Target Display */}
            {currentTrack && (
              <div className="bg-gradient-to-r from-[#112a1c] to-[#0c1813] border border-[#1DB954]/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
                    <span className="text-[10px] font-mono text-[#1DB954] uppercase tracking-wider font-bold">En cours d'écoute</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                </div>
              </div>
            )}

            {/* Available Devices List */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">Appareils disponibles</p>
              
              {/* Option 1: Ce navigateur Web */}
              <div 
                onClick={() => setActiveDeviceId("this_device")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeDeviceId === "this_device"
                    ? "bg-[#1DB954]/15 border-[#1DB954]/50 text-white"
                    : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Laptop2 className={`w-5 h-5 ${activeDeviceId === "this_device" ? "text-[#1DB954]" : "text-neutral-400"}`} />
                  <div>
                    <p className="text-sm font-bold flex items-center gap-2">
                      Ce navigateur Web
                      {activeDeviceId === "this_device" && (
                        <span className="text-[10px] bg-[#1DB954] text-black px-2 py-0.2 rounded-full font-black">ACTIF</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400">Haut-parleurs système • Qualité haute fidélité</p>
                  </div>
                </div>
                {activeDeviceId === "this_device" && <Check className="w-5 h-5 text-[#1DB954]" />}
              </div>

              {/* Option 2: AirPlay / Bluetooth */}
              <div 
                onClick={() => setActiveDeviceId("airplay_bt")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeDeviceId === "airplay_bt"
                    ? "bg-[#1DB954]/15 border-[#1DB954]/50 text-white"
                    : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Headphones className={`w-5 h-5 ${activeDeviceId === "airplay_bt" ? "text-[#1DB954]" : "text-neutral-400"}`} />
                  <div>
                    <p className="text-sm font-bold flex items-center gap-2">
                      Casque Bluetooth / AirPlay
                      {activeDeviceId === "airplay_bt" && (
                        <span className="text-[10px] bg-[#1DB954] text-black px-2 py-0.2 rounded-full font-black">CONNECTÉ</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400">Sortie sans fil système détectée</p>
                  </div>
                </div>
                {activeDeviceId === "airplay_bt" && <Check className="w-5 h-5 text-[#1DB954]" />}
              </div>

              {/* Option 3: Google Cast / Smart TV */}
              <div 
                onClick={() => setActiveDeviceId("smart_tv")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeDeviceId === "smart_tv"
                    ? "bg-[#1DB954]/15 border-[#1DB954]/50 text-white"
                    : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Tv className={`w-5 h-5 ${activeDeviceId === "smart_tv" ? "text-[#1DB954]" : "text-neutral-400"}`} />
                  <div>
                    <p className="text-sm font-bold flex items-center gap-2">
                      Google Cast / TV Salon
                      {activeDeviceId === "smart_tv" && (
                        <span className="text-[10px] bg-[#1DB954] text-black px-2 py-0.2 rounded-full font-black">CONNECTÉ</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400">Diffusion Wi-Fi locale (DLNA / Cast)</p>
                  </div>
                </div>
                {activeDeviceId === "smart_tv" && <Check className="w-5 h-5 text-[#1DB954]" />}
              </div>
            </div>

            {/* Scan for new devices */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleScanDevices}
                disabled={isScanningDevices}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all flex items-center justify-center gap-2 text-xs font-bold text-white border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? "animate-spin text-[#1DB954]" : ""}`} />
                {isScanningDevices ? "Recherche d'appareils à proximité..." : "Rechercher des appareils Wi-Fi / Bluetooth"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
