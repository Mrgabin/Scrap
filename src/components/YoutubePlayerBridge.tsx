import React, { useEffect, useRef, useState } from "react";
import { Move, ChevronUp, ChevronDown } from "lucide-react";
import { Track } from "../types";

interface YoutubePlayerBridgeProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number; // 0 to 100
  seekTo: number | null; // seek request in seconds
  onSeekComplete: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onTrackEnd: () => void;
  onTrackReady: (durationSec: number) => void;
  initialStartTime: number;
  playTrigger: number;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function YoutubePlayerBridge({
  currentTrack,
  isPlaying,
  volume,
  seekTo,
  onSeekComplete,
  onTimeUpdate,
  onTrackEnd,
  onTrackReady,
  initialStartTime,
  playTrigger,
  onPlayStateChange
}: YoutubePlayerBridgeProps) {
  const playerRef = useRef<any>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerId = "yt-hidden-player-iframe";
  const timerRef = useRef<any>(null);
  const isReadyRef = useRef<boolean>(false);
  const hasStartedPlayingRef = useRef<boolean>(false);
  const [minimized, setMinimized] = useState(false);
  const [ytState, setYtState] = useState<number>(-1);
  const [showAutoplayWarning, setShowAutoplayWarning] = useState(false);

  // Warning delay timer to detect real autoplay blocks instead of normal transient buffering states
  useEffect(() => {
    let warningTimer: any = null;

    if (isPlaying && ytState !== 1) {
      warningTimer = setTimeout(() => {
        setShowAutoplayWarning(true);
      }, 2000);
    } else {
      setShowAutoplayWarning(false);
    }

    return () => {
      if (warningTimer) {
        clearTimeout(warningTimer);
      }
    };
  }, [isPlaying, ytState, currentTrack?.id]);

  // Robust initialization of YouTube IFrame Player API
  useEffect(() => {
    if (!currentTrack || currentTrack.id.startsWith("resolve:")) return;

    if (playerRef.current) return; // Already initialized

    const checkAndInit = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return true;
      }
      return false;
    };

    if (checkAndInit()) return;

    // Load YouTube API script if not present
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      checkAndInit();
    };

    // Fallback polling interval in case ready event doesn't fire
    const interval = setInterval(() => {
      if (checkAndInit()) {
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      stopTimer();
    };
  }, [currentTrack?.id]);

  const forcePlay = (playerInstance: any) => {
    if (!playerInstance) return;
    try {
      if (playerInstance.playVideo) {
        playerInstance.playVideo();
        
        // Try play multiple times rapidly to wake the player state
        setTimeout(() => {
          if (playerInstance.playVideo) {
            playerInstance.playVideo();
          }
        }, 80);

        // Verify play state and force if stalled
        setTimeout(() => {
          if (playerInstance.getPlayerState && playerInstance.getPlayerState() !== 1) {
            playerInstance.playVideo();
          }
        }, 200);

        // Autoplay bypass with temporary mute/unmute sequence if still unstarted
        setTimeout(() => {
          if (playerInstance.getPlayerState && playerInstance.getPlayerState() !== 1) {
            if (playerInstance.mute && playerInstance.unMute) {
              playerInstance.mute();
              playerInstance.playVideo();
              setTimeout(() => {
                playerInstance.unMute();
                if (playerInstance.setVolume) {
                  playerInstance.setVolume(volume);
                }
              }, 150);
            }
          }
        }, 450);
      }
    } catch (e) {
      console.warn("Error forcing play state:", e);
    }
  };

  const initPlayer = () => {
    if (playerRef.current) return;
    try {
      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: currentTrack?.id || "",
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            isReadyRef.current = true;
            event.target.setVolume(volume);

            try {
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
                iframe.setAttribute("playsinline", "1");
                iframe.setAttribute("webkit-playsinline", "1");
              }
            } catch (e) {
              console.warn("Could not set allow attributes on iframe:", e);
            }
            
            if (currentTrack) {
              if (isPlaying) {
                event.target.loadVideoById({
                  videoId: currentTrack.id,
                  startSeconds: initialStartTime
                });
                hasStartedPlayingRef.current = true;
                startTimer();
                forcePlay(event.target);
              } else {
                event.target.cueVideoById({
                  videoId: currentTrack.id,
                  startSeconds: initialStartTime
                });
              }
            }
          },
          onStateChange: (event: any) => {
            setYtState(event.data);
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              stopTimer();
              onTrackEnd();
              onPlayStateChange?.(false);
            } else if (event.data === 1) { // PLAYING = 1
              hasStartedPlayingRef.current = true;
              startTimer();
              const duration = playerRef.current?.getDuration() || 0;
              if (duration > 0) {
                onTrackReady(duration);
              }
              onPlayStateChange?.(true);
            } else if (event.data === 2) { // PAUSED = 2
              stopTimer();
              onPlayStateChange?.(false);
            } else if (event.data === -1) { // UNSTARTED = -1
              if (isPlaying) {
                forcePlay(event.target);
              }
            } else if (event.data === 5) { // CUED = 5
              if (isPlaying) {
                forcePlay(event.target);
              }
            } else {
              stopTimer();
            }
          }
        }
      });
    } catch (err) {
      console.error("Failed to initialize YT Player:", err);
    }
  };

  // Reset started playing state when track ID changes
  useEffect(() => {
    hasStartedPlayingRef.current = false;
  }, [currentTrack?.id]);

  // Sync track loading and cueing (keeps position restored perfectly when browser reopened)
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    if (currentTrack) {
      if (currentTrack.id.startsWith("resolve:")) return;
      try {
        const iframe = playerRef.current.getIframe?.();
        if (iframe) {
          iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        }
      } catch (e) {}

      if (isPlaying) {
        if (playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById({
            videoId: currentTrack.id,
            startSeconds: initialStartTime
          });
          hasStartedPlayingRef.current = true;
          startTimer();
          forcePlay(playerRef.current);
        }
      } else {
        if (playerRef.current.cueVideoById) {
          playerRef.current.cueVideoById({
            videoId: currentTrack.id,
            startSeconds: initialStartTime
          });
        }
      }
    } else {
      if (playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }
    }
  }, [currentTrack?.id, initialStartTime]);

  // Sync forced playTrigger (forces instant restart/replay of the same track when clicked again)
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    if (playTrigger > 0 && currentTrack && !currentTrack.id.startsWith("resolve:")) {
      try {
        const iframe = playerRef.current.getIframe?.();
        if (iframe) {
          iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        }
      } catch (e) {}

      const videoData = playerRef.current.getVideoData ? playerRef.current.getVideoData() : null;
      const loadedId = videoData ? videoData.video_id : null;

      if (loadedId === currentTrack.id) {
        if (playerRef.current.seekTo) {
          playerRef.current.seekTo(0, true);
        }
        if (isPlaying && playerRef.current.playVideo) {
          forcePlay(playerRef.current);
        }
        startTimer();
      } else {
        if (playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById({
            videoId: currentTrack.id,
            startSeconds: 0
          });
          hasStartedPlayingRef.current = true;
          startTimer();
        }
        if (isPlaying && playerRef.current.playVideo) {
          forcePlay(playerRef.current);
        }
      }
    }
  }, [playTrigger]);

  // Sync Play / Pause state & background mobile audio thread
  useEffect(() => {
    if (isPlaying) {
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch(() => {});
      }
    } else {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    }

    if (!isReadyRef.current || !playerRef.current || !playerRef.current.playVideo) return;

    if (currentTrack) {
      try {
        const iframe = playerRef.current.getIframe?.();
        if (iframe) {
          iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        }
      } catch (e) {}

      if (isPlaying) {
        forcePlay(playerRef.current);
        hasStartedPlayingRef.current = true;
        startTimer();
      } else {
        playerRef.current.pauseVideo();
        stopTimer();
      }
    }
  }, [isPlaying]);

  // Sync Volume level
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Sync Manual Seeking
  useEffect(() => {
    if (isReadyRef.current && seekTo !== null && playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seekTo, true);
      onSeekComplete();
    }
  }, [seekTo]);

  // Timer for dispatching time progress updates
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration() || 0;
        onTimeUpdate(currentTime, duration);
      }
    }, 500);
  };

  const [mobilePos, setMobilePos] = useState<"top-right" | "top-left" | "bottom-left">("top-right");

  const cycleMobilePos = () => {
    if (mobilePos === "top-right") setMobilePos("top-left");
    else if (mobilePos === "top-left") setMobilePos("bottom-left");
    else setMobilePos("top-right");
  };

  const getPositionClasses = () => {
    switch (mobilePos) {
      case "top-left":
        return "top-[calc(3.8rem+env(safe-area-inset-top,0px))] left-3 right-auto bottom-auto md:top-auto md:bottom-28 md:right-6 md:left-auto";
      case "bottom-left":
        return "bottom-36 left-3 right-auto top-auto md:top-auto md:bottom-28 md:right-6 md:left-auto";
      case "top-right":
      default:
        return "top-[calc(3.8rem+env(safe-area-inset-top,0px))] right-3 left-auto bottom-auto md:top-auto md:bottom-28 md:right-6 md:left-auto";
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!currentTrack) return null;

  const isBlockedWhileMinimized = minimized && showAutoplayWarning;

  return (
    <div 
      className={`fixed z-50 bg-[#181818] border ${
        isBlockedWhileMinimized 
          ? "border-[#1DB954] shadow-[0_0_25px_rgba(29,185,84,0.6)] animate-bounce" 
          : "border-neutral-800 shadow-2xl"
      } rounded-xl transition-all duration-300 flex flex-col overflow-hidden select-none ${getPositionClasses()}`} 
      style={{ 
        width: minimized ? (isBlockedWhileMinimized ? "260px" : "180px") : "320px", 
        height: minimized ? (isBlockedWhileMinimized ? "64px" : "48px") : showAutoplayWarning ? "268px" : "220px",
      }}
    >
      {/* Header bar */}
      <div 
        onClick={() => {
          if (minimized) setMinimized(false);
        }}
        className={`flex items-center justify-between px-3 py-2 ${
          isBlockedWhileMinimized ? "bg-[#1DB954] text-black cursor-pointer" : "bg-neutral-900 border-b border-neutral-800 text-neutral-200"
        }`}
      >
        <span className="text-[10px] font-bold tracking-wider uppercase truncate max-w-[170px] flex items-center gap-1.5">
          {isBlockedWhileMinimized ? (
            <span className="flex items-center gap-1.5 font-black text-black">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              🎬 DÉBLOQUER VIDÉO
            </span>
          ) : (
            <>
              <span className="flex h-1.5 w-1.5 relative shrink-0">
                {isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPlaying ? "bg-[#1DB954]" : "bg-neutral-500"}`}></span>
              </span>
              <span className="truncate">{minimized ? "Vidéo réduite" : "Lecteur Vidéo"}</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Position move button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleMobilePos();
            }}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isBlockedWhileMinimized ? "text-black" : "text-neutral-400 hover:text-white"}`}
            title="Déplacer la fenêtre (Haut-Droit / Haut-Gauche / Bas)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Maximize button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }} 
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isBlockedWhileMinimized ? "text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            title={minimized ? "Agrandir le lecteur" : "Réduire le lecteur"}
          >
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Helper text when blocked in minimized mode */}
      {isBlockedWhileMinimized && (
        <div 
          onClick={() => setMinimized(false)}
          className="bg-black/90 text-white text-[10px] px-2 py-1 text-center font-medium cursor-pointer border-t border-black/20"
        >
          Touchez pour afficher le lecteur et cliquer sur la vidéo 🎬
        </div>
      )}

      {/* Warning banner when autoplay is blocked in full mode */}
      {showAutoplayWarning && !minimized && (
        <div className="bg-[#1DB954]/20 border-b border-[#1DB954]/40 px-3 py-2 text-center text-[11px] text-[#1DB954] font-bold animate-pulse flex flex-col gap-0.5 justify-center items-center shrink-0">
          <p className="flex items-center gap-1.5 justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
            <span>CLIQUEZ SUR LA VIDÉO CI-DESSOUS</span>
          </p>
          <p className="text-[10px] text-neutral-400 font-normal">
            L'autoplay de votre navigateur nécessite un clic manuel
          </p>
        </div>
      )}

      {/* Silent audio element to maintain background audio session on mobile lock screen */}
      <audio 
        ref={silentAudioRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        loop
        playsInline
        className="hidden"
      />

      {/* Video Iframe Container (Always mounted in viewport so browser doesn't throttle) */}
      <div 
        className="relative bg-black flex-1 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: minimized ? 0.05 : 1,
          height: minimized ? "1px" : "calc(100% - 32px)",
          pointerEvents: minimized ? "none" : "auto"
        }}
      >
        <div 
          id={containerId} 
          style={{ 
            width: "100%", 
            height: "100%",
            aspectRatio: "16/9"
          }}
        ></div>
      </div>
    </div>
  );
}
