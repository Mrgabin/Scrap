import { useState, useRef, useEffect, useCallback } from "react";
import { Track, DJState } from "../types";

interface UseDJEngineProps {
  user: any;
  likedTracks: Track[];
  recentTracks: Track[];
  tasteScores: any;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  onPlayQueueReplace: (tracks: Track[]) => void;
  onNextTrack: () => void;
}

export function useDJEngine({
  user,
  likedTracks,
  recentTracks,
  tasteScores,
  currentTrack,
  currentTime,
  duration,
  onPlayQueueReplace,
  onNextTrack
}: UseDJEngineProps) {
  const [djState, setDjState] = useState<DJState>({
    isActive: false,
    currentMood: "normal",
    userHour: new Date().getHours(),
    timeSlotName: "Routine",
    consecutiveSkips: 0,
    speechText: "",
    isSpeaking: false,
    cadenceQueue: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const skippedTracksRef = useRef<Track[]>([]);
  const hasPrefetchedSpeechRef = useRef<string | null>(null);

  // Fetch DJ Queue from backend
  const fetchDJQueue = useCallback(async (mode: "normal" | "change_mood" | "soft_reset" = "normal") => {
    setIsLoading(true);
    try {
      const userHour = new Date().getHours();
      const res = await fetch("/api/dj/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: recentTracks.map(t => ({ title: t.title, artist: t.artist })),
          likes: likedTracks.map(t => ({ title: t.title, artist: t.artist })),
          tasteScores,
          currentTrack: currentTrack ? { title: currentTrack.title, artist: currentTrack.artist, bpm: currentTrack.bpm, genre: currentTrack.genre } : null,
          userHour,
          consecutiveSkips: djState.consecutiveSkips,
          mode,
          skippedTracks: skippedTracksRef.current.map(t => ({ title: t.title, artist: t.artist }))
        })
      });

      if (!res.ok) {
        throw new Error(`Failed DJ recommendation fetch: ${res.status}`);
      }

      const data = await res.json();
      if (data.queue && Array.isArray(data.queue)) {
        setDjState(prev => ({
          ...prev,
          isActive: true,
          currentMood: mode === "change_mood" ? "Alternative Vibe" : mode,
          userHour: data.userHour || userHour,
          timeSlotName: data.timeSlotName || "Routine",
          cadenceQueue: data.queue
        }));

        // Pass queue to global player
        onPlayQueueReplace(data.queue);

        // Fetch DJ speech commentary for the first track in queue
        if (data.queue.length > 0) {
          fetchDJCommentary(data.queue[0], data.timeSlotName, mode);
        }
      }
    } catch (err) {
      console.error("Error fetching DJ queue:", err);
    } finally {
      setIsLoading(false);
    }
  }, [recentTracks, likedTracks, tasteScores, currentTrack, djState.consecutiveSkips, onPlayQueueReplace]);

  // Fetch DJ Speech Commentary
  const fetchDJCommentary = async (nextTrack: Track, timeSlotName: string, mode: string) => {
    try {
      const res = await fetch("/api/dj/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextTrack: { title: nextTrack.title, artist: nextTrack.artist },
          currentTrack: currentTrack ? { title: currentTrack.title, artist: currentTrack.artist } : null,
          userHour: new Date().getHours(),
          timeSlotName,
          mode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setDjState(prev => ({ ...prev, speechText: data.text }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch DJ speech commentary:", e);
    }
  };

  // Start DJ Mode
  const startDJSession = useCallback(() => {
    fetchDJQueue("normal");
  }, [fetchDJQueue]);

  // Changer de Mood
  const changeMood = useCallback(() => {
    fetchDJQueue("change_mood");
  }, [fetchDJQueue]);

  // Soft Reset
  const softReset = useCallback(() => {
    setDjState(prev => ({ ...prev, consecutiveSkips: 0 }));
    fetchDJQueue("soft_reset");
  }, [fetchDJQueue]);

  // Real-Time Listener: Handle Track Skips
  const handleSkipEvent = useCallback((playTimeSeconds: number) => {
    if (!djState.isActive || !currentTrack) return;

    if (playTimeSeconds < 10) {
      // Ultra-Fast Skip Detected (< 10 seconds)
      const newSkipCount = djState.consecutiveSkips + 1;
      console.log(`[DJ Engine] ⚡ Fast Skip Detected (<10s). Consecutive skips: ${newSkipCount}`);

      // Save skipped track to avoid re-playing
      skippedTracksRef.current.push(currentTrack);

      setDjState(prev => ({ ...prev, consecutiveSkips: newSkipCount }));

      if (newSkipCount >= 3) {
        // Trigger Soft Reset after 3 consecutive fast skips
        softReset();
      }
    } else {
      // Normal skip after >10s
      setDjState(prev => ({ ...prev, consecutiveSkips: 0 }));
    }
  }, [djState.isActive, djState.consecutiveSkips, currentTrack, softReset]);

  // Monitor Track Progress > 80% for Pre-fetching
  useEffect(() => {
    if (!djState.isActive || !currentTrack || duration <= 0) return;

    const progressRatio = currentTime / duration;
    if (progressRatio >= 0.80 && hasPrefetchedSpeechRef.current !== currentTrack.id) {
      hasPrefetchedSpeechRef.current = currentTrack.id;
      // Pre-fetch next DJ commentary in background at 80% mark
      const currentQueue = djState.cadenceQueue;
      const nextIdx = currentQueue.findIndex(t => t.id === currentTrack.id) + 1;
      if (nextIdx < currentQueue.length) {
        fetchDJCommentary(currentQueue[nextIdx], djState.timeSlotName, "normal");
      }
    }
  }, [currentTime, duration, djState.isActive, djState.cadenceQueue, djState.timeSlotName, currentTrack]);

  return {
    djState,
    isLoading,
    startDJSession,
    changeMood,
    softReset,
    handleSkipEvent
  };
}
