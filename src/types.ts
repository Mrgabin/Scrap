export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  album?: string;
  duration: string; // e.g. "3:45"
  durationSec?: number; // duration in seconds
  thumbnail: string;
  views?: string;
  isRecommendation?: boolean;
  addedAt?: string;
  cadenceType?: "security" | "safe_discovery" | "bold_discovery"; // 3:1 Cadence classification
  bpm?: number;
  genre?: string;
}

export interface DJState {
  isActive: boolean;
  currentMood: string;
  userHour: number;
  timeSlotName: string;
  consecutiveSkips: number;
  speechText: string;
  isSpeaking: boolean;
  cadenceQueue: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  tracks: Track[];
  isCustom?: boolean;
  createdBy?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface HistoryItem {
  id: string;
  track: Track;
  timestamp: any; // Firestore Timestamp
}

