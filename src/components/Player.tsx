import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Ban,
  Laptop2,
  Smartphone,
  Tv,
  Headphones,
  Check,
  X,
  RefreshCw,
  Edit2
} from "lucide-react";
import { Track } from "../types";

export interface SpotifyConnectProps {
  thisDeviceId: string;
  deviceName: string;
  deviceType: string;
  updateDeviceName: (name: string) => void;
  onlineDevices: any[];
  activeDeviceId: string;
  activeDeviceName: string;
  activeDeviceType: string;
  isThisDeviceActive: boolean;
  isRemoteControlMode: boolean;
  remotePlayback: any;
  sendRemoteCommand: (type: string, payload?: any) => void;
  transferPlaybackToThisDevice: () => void;
  setActiveDeviceId: (id: string) => void;
}

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

  // Spotify Connect Integration
  spotifyConnect?: SpotifyConnectProps;
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
  onDislikeRecommendation,
  spotifyConnect
}: PlayerProps) {
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);
  const [editedDeviceName, setEditedDeviceName] = useState("");

  const activeDeviceId = spotifyConnect ? spotifyConnect.activeDeviceId : "this_device";
  const isRemoteControl = spotifyConnect ? spotifyConnect.isRemoteControlMode : false;
  const activeDeviceName = spotifyConnect ? spotifyConnect.activeDeviceName : "Ce navigateur Web";

  const handleScanDevices = () => {
    setIsScanningDevices(true);
    setTimeout(() => {
      setIsScanningDevices(false);
    }, 1500);
  };

  const handleSaveDeviceName = () => {
    if (editedDeviceName.trim() && spotifyConnect) {
      spotifyConnect.updateDeviceName(editedDeviceName.trim());
    }
    setIsEditingDeviceName(false);
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

  const renderDeviceIcon = (type: string, className: string = "w-5 h-5") => {
    switch (type) {
      case "mobile":
        return <Smartphone className={className} />;
      case "tv":
        return <Tv className={className} />;
      case "speaker":
        return <Volume2 className={className} />;
      case "headphone":
      case "airplay_bt":
        return <Headphones className={className} />;
      default:
        return <Laptop2 className={className} />;
    }
  };

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
                  {currentTrack.cadenceType === "security" && (
                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0" title="Règle 3:1 - Valeur Sûre">
                      🔒 Sûre
                    </span>
                  )}
                  {currentTrack.cadenceType === "safe_discovery" && (
                    <span className="bg-sky-950/80 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0" title="Règle 3:1 - Découverte Sûre">
                      ✨ Découverte
                    </span>
                  )}
                  {currentTrack.cadenceType === "bold_discovery" && (
                    <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0" title="Règle 3:1 - Découverte Audacieuse">
                      🚀 Audacieuse
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

        {/* Center Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center w-[40%] max-w-[722px] gap-2">
          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              id="player_shuffle_btn"
              onClick={onShuffleToggle}
              className={`transition-all duration-200 relative focus:outline-none ${
                shuffleMode > 0 ? "text-[#1DB954] hover:text-[#1ed760] scale-105" : "text-[#b3b3b3] hover:text-white"
              }`}
              title={
                shuffleMode === 2 
                  ? "Lecture Aléatoire Intelligente (Mode IA activé)" 
                  : shuffleMode === 1 
                    ? "Lecture Aléatoire (Active)" 
                    : "Activer la lecture aléatoire"
              }
            >
              <Shuffle className="w-4 h-4" />
              {shuffleMode > 0 && (
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full" />
              )}
              {shuffleMode === 2 && (
                <span className="absolute -top-1.5 -right-2 bg-[#1DB954] text-black text-[8px] font-black px-1 rounded-full animate-bounce">
                  IA
                </span>
              )}
            </button>

            <button 
              id="player_prev_btn"
              onClick={onPrevTrack}
              disabled={!currentTrack}
              className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              title="Précédent"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button 
              id="player_play_pause_btn"
              onClick={onPlayPauseToggle}
              disabled={!currentTrack}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-md"
              title={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button 
              id="player_next_btn"
              onClick={onNextTrack}
              disabled={!currentTrack}
              className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              title="Suivant"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button 
              id="player_repeat_btn"
              className="text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
              title="Répéter"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[11px] text-[#b3b3b3] min-w-[32px] text-right font-mono">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1 relative flex items-center group">
              <input
                id="player_timeline_slider"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressChange}
                disabled={!currentTrack}
                className="w-full h-1 bg-[#4d4d4d] group-hover:h-1.5 rounded-full appearance-none cursor-pointer outline-none focus:outline-none accent-[#1DB954] transition-all relative z-10"
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

        {/* Sound / Volume & Remote Control Badge */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3 text-[#b3b3b3]">
          {/* Spotify Connect Live Status Badge */}
          {isRemoteControl && (
            <div 
              onClick={() => setIsDeviceModalOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-[11px] font-bold cursor-pointer hover:bg-[#1DB954]/30 transition-all animate-fade-in shadow-sm"
              title="Télécommande active via Spotify Connect"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1DB954]" />
              </span>
              <Laptop2 className="w-3.5 h-3.5" />
              <span className="truncate max-w-[110px]">Sur {activeDeviceName}</span>
            </div>
          )}

          <button
            id="player_device_selector_btn"
            onClick={() => setIsDeviceModalOpen(true)}
            className={`relative p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              isRemoteControl 
                ? "text-[#1DB954] bg-[#1DB954]/20 border border-[#1DB954]/40 shadow-[0_0_12px_rgba(29,185,84,0.3)] hover:scale-110" 
                : "hover:text-white text-[#b3b3b3] hover:bg-white/10"
            }`}
            title="Spotify Connect - Sélecteur d'appareil (Télécommande)"
          >
            <Laptop2 className="w-5 h-5" />
            {isRemoteControl && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1DB954] rounded-full border-2 border-[#121212] animate-pulse" />
            )}
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

      {/* 2. MOBILE FLOATING MINI-PLAYER BAR (< md) */}
      {currentTrack && (
        <div 
          onClick={() => setIsMobileExpanded(true)}
          className="md:hidden fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-2 right-2 h-14 bg-[#1f1f1f]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 flex items-center justify-between z-45 shadow-2xl cursor-pointer active:scale-98 transition-all"
          id="mobile_mini_player"
        >
          {/* Progress bar line at top edge */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 rounded-t-xl overflow-hidden">
            <div 
              className="h-full bg-[#1DB954] transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title} 
              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" 
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                {currentTrack.artist}
                {isRemoteControl && (
                  <span className="text-[9px] font-bold text-[#1DB954] bg-[#1DB954]/10 px-1 rounded">
                    • {activeDeviceName}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="p-2 text-[#1DB954] hover:text-white"
            >
              <Laptop2 className="w-5 h-5" />
            </button>
            <button
              onClick={onPlayPauseToggle}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. MOBILE FULL-SCREEN PLAYER MODAL */}
      {currentTrack && isMobileExpanded && (
        <div className="md:hidden fixed inset-0 bg-gradient-to-b from-[#181818] via-[#121212] to-black z-50 flex flex-col justify-between p-6 animate-fade-in select-none">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsMobileExpanded(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Écoute en cours</p>
              <p className="text-xs font-bold text-[#1DB954] flex items-center justify-center gap-1">
                <Laptop2 className="w-3 h-3" /> {activeDeviceName}
              </p>
            </div>
            <div className="w-9" />
          </div>

          {/* Cover Art */}
          <div className="w-full max-w-[280px] mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track Metadata */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white line-clamp-1">{currentTrack.title}</h2>
              <p 
                onClick={() => {
                  setIsMobileExpanded(false);
                  onSelectArtist?.(currentTrack.artist);
                }}
                className="text-sm text-neutral-400 font-medium hover:underline cursor-pointer"
              >
                {currentTrack.artist}
              </p>
            </div>
            <button 
              onClick={onLikeToggle}
              className={`p-2 focus:outline-none ${isLiked ? "text-[#1DB954]" : "text-neutral-400"}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Mobile Progress Bar */}
          <div className="space-y-1 mb-6">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none outline-none accent-[#1DB954]"
            />
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={onShuffleToggle} className={shuffleMode > 0 ? "text-[#1DB954]" : "text-neutral-400"}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={onPrevTrack} className="text-white">
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button 
              onClick={onPlayPauseToggle}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-xl shadow-xl active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>
            <button onClick={onNextTrack} className="text-white">
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
            <button onClick={() => setIsDeviceModalOpen(true)} className="text-[#1DB954]">
              <Laptop2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. FUNCTIONAL SPOTIFY CONNECT DEVICE SELECTOR MODAL */}
      {isDeviceModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setIsDeviceModalOpen(false)}
        >
          <div 
            className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white relative flex flex-col gap-5 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
                  <Laptop2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Spotify Connect</h3>
                  <p className="text-xs text-neutral-400">Contrôle multi-appareils en temps réel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeviceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transfer Playback CTA if on secondary device */}
            {isRemoteControl && spotifyConnect && (
              <button
                onClick={() => {
                  spotifyConnect.transferPlaybackToThisDevice();
                  setIsDeviceModalOpen(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-98 transition-all flex items-center justify-center gap-2 text-sm font-bold text-black shadow-lg shadow-[#1DB954]/20"
              >
                <Volume2 className="w-4 h-4" />
                Écouter sur cet appareil ({spotifyConnect.deviceName})
              </button>
            )}

            {/* Currently Playing Target Display */}
            {currentTrack && (
              <div className="bg-gradient-to-r from-[#112a1c] to-[#0c1813] border border-[#1DB954]/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
                    <span className="text-[10px] font-mono text-[#1DB954] uppercase tracking-wider font-bold">
                      Lecture sur : {activeDeviceName}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                </div>
              </div>
            )}

            {/* Registered Devices List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Appareils connectés au compte</p>
                <span className="text-[10px] text-[#1DB954] font-mono font-bold">
                  {spotifyConnect ? spotifyConnect.onlineDevices.length : 1} en ligne
                </span>
              </div>
              
              {spotifyConnect && spotifyConnect.onlineDevices.length > 0 ? (
                spotifyConnect.onlineDevices.map((dev: any) => {
                  const isActive = dev.id === activeDeviceId;
                  const isThisDev = dev.isThisDevice;

                  return (
                    <div 
                      key={dev.id}
                      onClick={() => {
                        if (isThisDev && !isActive) {
                          spotifyConnect.transferPlaybackToThisDevice();
                        } else if (!isActive) {
                          spotifyConnect.setActiveDeviceId(dev.id);
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-[#1DB954]/15 border-[#1DB954]/50 text-white shadow-md shadow-[#1DB954]/10"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={isActive ? "text-[#1DB954]" : "text-neutral-400"}>
                          {renderDeviceIcon(dev.type)}
                        </div>
                        <div>
                          <p className="text-sm font-bold flex items-center gap-2">
                            {dev.name}
                            {isThisDev && (
                              <span className="text-[9px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded font-medium">
                                Cet appareil
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] bg-[#1DB954] text-black px-1.5 py-0.2 rounded-full font-black">
                                ACTIF
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {isActive ? "En cours de diffusion audio" : "Télécommande disponible"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive && <Check className="w-5 h-5 text-[#1DB954]" />}
                        {!isActive && isThisDev && (
                          <span className="text-xs font-bold text-[#1DB954] hover:underline">
                            Transférer ici
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-neutral-400">
                  Recherche des appareils connectés...
                </div>
              )}
            </div>

            {/* Rename Device Option */}
            {spotifyConnect && (
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Nom de cet appareil : <strong className="text-white">{spotifyConnect.deviceName}</strong></span>
                  <button 
                    onClick={() => {
                      setEditedDeviceName(spotifyConnect.deviceName);
                      setIsEditingDeviceName(!isEditingDeviceName);
                    }}
                    className="text-[#1DB954] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Edit2 className="w-3 h-3" /> Modifier
                  </button>
                </div>

                {isEditingDeviceName && (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={editedDeviceName}
                      onChange={(e) => setEditedDeviceName(e.target.value)}
                      placeholder="Ex: PC du Salon, iPhone de Thomas..."
                      className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1DB954]"
                    />
                    <button
                      onClick={handleSaveDeviceName}
                      className="bg-[#1DB954] text-black font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#1ed760]"
                    >
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>
            )}

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
