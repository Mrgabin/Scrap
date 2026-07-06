import React, { useEffect, useRef, useState } from "react";
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
  playTrigger
}: YoutubePlayerBridgeProps) {
  const playerRef = useRef<any>(null);
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
            } else if (event.data === 1) { // PLAYING = 1
              hasStartedPlayingRef.current = true;
              startTimer();
              const duration = playerRef.current?.getDuration() || 0;
              if (duration > 0) {
                onTrackReady(duration);
              }
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

  // Sync Play / Pause state
  useEffect(() => {
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

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!currentTrack) return null;

  return (
    <div 
      className="fixed z-50 bg-[#181818] border border-neutral-800 rounded-lg shadow-2xl transition-all duration-300 flex flex-col overflow-hidden select-none" 
      style={{ 
        bottom: "110px", 
        right: "24px", 
        width: minimized ? "180px" : "320px", 
        height: minimized ? "48px" : showAutoplayWarning ? "268px" : "220px",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-neutral-200">
        <span className="text-[10px] font-bold tracking-wider uppercase truncate max-w-[120px] flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 relative">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPlaying ? "bg-[#1DB954]" : "bg-neutral-500"}`}></span>
          </span>
          {minimized ? "Vidéo réduite" : "Lecteur Vidéo"}
        </span>
        <button 
          onClick={() => setMinimized(!minimized)} 
          className="text-xs text-neutral-400 hover:text-white transition-colors p-1 font-mono focus:outline-none"
          title={minimized ? "Agrandir le lecteur" : "Réduire le lecteur"}
        >
          {minimized ? "▲" : "▼"}
        </button>
      </div>

      {/* Warning banner when autoplay is blocked */}
      {showAutoplayWarning && !minimized && (
        <div className="bg-[#1DB954]/20 border-b border-[#1DB954]/40 px-3 py-2 text-center text-[11px] text-[#1DB954] font-bold animate-pulse flex flex-col gap-0.5 justify-center items-center shrink-0">
          <p className="flex items-center gap-1.5 justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
            <span>CLIQUEZ SUR LE LECTEUR VIDÉO</span>
          </p>
          <p className="text-[10px] text-neutral-400 font-normal">
            Pour lancer la musique (Autoplay bloqué)
          </p>
        </div>
      )}

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
