import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, linkWithCredential, EmailAuthProvider } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  updateDoc
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { Track, Playlist } from "./types";
import { CURATED_PLAYLISTS } from "./data/curatedPlaylists";

// Component imports
import AuthView from "./components/AuthView";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import YoutubePlayerBridge from "./components/YoutubePlayerBridge";
import HomeView from "./components/HomeView";
import SearchView from "./components/SearchView";
import SettingsView from "./components/SettingsView";
import PlaylistView from "./components/PlaylistView";
import ArtistView from "./components/ArtistView";
import LibraryView from "./components/LibraryView";
import MobileNav from "./components/MobileNav";
import { useIsMobile } from "./lib/useIsMobile";
import TasteSurveyModal from "./components/TasteSurveyModal";
import SpotifyImportModal from "./components/SpotifyImportModal";
import BlackHoleBackground from "./components/BlackHoleBackground";
import StableSingularityBackground from "./components/StableSingularityBackground";
import TectonicLavaBackground from "./components/TectonicLavaBackground";
import QuantumCoreBackground from "./components/QuantumCoreBackground";
import { useTranslation } from "./lib/LanguageContext";
import { getDeterministicArtistAvatar, fetchArtistAvatarClient } from "./lib/avatarHelper";
import { analyzeTrackMetadata } from "./lib/profiler";

import { 
  Sparkles, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Music, 
  CheckCircle,
  HelpCircle,
  Volume2,
  Home,
  Search,
  Inbox,
  Compass,
  X,
  Library,
  Info
} from "lucide-react";

const PRE_POPULATED_HISTORY = [
  {
    id: "hist_oliver_tree",
    name: "Oliver Tree",
    type: "Artiste",
    subtitle: "Artiste",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    artistName: "Oliver Tree"
  },
  {
    id: "hist_le_poisson_steve",
    name: "le poisson steve",
    type: "Titre",
    subtitle: "Titre • Tomo",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60",
    track: {
      id: "9m7_0p7U_F8",
      title: "le poisson steve",
      artist: "Tomo",
      thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60",
      duration: "2:45"
    }
  },
  {
    id: "hist_le_poussin_piou",
    name: "Le poussin piou - Radio Edit",
    type: "Titre",
    subtitle: "Titre • Pulcino Pio",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=60",
    track: {
      id: "iLskSgIeYic",
      title: "Le poussin piou - Radio Edit",
      artist: "Pulcino Pio",
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=60",
      duration: "2:40"
    }
  },
  {
    id: "hist_gangsta_gritz",
    name: "Gangsta Gritz",
    type: "Playlist",
    subtitle: "Playlist • jjjkat78",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&auto=format&fit=crop&q=60",
    playlistId: "curated-rap"
  },
  {
    id: "hist_rapcaviar",
    name: "RapCaviar",
    type: "Playlist",
    subtitle: "Playlist • Spotify",
    image: "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=100&auto=format&fit=crop&q=60",
    playlistId: "curated-rap"
  },
  {
    id: "hist_top_50_usa",
    name: "Top 50 - USA",
    type: "Playlist",
    subtitle: "Playlist • Top 50 - USA",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100&auto=format&fit=crop&q=60",
    playlistId: "curated-pop"
  },
  {
    id: "hist_top_50_france",
    name: "Top 50 : États-Unis",
    type: "Playlist",
    subtitle: "Playlist • Spotify",
    image: "https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=100&auto=format&fit=crop&q=60",
    playlistId: "curated-pop"
  },
  {
    id: "hist_hot_country",
    name: "Hot Country",
    type: "Playlist",
    subtitle: "Playlist • Spotify",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=100&auto=format&fit=crop&q=60",
    playlistId: "curated-folk"
  },
  {
    id: "hist_i_want_you_back",
    name: "I Want You Back",
    type: "Titre",
    subtitle: "Titre • Jackson 5",
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=100&auto=format&fit=crop&q=60",
    track: {
      id: "s3Q80mk7dx0",
      title: "I Want You Back",
      artist: "Jackson 5",
      thumbnail: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=100&auto=format&fit=crop&q=60",
      duration: "2:59"
    }
  }
];

export default function App() {
  const { country, t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Shared Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState("home"); // home, search, settings, library, liked-songs, playlist-{id}, artist-{name}
  const [selectedArtistName, setSelectedArtistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Firestore user data states
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_recommendations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [recommendationTimestamp, setRecommendationTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_recommendations_timestamp");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [followedArtists, setFollowedArtists] = useState<string[]>([]);
  const [artistAvatars, setArtistAvatars] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("spotify_artist_avatars");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>(() => {
    return localStorage.getItem("scrap_custom_background_url") || "";
  });

  // Search History States
  const getSearchHistoryKey = (currentUser: any) => {
    if (!currentUser) return null;
    if (currentUser.isGuest) return null;
    return `spotify_search_history_${currentUser.uid}`;
  };

  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    const key = getSearchHistoryKey(user);
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved));
          return;
        } catch (e) {}
      }
    }
    // Everyone (including guests) starts with an empty history. No PRE_POPULATED_HISTORY.
    setSearchHistory([]);
  }, [user?.uid, user?.isGuest]);

  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [showSearchInfo, setShowSearchInfo] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Password Security & Verification States
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(false);
  const [hasPasswordInDb, setHasPasswordInDb] = useState<boolean | null>(null);
  const [correctPassword, setCorrectPassword] = useState<string | null>(null);
  const [checkingPassword, setCheckingPassword] = useState<boolean>(false);
  const [passwordSetupInput, setPasswordSetupInput] = useState("");
  const [passwordConfirmInput, setPasswordConfirmInput] = useState("");
  const [passwordVerifyInput, setPasswordVerifyInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordChar, setShowPasswordChar] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsPasswordVerified(false);
      setHasPasswordInDb(null);
      setCorrectPassword(null);
      return;
    }

    if (user.isGuest || (user.providerData && user.providerData.some((p: any) => p.providerId === "password"))) {
      setIsPasswordVerified(true);
      return;
    }

    const checkPasswordRecord = async () => {
      setCheckingPassword(true);
      try {
        const docRef = doc(db, "mot_de_passe", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.password) {
            setHasPasswordInDb(true);
            setCorrectPassword(data.password);
            setIsPasswordVerified(false); // must verify first
          } else {
            setHasPasswordInDb(false);
            setIsPasswordVerified(false); // must define one first
          }
        } else {
          setHasPasswordInDb(false);
          setIsPasswordVerified(false); // must define one first
        }
      } catch (err) {
        console.error("Error checking password in Firestore:", err);
        // Trace and wrap error as required by firebase-integration guidelines
        try {
          handleFirestoreError(err, OperationType.GET, "mot_de_passe/" + user.uid);
        } catch (formattedError) {
          console.error("Formatted Firestore Error:", formattedError);
        }
        // Fallback
        setHasPasswordInDb(false);
      } finally {
        setCheckingPassword(false);
      }
    };

    checkPasswordRecord();
  }, [user?.uid, user?.isGuest, user?.providerData]);

  // Algorithmic & Taste Survey States
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [tasteScores, setTasteScores] = useState<any>(() => {
    const saved = localStorage.getItem("spotify_taste_scores");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      genres: { rap: 10, pop: 10, electro: 10, rock: 10, lofi: 10 },
      languages: { fr: 10, en: 10 },
      rhythms: { fast: 10, medium: 10, slow: 10 },
      eras: { "2020s": 10, "2010s": 10, "2000s": 10, classic: 10 },
      artists: {}
    };
  });
  const [showTasteSurvey, setShowTasteSurvey] = useState(false);
  const [personalizedPlaylists, setPersonalizedPlaylists] = useState<Playlist[]>([]);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);

  // Music Player Core States
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    const saved = localStorage.getItem("spotify_last_track");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playQueue, setPlayQueue] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_last_queue");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [queueIndex, setQueueIndex] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_last_queue_index");
    if (saved) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx)) return idx;
    }
    return -1;
  });
  const [currentTime, setCurrentTime] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_last_time");
    if (saved) {
      const t = parseFloat(saved);
      if (!isNaN(t)) return t;
    }
    return 0;
  });
  const [duration, setDuration] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_last_duration");
    if (saved) {
      const d = parseFloat(saved);
      if (!isNaN(d)) return d;
    }
    return 0;
  });
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_last_volume");
    if (saved) {
      const v = parseInt(saved, 10);
      if (!isNaN(v)) return v;
    }
    return 50;
  });
  const [initialStartTime, setInitialStartTime] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_last_time");
    if (saved) {
      const t = parseFloat(saved);
      if (!isNaN(t)) return t;
    }
    return 0;
  });
  const [playTrigger, setPlayTrigger] = useState<number>(0);

  // Spotify Credentials & Modal state
  const [spotifyClientId, setSpotifyClientId] = useState<string>("");
  const [spotifyClientSecret, setSpotifyClientSecret] = useState<string>("");
  const [showSpotifyImportModal, setShowSpotifyImportModal] = useState<boolean>(false);

  // Playback history stack to support back navigation through dynamic played tracks
  const [playbackHistory, setPlaybackHistory] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_playback_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Playback forward history stack to support forward navigation
  const [playbackForwardHistory, setPlaybackForwardHistory] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_playback_forward_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Shuffle & Smart Shuffle state management
  const [shuffleMode, setShuffleMode] = useState<number>(() => {
    const saved = localStorage.getItem("spotify_shuffle_mode");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [activePlaybackContext, setActivePlaybackContext] = useState<'liked' | 'playlist' | 'artist' | 'album' | null>(() => {
    const saved = localStorage.getItem("spotify_active_playback_context");
    return (saved as any) || null;
  });
  const [shufflePlayedIds, setShufflePlayedIds] = useState<string[]>([]);
  const [smartShuffleCount, setSmartShuffleCount] = useState<number>(0);
  const [smartShuffleDislikes, setSmartShuffleDislikes] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("spotify_shuffle_mode", shuffleMode.toString());
  }, [shuffleMode]);

  useEffect(() => {
    if (activePlaybackContext) {
      localStorage.setItem("spotify_active_playback_context", activePlaybackContext);
    } else {
      localStorage.removeItem("spotify_active_playback_context");
    }
  }, [activePlaybackContext]);

  const isBackNavigatingRef = useRef<boolean>(false);
  const isForwardNavigatingRef = useRef<boolean>(false);
  const prevTrackRef = useRef<Track | null>(null);

  useEffect(() => {
    localStorage.setItem("spotify_playback_history", JSON.stringify(playbackHistory));
  }, [playbackHistory]);

  useEffect(() => {
    localStorage.setItem("spotify_playback_forward_history", JSON.stringify(playbackForwardHistory));
  }, [playbackForwardHistory]);

  useEffect(() => {
    const previous = prevTrackRef.current;
    if (currentTrack) {
      if (previous && previous.id !== currentTrack.id) {
        if (isBackNavigatingRef.current) {
          // Navigating backward. Save 'previous' into the forward history stack.
          setPlaybackForwardHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1].id === previous.id) {
              return prev;
            }
            const nextStack = [...prev, previous];
            if (nextStack.length > 30) nextStack.shift();
            return nextStack;
          });
          isBackNavigatingRef.current = false;
        } else if (isForwardNavigatingRef.current) {
          // Navigating forward. Save 'previous' into the backward history stack.
          setPlaybackHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1].id === previous.id) {
              return prev;
            }
            const nextStack = [...prev, previous];
            if (nextStack.length > 30) nextStack.shift();
            return nextStack;
          });
          isForwardNavigatingRef.current = false;
        } else {
          // Manual navigation / new track chosen. Clear the forward stack, save 'previous' into backward history.
          setPlaybackForwardHistory([]);
          setPlaybackHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1].id === previous.id) {
              return prev;
            }
            const nextStack = [...prev, previous];
            if (nextStack.length > 30) nextStack.shift();
            return nextStack;
          });
        }
      }
      prevTrackRef.current = currentTrack;
    }
  }, [currentTrack]);

  // --- Profilage IA & Listening Time Tracker ---
  const activeListeningSecondsRef = useRef<number>(0);
  const prevTrackForProfilingRef = useRef<Track | null>(null);

  // Function to commit accumulated listening time and calculate positive/negative scores
  const commitTrackListeningTime = (trackToCommit: Track, durationSec: number, listenedSec: number) => {
    if (!trackToCommit) return;
    
    const ratio = durationSec > 0 ? listenedSec / durationSec : 0;
    
    // Determine score change
    let scoreDelta = 0;
    let actionLabel = "";
    
    if (listenedSec >= 45 || ratio >= 0.8) {
      // Long listen or completion: strong positive signal!
      scoreDelta = 2;
      actionLabel = "AIME_BEAUCOUP";
    } else if (listenedSec >= 15 || ratio >= 0.3) {
      // Moderate listen: mild positive signal!
      scoreDelta = 1;
      actionLabel = "AIME_BIEN";
    } else {
      // Skipped within 15 seconds: strong negative signal!
      scoreDelta = -1;
      actionLabel = "AIME_PAS";
    }
    
    updateTasteScores(trackToCommit, scoreDelta, actionLabel);
  };

  // Function to update user's taste scores across all 5 dimensions
  const updateTasteScores = async (track: Track, delta: number, action: string) => {
    const profile = analyzeTrackMetadata(track.title, track.artist);
    
    setTasteScores((prev: any) => {
      const updated = { ...prev };
      
      // 1. Genre
      const g = profile.genre;
      updated.genres = { ...updated.genres };
      updated.genres[g] = Math.max(0, (updated.genres[g] ?? 10) + delta);
      
      // 2. Language
      const l = profile.language;
      updated.languages = { ...updated.languages };
      updated.languages[l] = Math.max(0, (updated.languages[l] ?? 10) + delta);
      
      // 3. Rhythm
      const r = profile.rhythm;
      updated.rhythms = { ...updated.rhythms };
      updated.rhythms[r] = Math.max(0, (updated.rhythms[r] ?? 10) + delta);
      
      // 4. Era
      const e = profile.era;
      updated.eras = { ...updated.eras };
      updated.eras[e] = Math.max(0, (updated.eras[e] ?? 10) + delta);
      
      // 5. Artist
      const art = profile.artist;
      updated.artists = { ...updated.artists };
      updated.artists[art] = Math.max(0, (updated.artists[art] ?? 10) + delta);
      
      console.log(`[Profilage IA] Action: ${action} (+${delta} pts). Scores mis à jour :`, {
        genre: `${g} (${updated.genres[g]} pts)`,
        language: `${l} (${updated.languages[l]} pts)`,
        rhythm: `${r} (${updated.rhythms[r]} pts)`,
        era: `${e} (${updated.eras[e]} pts)`,
        artist: `${art} (${updated.artists[art]} pts)`
      });

      // Save locally
      localStorage.setItem("spotify_taste_scores", JSON.stringify(updated));

      // Save to Firestore if connected
      if (user && !user.isGuest) {
        const docRef = doc(db, "users", user.uid);
        updateDoc(docRef, { tasteScores: updated }).catch(err => {
          console.error("Firestore TasteScores update failed:", err);
        });
      }

      return updated;
    });
  };

  // Real-time track listener to detect active seconds played
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        activeListeningSecondsRef.current += 1;
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack?.id]);

  // Handle track changes & commit listening scores on change
  useEffect(() => {
    const oldTrack = prevTrackForProfilingRef.current;
    const spentSec = activeListeningSecondsRef.current;
    
    if (oldTrack && spentSec > 0) {
      let durSec = oldTrack.durationSec || 200;
      if (typeof oldTrack.duration === 'string') {
        const parts = oldTrack.duration.split(':');
        if (parts.length === 2) {
          const m = parseInt(parts[0], 10);
          const s = parseInt(parts[1], 10);
          if (!isNaN(m) && !isNaN(s)) durSec = m * 60 + s;
        }
      }
      commitTrackListeningTime(oldTrack, durSec, spentSec);
    }
    
    // Reset listening timer for the new track
    activeListeningSecondsRef.current = 0;
    prevTrackForProfilingRef.current = currentTrack;
  }, [currentTrack?.id]);

  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem("spotify_last_track", JSON.stringify(currentTrack));
    } else {
      localStorage.removeItem("spotify_last_track");
    }
  }, [currentTrack]);

  useEffect(() => {
    if (playQueue && playQueue.length > 0) {
      localStorage.setItem("spotify_last_queue", JSON.stringify(playQueue));
    } else {
      localStorage.removeItem("spotify_last_queue");
    }
  }, [playQueue]);

  useEffect(() => {
    if (queueIndex !== -1) {
      localStorage.setItem("spotify_last_queue_index", String(queueIndex));
    }
  }, [queueIndex]);

  useEffect(() => {
    if (currentTime > 0) {
      localStorage.setItem("spotify_last_time", String(currentTime));
    }
  }, [currentTime]);

  useEffect(() => {
    if (duration > 0) {
      localStorage.setItem("spotify_last_duration", String(duration));
    }
  }, [duration]);

  useEffect(() => {
    localStorage.setItem("spotify_last_volume", String(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("spotify_last_playing", String(isPlaying));
  }, [isPlaying]);

  // Backend Feed States
  const [homeFeedData, setHomeFeedData] = useState<any>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Inline Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [newPlaylistColor, setNewPlaylistColor] = useState("#2e7d32");

  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const executeSearch = async (queryVal: string) => {
    if (!queryVal.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: queryVal,
          country: country,
          tasteScores: tasteScores,
          recentArtists: recentTracks ? recentTracks.map((tr: Track) => tr.artist) : []
        })
      });
      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
        
        // Find the primary artist of this search and pre-fetch/cache their official avatar image
        if (data.results.length > 0) {
          const queryLower = queryVal.toLowerCase().trim();
          const matchedTrack = data.results.find((t: any) => t.artist.toLowerCase().includes(queryLower));
          const artistName = matchedTrack ? matchedTrack.artist : data.results[0].artist;
          
          if (artistName && !artistAvatars[artistName]) {
            const getAvatar = async () => {
              let url = null;
              try {
                const res = await fetch(`/api/artist-profile?name=${encodeURIComponent(artistName)}`);
                if (res.ok) {
                  const profile = await res.json();
                  if (profile && profile.avatarUrl && !profile.avatarUrl.includes("unsplash.com")) {
                    url = profile.avatarUrl;
                  }
                }
              } catch (e) {
                // Ignore backend failure (e.g. CORS on Vercel)
              }

              // Fall back to direct client-side Wikipedia / iTunes scraper if backend failed or returned placeholder
              if (!url) {
                url = await fetchArtistAvatarClient(artistName);
              }

              if (url) {
                setArtistAvatars(prev => {
                  const next = { ...prev, [artistName]: url };
                  localStorage.setItem("spotify_artist_avatars", JSON.stringify(next));
                  return next;
                });
              }
            };
            getAvatar();
          }
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // 1. Firebase Auth State Monitor / Guest Mode check
  useEffect(() => {
    const savedGuest = localStorage.getItem("spotify_guest_user");
    if (savedGuest) {
      try {
        const guestObj = JSON.parse(savedGuest);
        setUser(guestObj);
        setLoadingAuth(false);
        return;
      } catch (e) {
        localStorage.removeItem("spotify_guest_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      // Reset state if logged out
      if (!currentUser) {
        setLikedTracks([]);
        setCustomPlaylists([]);
        setRecentTracks([]);
        setRecommendations([]);
        setFirestoreError(null);
        setTasteProfile(null);
        setPersonalizedPlaylists([]);
        setShowTasteSurvey(false);
        setSpotifyClientId("");
        setSpotifyClientSecret("");
      }
    });
    return unsubscribe;
  }, []);

  // 1b. Check for shared playlist in URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("sharedPlaylistId") || params.get("shared");
    if (sharedId) {
      const fetchSharedPlaylist = async () => {
        try {
          const docRef = doc(db, "sharedPlaylists", sharedId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            const sharedPl = { id: snap.id, ...data } as Playlist;
            setSelectedPlaylist(sharedPl);
            setCurrentView(`playlist-${snap.id}`);
            
            // Clean URL query parameters so that refreshing or navigating doesn't lock the user on this playlist
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            setFirestoreError(`Playlist partagée "${sharedPl.name}" chargée avec succès !`);
            setTimeout(() => setFirestoreError(null), 5000);
          } else {
            console.warn("Shared playlist not found:", sharedId);
            setFirestoreError("La playlist partagée demandée n'existe pas ou a été supprimée.");
            setTimeout(() => setFirestoreError(null), 5000);
          }
        } catch (err: any) {
          console.error("Error loading shared playlist on mount:", err);
          setFirestoreError(`Erreur lors du chargement de la playlist: ${err.message}`);
          setTimeout(() => setFirestoreError(null), 5000);
        }
      };
      fetchSharedPlaylist();
    }
  }, []);

  // 2. Fetch User Data (Liked Songs & Playlists & History) dynamically
  useEffect(() => {
    if (!user) return;

    if (user.isGuest) {
      // Guest users start with absolutely clean, non-persisted empty states
      setFollowedArtists([]);
      setLikedTracks([]);
      setCustomPlaylists([]);
      setRecentTracks([]);
      setTasteProfile(null);
      setPersonalizedPlaylists([]);
      
      // Load Spotify credentials from local storage for guest
      setSpotifyClientId(localStorage.getItem("spotify_client_id") || "");
      setSpotifyClientSecret(localStorage.getItem("spotify_client_secret") || "");
      return;
    }

    // A. Liked Songs listener
    const likedQuery = collection(db, "users", user.uid, "likedTracks");
    const unsubLiked = onSnapshot(likedQuery, (snap) => {
      const tracks: Track[] = [];
      snap.forEach((doc) => {
        tracks.push(doc.data() as Track);
      });
      setLikedTracks(tracks);
    }, (err) => {
      console.error("Liked songs list failed:", err);
      setFirestoreError(`Firestore: ${err.message}`);
    });

    // B. Custom Playlists listener
    const playlistsQuery = collection(db, "users", user.uid, "playlists");
    const unsubPlaylists = onSnapshot(playlistsQuery, (snap) => {
      const lists: Playlist[] = [];
      snap.forEach((doc) => {
        lists.push({ id: doc.id, ...doc.data() } as Playlist);
      });
      setCustomPlaylists(lists);
    }, (err) => {
      console.error("Playlists list failed:", err);
      setFirestoreError(`Firestore: ${err.message}`);
    });

    // C. Recent Listening History listener
    const historyQuery = query(
      collection(db, "users", user.uid, "history"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubHistory = onSnapshot(historyQuery, (snap) => {
      const tracks: Track[] = [];
      snap.forEach((doc) => {
        const item = doc.data();
        if (item.track) {
          tracks.push(item.track);
        }
      });
      // Filter out duplicate consecutive tracks for clean UI
      const uniqueRecent: Track[] = [];
      tracks.forEach(track => {
        if (uniqueRecent.length === 0 || uniqueRecent[uniqueRecent.length - 1].id !== track.id) {
          uniqueRecent.push(track);
        }
      });
      setRecentTracks(uniqueRecent.slice(0, 8));
    }, (err) => {
      console.error("Listening history list failed:", err);
      // Suppress transient sorting index errors until index is built if needed
      if (!err.message.includes("index")) {
        setFirestoreError(`Firestore: ${err.message}`);
      }
    });

    // D. Followed Artists listener
    const followedQuery = collection(db, "users", user.uid, "followedArtists");
    const unsubFollowed = onSnapshot(followedQuery, (snap) => {
      const artists: string[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.artistName) {
          artists.push(data.artistName);
        }
      });
      setFollowedArtists(artists);
    }, (err) => {
      console.error("Followed artists list failed:", err);
    });

    // E. User Taste Profile listener
    const userDocRef = doc(db, "users", user.uid);
    const unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tasteProfile) {
          setTasteProfile(data.tasteProfile);
        } else {
          setTasteProfile(null);
        }
        if (data.tasteScores) {
          setTasteScores(data.tasteScores);
          localStorage.setItem("spotify_taste_scores", JSON.stringify(data.tasteScores));
        }
        if (data.customBackgroundUrl) {
          setCustomBackgroundUrl(data.customBackgroundUrl);
          localStorage.setItem("scrap_custom_background_url", data.customBackgroundUrl);
        } else {
          setCustomBackgroundUrl("");
          localStorage.removeItem("scrap_custom_background_url");
        }
        
        // Sync Spotify credentials
        if (data.spotifyClientId) {
          setSpotifyClientId(data.spotifyClientId);
        } else {
          setSpotifyClientId("");
        }
        if (data.spotifyClientSecret) {
          setSpotifyClientSecret(data.spotifyClientSecret);
        } else {
          setSpotifyClientSecret("");
        }
      } else {
        setTasteProfile(null);
        setCustomBackgroundUrl("");
        localStorage.removeItem("scrap_custom_background_url");
        setSpotifyClientId("");
        setSpotifyClientSecret("");
      }
    }, (err) => {
      console.error("User document snapshot failed:", err);
    });

    // F. Algorithmic Playlists listener
    const personalizedQuery = collection(db, "users", user.uid, "personalizedPlaylists");
    const unsubPersonalized = onSnapshot(personalizedQuery, (snap) => {
      const lists: Playlist[] = [];
      snap.forEach((doc) => {
        lists.push({ id: doc.id, ...doc.data() } as Playlist);
      });
      lists.sort((a, b) => a.id.localeCompare(b.id));
      setPersonalizedPlaylists(lists);
    }, (err) => {
      console.error("Personalized playlists loading failed:", err);
    });

    // G. Search History listener (Firestore Database)
    const searchHistoryQuery = query(
      collection(db, "users", user.uid, "searchHistory"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubSearchHistory = onSnapshot(searchHistoryQuery, (snap) => {
      const items: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({ id: docSnap.id, ...data });
      });
      setSearchHistory(items);
      const key = getSearchHistoryKey(user);
      if (key) {
        localStorage.setItem(key, JSON.stringify(items));
      }
    }, (err) => {
      console.error("Search history Firestore listener failed:", err);
    });

    return () => {
      unsubLiked();
      unsubPlaylists();
      unsubHistory();
      unsubFollowed();
      unsubUserDoc();
      unsubPersonalized();
      unsubSearchHistory();
    };
  }, [user]);

  // Fetch avatars for followed artists dynamically
  useEffect(() => {
    let active = true;
    const fetchAvatars = async () => {
      for (const artist of followedArtists) {
        if (!active) break;
        if (!artistAvatars[artist]) {
          try {
            let avatarUrl = null;
            try {
              const res = await fetch(`/api/artist-profile?name=${encodeURIComponent(artist)}`);
              if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  const data = await res.json();
                  if (data && data.avatarUrl && !data.avatarUrl.includes("unsplash.com")) {
                    avatarUrl = data.avatarUrl;
                  }
                }
              }
            } catch (e) {
              // Ignore backend errors (CORS on Vercel)
            }

            // Direct client-side Wikipedia/iTunes fallback
            if (!avatarUrl && active) {
              avatarUrl = await fetchArtistAvatarClient(artist);
            }

            if (avatarUrl && active) {
              setArtistAvatars(prev => {
                const next = { ...prev, [artist]: avatarUrl };
                localStorage.setItem("spotify_artist_avatars", JSON.stringify(next));
                return next;
              });
            }
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (err) {
            console.error("Failed to load followed artist avatar:", err);
          }
        }
      }
    };
    if (followedArtists.length > 0) {
      fetchAvatars();
    }
    return () => {
      active = false;
    };
  }, [followedArtists, artistAvatars]);

  // 3. Fetch Home Feed categories from Express back-end
  useEffect(() => {
    let active = true;
    const fetchHomeFeed = async () => {
      setLoadingFeed(true);
      try {
        const res = await fetch("/api/home");
        if (!res.ok) {
          console.warn(`Failed to load home categories: ${res.status}`);
          return;
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (active) {
            setHomeFeedData(data);
          }
        } else {
          const text = await res.text();
          console.warn("Expected JSON for home feed, got:", text);
        }
      } catch (err) {
        console.error("Failed to load home categories:", err);
      } finally {
        if (active) {
          setLoadingFeed(false);
        }
      }
    };
    fetchHomeFeed();
    return () => {
      active = false;
    };
  }, []);

  // 4. Trigger Intelligent Recommendations on boot or when 30 minutes have elapsed
  useEffect(() => {
    if (!user) return;

    const checkAndCalculate = () => {
      const now = Date.now();
      const elapsed = now - recommendationTimestamp;
      const thirtyMinutes = 30 * 60 * 1000;

      if (recommendations.length === 0 || elapsed >= thirtyMinutes) {
        console.log("30 minutes elapsed or empty, recalculating recommendations...");
        calculateRecommendations();
      }
    };

    // Run check on mount or when user changes
    checkAndCalculate();

    // Set up interval to check and update automatically every 1 minute
    const interval = setInterval(checkAndCalculate, 60000);
    return () => clearInterval(interval);
  }, [user, recommendationTimestamp, recommendations.length]);

  const calculateRecommendations = async (tracksToAnalyze?: Track[]) => {
    if (!user) return;
    setLoadingRecommendations(true);
    try {
      // Map user preferences and history for highly precise AI recommendations
      const simplifiedHistory = recentTracks.map(t => ({ title: t.title, artist: t.artist }));
      const simplifiedLikes = likedTracks.map(t => ({ title: t.title, artist: t.artist }));
      const currentList = tracksToAnalyze || playQueue;
      
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: simplifiedHistory,
          likes: simplifiedLikes,
          followedArtists: followedArtists,
          searchHistory: searchHistory,
          tasteProfile: tasteProfile,
          currentTracks: currentList.map(t => ({ title: t.title, artist: t.artist })),
          tasteScores: tasteScores
        })
      });
      if (!res.ok) {
        console.warn(`Failed to fetch recommendations: ${res.status}`);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.recommendations) {
          const now = Date.now();
          setRecommendations(data.recommendations);
          setRecommendationTimestamp(now);
          localStorage.setItem("spotify_recommendations", JSON.stringify(data.recommendations));
          localStorage.setItem("spotify_recommendations_timestamp", String(now));
        }
      } else {
        const text = await res.text();
        console.warn("Expected JSON for recommendations, got:", text);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // 4.5. Monitor Taste Survey status and prompt if missing
  useEffect(() => {
    if (user && tasteProfile === null && !loadingAuth) {
      const timer = setTimeout(() => {
        if (tasteProfile === null) {
          setShowTasteSurvey(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else if (tasteProfile !== null) {
      setShowTasteSurvey(false);
    }
  }, [user, tasteProfile, loadingAuth]);

  // 5. App Navigation helpers
  const handleSelectArtist = (artistName: string) => {
    setSelectedArtistName(artistName);
    setCurrentView(`artist-${artistName}`);
    
    if (currentView === "search") {
      addToSearchHistory({
        id: `artist-${artistName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: artistName,
        type: "Artiste",
        subtitle: "Artiste",
        image: artistAvatars[artistName] || getDeterministicArtistAvatar(artistName),
        artistName: artistName
      });
    }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setCurrentView(`playlist-${playlist.id}`);
  };

  const handleSelectLikedSongs = () => {
    setSelectedPlaylist(null);
    setCurrentView("liked-songs");
  };

  const handleToggleFollowArtist = async (artistName: string) => {
    if (!user) return;
    
    const isFollowing = followedArtists.includes(artistName);
    const updated = isFollowing 
      ? followedArtists.filter(name => name !== artistName)
      : [...followedArtists, artistName];
      
    setFollowedArtists(updated);
    
    if (user.isGuest) {
      // In guest mode, do not persist following state to localStorage (keep in-memory only)
    } else {
      const artistId = artistName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const docRef = doc(db, "users", user.uid, "followedArtists", artistId);
      if (isFollowing) {
        try {
          await deleteDoc(docRef);
        } catch (err: any) {
          console.error("Error unfollowing artist:", err);
          setFirestoreError(`Erreur désabonnement: ${err.message}`);
        }
      } else {
        try {
          await setDoc(docRef, {
            artistName: artistName,
            followedAt: new Date().toISOString()
          });
        } catch (err: any) {
          console.error("Error following artist:", err);
          setFirestoreError(`Erreur abonnement: ${err.message}`);
        }
      }
    }
  };

  // 6. Playback operations
  const handlePlayTrack = async (track: Track, contextList: Track[] = []) => {
    setInitialStartTime(0);
    setCurrentTime(0);
    setSeekTo(0);
    localStorage.setItem("spotify_last_time", "0");
    setCurrentTrack(track);
    setIsPlaying(true);
    setPlayTrigger(Date.now());

    // Determine and set playback context
    let contextType: 'liked' | 'playlist' | 'artist' | 'album' | null = null;
    if (currentView === "liked-songs") {
      contextType = "liked";
    } else if (currentView.startsWith("playlist-")) {
      contextType = "playlist";
    } else if (currentView.startsWith("artist-")) {
      contextType = "artist";
    } else if (contextList.length > 0 && likedTracks.length > 0 && contextList[0].id === likedTracks[0].id) {
      contextType = "liked";
    }
    setActivePlaybackContext(contextType);

    // Reset shuffle states for the new session
    setShufflePlayedIds([track.id]);
    setSmartShuffleCount(0);
    
    if (contextList.length > 0) {
      setPlayQueue(contextList);
      const idx = contextList.findIndex(t => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
      if (shuffleMode === 2) {
        calculateRecommendations(contextList);
      }
    } else {
      setPlayQueue([track]);
      setQueueIndex(0);
      if (shuffleMode === 2) {
        calculateRecommendations([track]);
      }
    }

    if (currentView === "search") {
      addToSearchHistory({
        id: `track-${track.id}`,
        name: track.title,
        type: "Titre",
        subtitle: `Titre • ${track.artist}`,
        image: track.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60",
        track: track
      });
    }

    // Append to listening history only for authenticated users
    if (user && !user.isGuest) {
      try {
        await addDoc(collection(db, "users", user.uid, "history"), {
          track,
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        console.error("Error logging history:", err);
        setFirestoreError(`Erreur historique: ${err.message}`);
      }
    }
  };

  // Dynamic resolution of YouTube Track IDs on-the-fly when playing
  useEffect(() => {
    if (!currentTrack || !currentTrack.id.startsWith("resolve:")) return;

    let active = true;

    const resolveTrack = async () => {
      const parts = currentTrack.id.split(":");
      const artist = decodeURIComponent(parts[1] || "");
      const title = decodeURIComponent(parts[2] || "");
      
      try {
        const response = await fetch(`/api/resolve-track?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
        if (response.ok && active) {
          const data = await response.json();
          if (data && data.id) {
            const resolvedTrack = {
              ...currentTrack,
              id: data.id,
              views: data.views || currentTrack.views,
              duration: data.duration || currentTrack.duration
            };

            // Update current track
            setCurrentTrack(resolvedTrack);

            // Also update the track in the playQueue so next/prev has correct IDs
            setPlayQueue(prevQueue => 
              prevQueue.map(t => t.id === currentTrack.id ? resolvedTrack : t)
            );
          }
        }
      } catch (err) {
        console.error("Error resolving track in hook:", err);
      }
    };

    resolveTrack();

    return () => {
      active = false;
    };
  }, [currentTrack?.id]);

  // Click outside search container listener to close history dropdown and search info
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchHistoryOpen(false);
        setShowSearchInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addToSearchHistory = async (item: {
    id: string;
    name: string;
    type: string;
    subtitle: string;
    image: string;
    track?: any;
    artistName?: string;
    playlistId?: string;
  }) => {
    // 1. Optimistic UI update
    setSearchHistory((prevHistory) => {
      const filtered = prevHistory.filter((h) => h.id !== item.id && h.name !== item.name);
      const updated = [item, ...filtered].slice(0, 15);
      const key = getSearchHistoryKey(user);
      if (key) {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Persist to Firestore database for authenticated non-guest users
    if (user && !user.isGuest) {
      try {
        const safeDocId = (item.id || item.name || `search_${Date.now()}`)
          .replace(/[\/\\#?%]/g, "_")
          .substring(0, 100);
        const docRef = doc(db, "users", user.uid, "searchHistory", safeDocId);
        const payload: any = {
          id: safeDocId,
          name: item.name || "",
          type: item.type || "Inconnu",
          subtitle: item.subtitle || "",
          image: item.image || "",
          timestamp: new Date().toISOString()
        };
        if (item.track) payload.track = item.track;
        if (item.artistName) payload.artistName = item.artistName;
        if (item.playlistId) payload.playlistId = item.playlistId;

        await setDoc(docRef, payload, { merge: true });
      } catch (err: any) {
        console.error("Error saving search history item to Firestore:", err);
      }
    }
  };

  const handleRemoveFromHistory = async (id: string) => {
    setSearchHistory((prevHistory) => {
      const updated = prevHistory.filter((h) => h.id !== id);
      const key = getSearchHistoryKey(user);
      if (key) {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    });

    if (user && !user.isGuest) {
      try {
        const safeDocId = id.replace(/[\/\\#?%]/g, "_").substring(0, 100);
        const docRef = doc(db, "users", user.uid, "searchHistory", safeDocId);
        await deleteDoc(docRef);
      } catch (err: any) {
        console.error("Error deleting search history item from Firestore:", err);
      }
    }
  };

  const handleClearHistory = async () => {
    setSearchHistory([]);
    const key = getSearchHistoryKey(user);
    if (key) {
      localStorage.setItem(key, JSON.stringify([]));
    }

    if (user && !user.isGuest) {
      try {
        const historyColRef = collection(db, "users", user.uid, "searchHistory");
        const snap = await getDocs(historyColRef);
        const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
      } catch (err: any) {
        console.error("Error clearing search history from Firestore:", err);
      }
    }
  };

  const handleHistoryItemClick = (item: any) => {
    setIsSearchHistoryOpen(false);
    if (item.type === "Titre" && item.track) {
      handlePlayTrack(item.track);
    } else if (item.type === "Artiste" && item.artistName) {
      handleSelectArtist(item.artistName);
    } else if (item.type === "Playlist") {
      setSearchQuery(item.name);
      if (currentView !== "search") {
        setCurrentView("search");
      }
      executeSearch(item.name);
    } else {
      setSearchQuery(item.name);
      if (currentView !== "search") {
        setCurrentView("search");
      }
      executeSearch(item.name);
    }
  };

  const handlePlayPauseToggle = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextTrack = () => {
    // Register negative signal if a recommended track is skipped within 30 seconds
    if (currentTrack && currentTrack.isRecommendation && currentTime < 30) {
      setSmartShuffleDislikes(prev => {
        if (!prev.includes(currentTrack.artist)) {
          return [...prev, currentTrack.artist];
        }
        return prev;
      });
      console.log(`Smart Shuffle negative signal registered: Skipped "${currentTrack.title}" by ${currentTrack.artist} within 30s.`);
    }

    if (playbackForwardHistory.length > 0) {
      const forwardCopy = [...playbackForwardHistory];
      const nextTrack = forwardCopy.pop()!;
      setPlaybackForwardHistory(forwardCopy);

      isForwardNavigatingRef.current = true;

      // Sync queue index if this track is in the active queue
      const existingQueueIdx = playQueue.findIndex(t => t.id === nextTrack.id);
      if (existingQueueIdx !== -1) {
        setQueueIndex(existingQueueIdx);
      }

      setInitialStartTime(0);
      setCurrentTime(0);
      setSeekTo(0);
      localStorage.setItem("spotify_last_time", "0");
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      setPlayTrigger(Date.now());
    } else if (playQueue.length > 0) {
      if (shuffleMode === 1) {
        // --- 1. Standard Shuffle ---
        // Filter out recently played tracks to avoid repetition
        let eligibleTracks = playQueue.filter(t => !shufflePlayedIds.includes(t.id));
        if (eligibleTracks.length === 0) {
          // If all tracks played, reset history and keep the current track out of immediate repeat if possible
          eligibleTracks = playQueue.filter(t => t.id !== currentTrack?.id);
          if (eligibleTracks.length === 0) eligibleTracks = playQueue;
          setShufflePlayedIds([currentTrack?.id || ""]);
        }

        const randomTrack = eligibleTracks[Math.floor(Math.random() * eligibleTracks.length)];
        const nextIdx = playQueue.findIndex(t => t.id === randomTrack.id);

        setShufflePlayedIds(prev => [...prev, randomTrack.id]);
        setQueueIndex(nextIdx !== -1 ? nextIdx : 0);
        
        setInitialStartTime(0);
        setCurrentTime(0);
        setSeekTo(0);
        localStorage.setItem("spotify_last_time", "0");
        setCurrentTrack(randomTrack);
        setIsPlaying(true);
        setPlayTrigger(Date.now());

      } else if (shuffleMode === 2) {
        // --- 2. Smart Shuffle (Lecture Aléatoire Intelligente / Mode IA) ---
        // Play EXCLUSIVELY from the generated recommendations list (mood matching but never the same as playlist)
        const eligibleRecommendations = recommendations.filter(rec => {
          const notDisliked = !smartShuffleDislikes.some(dis => 
            rec.artist.toLowerCase() === dis.toLowerCase() || 
            rec.title.toLowerCase() === dis.toLowerCase()
          );
          const notPlayedInSession = !shufflePlayedIds.includes(rec.id);
          // And must not be in our likedTracks/playQueue (already handled by API, but extra safety check)
          const notInPlaylist = !playQueue.some(t => !t.isRecommendation && (t.id === rec.id || t.title.toLowerCase() === rec.title.toLowerCase()));
          return notDisliked && notPlayedInSession && notInPlaylist;
        });

        if (eligibleRecommendations.length > 0) {
          const chosenRec = eligibleRecommendations[Math.floor(Math.random() * eligibleRecommendations.length)];
          const recommendationTrack = { ...chosenRec, isRecommendation: true };

          // Append to playQueue and set index to it, so user can see it in their queue
          const updatedQueue = [...playQueue];
          const insertIdx = queueIndex + 1;
          updatedQueue.splice(insertIdx, 0, recommendationTrack);
          
          setPlayQueue(updatedQueue);
          setQueueIndex(insertIdx);
          setShufflePlayedIds(prev => [...prev, recommendationTrack.id]);

          setInitialStartTime(0);
          setCurrentTime(0);
          setSeekTo(0);
          localStorage.setItem("spotify_last_time", "0");
          setCurrentTrack(recommendationTrack);
          setIsPlaying(true);
          setPlayTrigger(Date.now());
          console.log(`Mode IA: Played recommendation "${recommendationTrack.title}" by ${recommendationTrack.artist}.`);
        } else {
          // If we played all recommendations, fetch fresh recommendations and fallback temporarily to normal shuffle
          console.log("No more unplayed recommendations, fetching fresh ones.");
          calculateRecommendations();
          
          // Temporary fallback to standard shuffle
          let eligibleTracks = playQueue.filter(t => !shufflePlayedIds.includes(t.id));
          if (eligibleTracks.length === 0) {
            eligibleTracks = playQueue.filter(t => t.id !== currentTrack?.id);
            if (eligibleTracks.length === 0) eligibleTracks = playQueue;
            setShufflePlayedIds([currentTrack?.id || ""]);
          }

          const randomTrack = eligibleTracks[Math.floor(Math.random() * eligibleTracks.length)];
          const nextIdx = playQueue.findIndex(t => t.id === randomTrack.id);

          setShufflePlayedIds(prev => [...prev, randomTrack.id]);
          setQueueIndex(nextIdx !== -1 ? nextIdx : 0);
          
          setInitialStartTime(0);
          setCurrentTime(0);
          setSeekTo(0);
          localStorage.setItem("spotify_last_time", "0");
          setCurrentTrack(randomTrack);
          setIsPlaying(true);
          setPlayTrigger(Date.now());
        }

      } else {
        // --- 3. Sequential Playback ---
        if (queueIndex < playQueue.length - 1) {
          const nextIdx = queueIndex + 1;
          setQueueIndex(nextIdx);
          setInitialStartTime(0);
          setCurrentTime(0);
          setSeekTo(0);
          localStorage.setItem("spotify_last_time", "0");
          setCurrentTrack(playQueue[nextIdx]);
          setIsPlaying(true);
          setPlayTrigger(Date.now());
        }
      }
    }
  };

  const handleDislikeRecommendation = () => {
    if (!currentTrack) return;
    
    // Register negative feedback
    setSmartShuffleDislikes(prev => {
      if (!prev.includes(currentTrack.artist)) {
        return [...prev, currentTrack.artist];
      }
      return prev;
    });

    console.log(`Disliked & hid suggestion: "${currentTrack.title}" by ${currentTrack.artist}. Skipping...`);
    
    // Skip immediately
    handleNextTrack();
  };

  const handleShuffleToggle = () => {
    setShuffleMode(prev => {
      let nextMode = 0;
      if (prev === 0) {
        nextMode = 1; // standard shuffle
      } else if (prev === 1) {
        nextMode = 2; // smart shuffle (Mode IA available everywhere)
      } else {
        nextMode = 0; // off
      }

      // If we are leaving mode 2 (Smart Shuffle/AI), clean up the playQueue by removing any recommendations
      if (prev === 2 && nextMode !== 2) {
        setTimeout(() => {
          setPlayQueue(currentQueue => {
            const cleaned = currentQueue.filter(t => !t.isRecommendation);
            
            // Adjust queueIndex so it doesn't go out of bounds
            setQueueIndex(prevIdx => {
              const currentTrk = currentTrack;
              if (currentTrk) {
                const newIdx = cleaned.findIndex(t => t.id === currentTrk.id);
                return newIdx !== -1 ? newIdx : 0;
              }
              return prevIdx >= cleaned.length ? Math.max(0, cleaned.length - 1) : prevIdx;
            });
            return cleaned;
          });
        }, 10);
      }

      // If we are entering mode 2, proactively fetch recommendations based on the current playlist/active tracks!
      if (nextMode === 2) {
        setTimeout(() => {
          calculateRecommendations();
        }, 10);
      }

      return nextMode;
    });
  };

  const handlePrevTrack = () => {
    if (currentTime > 2) {
      setInitialStartTime(0);
      setCurrentTime(0);
      setSeekTo(0);
      localStorage.setItem("spotify_last_time", "0");
      setIsPlaying(true);
      setPlayTrigger(Date.now());
    } else if (playbackHistory.length > 0) {
      const historyCopy = [...playbackHistory];
      const prevTrack = historyCopy.pop()!;
      setPlaybackHistory(historyCopy);
      
      isBackNavigatingRef.current = true;
      
      // Sync queue index if this track is in the active queue
      const existingQueueIdx = playQueue.findIndex(t => t.id === prevTrack.id);
      if (existingQueueIdx !== -1) {
        setQueueIndex(existingQueueIdx);
      }
      
      setInitialStartTime(0);
      setCurrentTime(0);
      setSeekTo(0);
      localStorage.setItem("spotify_last_time", "0");
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
      setPlayTrigger(Date.now());
    } else if (playQueue.length > 0 && queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      
      isBackNavigatingRef.current = true;
      
      setInitialStartTime(0);
      setCurrentTime(0);
      setSeekTo(0);
      localStorage.setItem("spotify_last_time", "0");
      setCurrentTrack(playQueue[prevIdx]);
      setIsPlaying(true);
      setPlayTrigger(Date.now());
    } else {
      // Si on est au début de la file et au tout début du morceau, on recommence la chanson actuelle
      setInitialStartTime(0);
      setCurrentTime(0);
      setSeekTo(0);
      localStorage.setItem("spotify_last_time", "0");
      setIsPlaying(true);
      setPlayTrigger(Date.now());
    }
  };

  const handleSeek = (seconds: number) => {
    setSeekTo(seconds);
    setCurrentTime(seconds);
  };

  // Create stable references for event handlers to prevent continuous MediaSession teardown/re-registration
  const handleNextTrackRef = useRef(handleNextTrack);
  const handlePrevTrackRef = useRef(handlePrevTrack);
  const handlePlayPauseToggleRef = useRef(handlePlayPauseToggle);

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
    handlePrevTrackRef.current = handlePrevTrack;
    handlePlayPauseToggleRef.current = handlePlayPauseToggle;
  });

  // Media Session & Hardware Keys Integration (Keyboards, Stream Decks, Headsets)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentTrack) {
      try {
        const MediaMetadataClass = (window as any).MediaMetadata;
        if (MediaMetadataClass) {
          navigator.mediaSession.metadata = new MediaMetadataClass({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album || "Spotify Clone",
            artwork: [
              { src: currentTrack.thumbnail || "/icon.png", sizes: "96x96", type: "image/png" },
              { src: currentTrack.thumbnail || "/icon.png", sizes: "128x128", type: "image/png" },
              { src: currentTrack.thumbnail || "/icon.png", sizes: "192x192", type: "image/png" },
              { src: currentTrack.thumbnail || "/icon.png", sizes: "256x256", type: "image/png" },
              { src: currentTrack.thumbnail || "/icon.png", sizes: "384x384", type: "image/png" },
              { src: currentTrack.thumbnail || "/icon.png", sizes: "512x512", type: "image/png" },
            ],
          });
        }
      } catch (e) {
        console.warn("Could not set MediaSession metadata:", e);
      }
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        handlePlayPauseToggleRef.current();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        handlePlayPauseToggleRef.current();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleNextTrackRef.current();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlePrevTrackRef.current();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          setSeekTo(details.seekTime);
          setCurrentTime(details.seekTime);
        }
      });
    } catch (error) {
      console.warn("Error setting MediaSession action handlers:", error);
    }

    return () => {
      if (typeof window !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
          navigator.mediaSession.setActionHandler("previoustrack", null);
          navigator.mediaSession.setActionHandler("seekto", null);
        } catch (e) {}
      }
    };
  }, []);

  // Update lock screen timeline slider progress state in real time
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (currentTrack && duration > 0 && currentTime >= 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: Math.min(currentTime, duration),
        });
      } catch (e) {
        // Some older browsers might throw if duration/position are out of sync or negative
      }
    }
  }, [currentTime, duration, currentTrack]);

  // Silent audio loop to prevent browser throttling/sleep of background tabs on mobile devices when screen locks
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isPlaying && currentTrack) {
      if (!silentAudioRef.current) {
        // Simple 1-second silent WAV format looping audio
        silentAudioRef.current = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
        silentAudioRef.current.loop = true;
      }
      silentAudioRef.current.play().catch(err => {
        console.log("Background audio silent keeper active:", err);
      });
    } else {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing in input or text fields
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Check standard media keys and common keyboard shortcuts (including multiple variants)
      const isNextKey = 
        e.key === "MediaTrackNext" || 
        e.key === "MediaNextTrack" || 
        (e.shiftKey && e.key === "ArrowRight") ||
        (e.ctrlKey && e.key === "ArrowRight");

      const isPrevKey = 
        e.key === "MediaTrackPrevious" || 
        e.key === "MediaPrevTrack" || 
        e.key === "MediaPreviousTrack" || 
        (e.shiftKey && e.key === "ArrowLeft") ||
        (e.ctrlKey && e.key === "ArrowLeft");

      const isPlayPauseKey = 
        e.key === "MediaPlayPause" || 
        e.key === "MediaPlay" ||
        e.key === "MediaPause" ||
        e.key === " " || 
        e.code === "Space";

      if (isNextKey) {
        e.preventDefault();
        handleNextTrackRef.current();
      } else if (isPrevKey) {
        e.preventDefault();
        handlePrevTrackRef.current();
      } else if (isPlayPauseKey) {
        // Space bar or PlayPause media key plays/pauses if not in input fields
        e.preventDefault();
        handlePlayPauseToggleRef.current();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  // 7. Track Liked Status toggling on Firestore or LocalStorage
  const handleLikeToggle = async () => {
    if (!user || !currentTrack) return;
    
    if (user.isGuest) {
      setShowAuthModal(true);
      return;
    }

    const isAlreadyLiked = likedTracks.some(t => t.id === currentTrack.id);
    const docRef = doc(db, "users", user.uid, "likedTracks", currentTrack.id);
    try {
      if (isAlreadyLiked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          ...currentTrack,
          addedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Failed to toggle like:", err);
      setFirestoreError(`Erreur favoris: ${err.message}`);
    }
  };

  const handleLikeTrackToggle = async (track: Track) => {
    if (!user) return;
    
    if (user.isGuest) {
      setShowAuthModal(true);
      return;
    }

    const isAlreadyLiked = likedTracks.some(t => t.id === track.id);
    const docRef = doc(db, "users", user.uid, "likedTracks", track.id);
    try {
      if (isAlreadyLiked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          ...track,
          addedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Failed to toggle track like:", err);
      setFirestoreError(`Erreur favoris: ${err.message}`);
    }
  };

  // 8. Custom Playlists Management
  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    if (user.isGuest) {
      setShowAuthModal(true);
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "playlists"), {
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
        coverColor: newPlaylistColor,
        tracks: [],
        createdAt: new Date().toISOString()
      });
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create playlist:", err);
      setFirestoreError(`Erreur création playlist: ${err.message}`);
    }
  };

  const handleAddTrackToPlaylist = async (track: Track, playlistId: string) => {
    if (!user) return;

    if (user.isGuest) {
      setShowAuthModal(true);
      return;
    }

    const plRef = doc(db, "users", user.uid, "playlists", playlistId);
    try {
      const targetPl = customPlaylists.find(p => p.id === playlistId);
      if (!targetPl) return;

      const updatedTracks = [...(targetPl.tracks || [])];
      // Avoid duplicates
      if (!updatedTracks.some(t => t.id === track.id)) {
        updatedTracks.push({
          ...track,
          addedAt: new Date().toISOString()
        });
        await updateDoc(plRef, { tracks: updatedTracks });
      }
    } catch (err: any) {
      console.error("Failed to add track to playlist:", err);
      setFirestoreError(`Erreur ajout titre: ${err.message}`);
    }
  };

  const handleRemoveTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    if (!user) return;

    if (user.isGuest) {
      return;
    }

    const plRef = doc(db, "users", user.uid, "playlists", playlistId);
    try {
      const targetPl = customPlaylists.find(p => p.id === playlistId);
      if (!targetPl) return;

      const updatedTracks = (targetPl.tracks || []).filter(t => t.id !== trackId);
      await updateDoc(plRef, { tracks: updatedTracks });
      
      // Update local detailed playlist view if currently open
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist({ ...targetPl, tracks: updatedTracks });
      }
    } catch (err: any) {
      console.error("Failed to remove track:", err);
      setFirestoreError(`Erreur retrait titre: ${err.message}`);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!user) return;

    if (user.isGuest) {
      return;
    }

    const docRef = doc(db, "users", user.uid, "playlists", playlistId);
    try {
      await deleteDoc(docRef);
      setCurrentView("home");
      setSelectedPlaylist(null);
    } catch (err: any) {
      console.error("Failed to delete playlist:", err);
      setFirestoreError(`Erreur suppression playlist: ${err.message}`);
    }
  };

  const handleImportPlaylist = async (playlistToImport: Playlist) => {
    if (!user) return;

    if (user.isGuest) {
      setShowAuthModal(true);
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "playlists"), {
        name: playlistToImport.name,
        description: playlistToImport.description,
        coverColor: playlistToImport.coverColor || "#1DB954",
        tracks: playlistToImport.tracks || [],
        createdAt: new Date().toISOString()
      });
      setFirestoreError(`La playlist "${playlistToImport.name}" a été importée dans votre bibliothèque !`);
      setTimeout(() => setFirestoreError(null), 5000);
    } catch (err: any) {
      console.error("Failed to import playlist:", err);
      setFirestoreError(`Erreur d'importation de la playlist: ${err.message}`);
    }
  };

  const handleSharePlaylist = async (playlistToShare: Playlist): Promise<string> => {
    try {
      const sharedRef = doc(collection(db, "sharedPlaylists"));
      const sharedId = sharedRef.id;
      
      await setDoc(sharedRef, {
        name: playlistToShare.name || "Playlist partagée",
        description: playlistToShare.description || "",
        coverColor: playlistToShare.coverColor || "#1DB954",
        tracks: playlistToShare.tracks || [],
        createdAt: new Date().toISOString()
      });
      
      const shareUrl = `${window.location.origin}/?sharedPlaylistId=${sharedId}`;
      return shareUrl;
    } catch (err: any) {
      console.error("Error sharing playlist:", err);
      setFirestoreError(`Erreur de partage: ${err.message}`);
      setTimeout(() => setFirestoreError(null), 5000);
      throw err;
    }
  };

  const handleTasteSurveySubmit = async (profile: any) => {
    if (!user) return;
    setLoadingPersonalized(true);
    try {
      const res = await fetch("/api/generate-mixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: profile.genres,
          moods: profile.moods,
          tempo: profile.tempo,
          epochs: profile.epochs,
          history: recentTracks.map(t => ({ title: t.title, artist: t.artist }))
        })
      });
      const data = await res.json();
      if (data.playlists) {
        if (user.isGuest) {
          // In guest mode, do not persist taste profile or personalized playlists to localStorage (keep in-memory only)
          setTasteProfile(profile);
          setPersonalizedPlaylists(data.playlists);
        } else {
          // Save in Firestore
          await setDoc(doc(db, "users", user.uid), { tasteProfile: profile }, { merge: true });
          
          for (const pl of data.playlists) {
            await setDoc(doc(db, "users", user.uid, "personalizedPlaylists", pl.id), pl);
          }
          setTasteProfile(profile);
          setPersonalizedPlaylists(data.playlists);
        }
      }
      setShowTasteSurvey(false);
    } catch (err: any) {
      console.error("Failed to generate personalized mixes:", err);
      setFirestoreError(`Erreur lors de la génération de vos mixs: ${err.message}`);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const handleRegenerateMixes = async () => {
    if (!user || !tasteProfile) return;
    setLoadingPersonalized(true);
    try {
      const res = await fetch("/api/generate-mixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: tasteProfile.genres,
          moods: tasteProfile.moods,
          tempo: tasteProfile.tempo,
          epochs: tasteProfile.epochs,
          history: recentTracks.map(t => ({ title: t.title, artist: t.artist }))
        })
      });
      const data = await res.json();
      if (data.playlists) {
        if (user.isGuest) {
          // In guest mode, do not persist personalized playlists to localStorage (keep in-memory only)
          setPersonalizedPlaylists(data.playlists);
        } else {
          for (const pl of data.playlists) {
            await setDoc(doc(db, "users", user.uid, "personalizedPlaylists", pl.id), pl);
          }
          setPersonalizedPlaylists(data.playlists);
        }
        setFirestoreError("Vos 3 mixes personnalisés hebdomadaires ont été actualisés avec succès !");
        setTimeout(() => setFirestoreError(null), 4000);
      }
    } catch (err: any) {
      console.error("Failed to update personalized mixes:", err);
      setFirestoreError(`Erreur d'actualisation des mixs: ${err.message}`);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      uid: "guest_user",
      email: "invite@spotify.clone",
      displayName: "Invité Spécial",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      isGuest: true
    };
    localStorage.setItem("spotify_guest_user", JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const handleLogout = async () => {
    if (user?.isGuest) {
      localStorage.removeItem("spotify_guest_user");
      setUser(null);
    } else {
      await auth.signOut();
    }
    // Explicitly reset player state on active logout
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setInitialStartTime(0);
    setSeekTo(null);
    setPlaybackHistory([]);
    setPlaybackForwardHistory([]);
    localStorage.removeItem("spotify_last_track");
    localStorage.removeItem("spotify_last_queue");
    localStorage.removeItem("spotify_last_queue_index");
    localStorage.removeItem("spotify_last_time");
    localStorage.removeItem("spotify_last_duration");
    localStorage.removeItem("spotify_last_playing");
    localStorage.removeItem("spotify_last_volume");
    localStorage.removeItem("spotify_playback_history");
    localStorage.removeItem("spotify_playback_forward_history");
  };

  const handleSaveSpotifyCredentials = async (clientId: string, secret: string) => {
    setSpotifyClientId(clientId);
    setSpotifyClientSecret(secret);
    
    if (user && !user.isGuest) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          spotifyClientId: clientId,
          spotifyClientSecret: secret
        }, { merge: true });
      } catch (err: any) {
        console.error("Failed to save Spotify credentials to Firestore:", err);
        setFirestoreError(`Erreur d'enregistrement des identifiants Spotify: ${err.message}`);
      }
    } else {
      localStorage.setItem("spotify_client_id", clientId);
      localStorage.setItem("spotify_client_secret", secret);
    }
  };

  const handleImportSpotifyPlaylist = async (playlistUrl: string): Promise<Track[]> => {
    const cleanId = playlistUrl.trim();
    const match = cleanId.match(/(?:playlist\/|playlist:|^)([a-zA-Z0-9]{22})/);
    const playlistId = match ? match[1] : cleanId;

    if (!playlistId || playlistId.length !== 22) {
      throw new Error("Lien de playlist invalide. Veuillez copier un lien de playlist Spotify valide (ex: https://open.spotify.com/playlist/...)");
    }

    const response = await fetch("/api/spotify/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
        playlistId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur d'importation (${response.status})`);
    }

    const data = await response.json();
    return data.tracks || [];
  };

  const handleSaveImportedTracks = async (tracks: Track[]) => {
    if (!user) return;

    if (user.isGuest) {
      const updated = [...likedTracks];
      tracks.forEach(track => {
        if (!updated.some(t => t.id === track.id)) {
          updated.push(track);
        }
      });
      setLikedTracks(updated);
    } else {
      const tracksToSave = tracks.filter(track => !likedTracks.some(t => t.id === track.id));
      const promises = tracksToSave.map(async (track) => {
        const trackRef = doc(db, "users", user.uid, "likedTracks", track.id);
        await setDoc(trackRef, track);
      });
      await Promise.all(promises);
    }
  };

  if (loadingAuth || (user && !user.isGuest && checkingPassword)) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white font-sans select-none">
        <div className="w-16 h-16 animate-bounce mb-5 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(29,185,84,0.4)]">
          <img src="/icon.svg" className="w-full h-full object-contain animate-pulse" alt="Scrap Logo" referrerPolicy="no-referrer" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          {loadingAuth ? "Initialisation sécurisée Firebase..." : "Sécurisation de la session..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthView onGuestLogin={handleGuestLogin} />;
  }

  if (user && !isPasswordVerified) {
    const handleSaveNewPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");
      
      const trimmedPassword = passwordSetupInput;
      
      if (!trimmedPassword) {
        setPasswordError("Veuillez saisir un mot de passe.");
        return;
      }
      if (trimmedPassword.length < 6) {
        setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (trimmedPassword !== passwordConfirmInput) {
        setPasswordError("Les mots de passe ne correspondent pas.");
        return;
      }
      
      setPasswordLoading(true);
      try {
        // Link Email/Password credential so user can log in via E-mail + Password too!
        if (user.email) {
          try {
            const credential = EmailAuthProvider.credential(user.email, trimmedPassword);
            await linkWithCredential(user, credential);
            console.log("Successfully linked email/password provider during setup!");
          } catch (linkErr: any) {
            console.warn("Firebase linkWithCredential error during setup:", linkErr);
            if (linkErr.code === "auth/weak-password") {
              throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
            } else if (linkErr.code === "auth/operation-not-allowed") {
              throw new Error("La méthode de connexion par E-mail/Mot de passe n'est pas activée dans Firebase.");
            } else if (linkErr.code === "auth/credential-already-in-use" || linkErr.code === "auth/email-already-in-use") {
              // Account already linked or email already in use by another password credential.
              // We can proceed since it is already linked or existing.
              console.log("Credential already linked, continuing with Firestore save.");
            } else if (linkErr.code === "auth/requires-recent-login") {
              throw new Error("Sécurité : Veuillez vous déconnecter et vous reconnecter avec Google pour configurer votre mot de passe.");
            } else {
              throw new Error("Erreur de liaison Firebase : " + (linkErr.message || linkErr.code));
            }
          }
        }
        
        // Save to Firestore so admin can retrieve/verify if needed
        await setDoc(doc(db, "mot_de_passe", user.uid), {
          uid: user.uid,
          email: user.email,
          password: trimmedPassword,
          createdAt: new Date().toISOString()
        });
        
        setCorrectPassword(trimmedPassword);
        setHasPasswordInDb(true);
        setIsPasswordVerified(true);
        setPasswordError("");
      } catch (err: any) {
        console.error("Error in password setup:", err);
        setPasswordError(err.message || "Une erreur est survenue lors de l'enregistrement de votre mot de passe.");
        try {
          handleFirestoreError(err, OperationType.WRITE, "mot_de_passe/" + user.uid);
        } catch (formattedError) {
          console.error("Formatted Firestore Error:", formattedError);
        }
      } finally {
        setPasswordLoading(false);
      }
    };

    const handleVerifyPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");
      
      if (!passwordVerifyInput) {
        setPasswordError("Veuillez saisir votre mot de passe.");
        return;
      }
      
      if (passwordVerifyInput === correctPassword) {
        // Automatically link Email/Password provider if it's missing
        const hasEmailPasswordProvider = user.providerData?.some(
          (p: any) => p.providerId === "password"
        );
        if (!hasEmailPasswordProvider && user.email) {
          try {
            const credential = EmailAuthProvider.credential(user.email, passwordVerifyInput);
            await linkWithCredential(user, credential);
            console.log("Successfully linked email/password provider during verification!");
          } catch (linkErr: any) {
            console.warn("Could not link email/password credential during verification:", linkErr);
          }
        }
        setIsPasswordVerified(true);
        setPasswordError("");
      } else {
        setPasswordError("Mot de passe incorrect. Si vous l'avez perdu, veuillez contacter l'administrateur.");
      }
    };

    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#1DB954]/5 rounded-full filter blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[450px] bg-[#121212] rounded-2xl p-8 md:p-10 shadow-2xl border border-white/5 backdrop-blur-md relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4 filter drop-shadow-[0_4px_16px_rgba(29,185,84,0.3)] hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Scrap Logo" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Scrap<span className="text-[#1DB954] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 ml-2">SÉCURITÉ</span>
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">Connexion sécurisée pour : {user.email}</p>
          </div>

          {passwordError && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold leading-relaxed flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4.5 h-4.5 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{passwordError}</span>
            </div>
          )}

          {hasPasswordInDb === false ? (
            /* Creation / Setup of Password */
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold text-neutral-200">Création de votre mot de passe</h2>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Veuillez configurer un mot de passe sécurisé d'au moins 6 caractères. 
                  Il permettra de vous connecter directement avec l'adresse e-mail de votre compte Google.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Nouveau mot de passe (min. 6 car.)</label>
                <div className="relative">
                  <input
                    type={showPasswordChar ? "text" : "password"}
                    value={passwordSetupInput}
                    onChange={(e) => setPasswordSetupInput(e.target.value)}
                    placeholder="Saisissez un mot de passe (min. 6 car.)"
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all pr-11 text-white font-medium"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordChar(!showPasswordChar)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPasswordChar ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.96-3.96-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
                <input
                  type={showPasswordChar ? "text" : "password"}
                  value={passwordConfirmInput}
                  onChange={(e) => setPasswordConfirmInput(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all text-white font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#22e669] text-black font-extrabold text-sm rounded-full py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-[#1db954]/20 mt-4 cursor-pointer"
              >
                {passwordLoading ? "Enregistrement sécurisé..." : "Enregistrer et accéder à l'application"}
              </button>
            </form>
          ) : (
            /* Verification of Password */
            <form onSubmit={handleVerifyPassword} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold text-neutral-200">Saisissez votre mot de passe</h2>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Votre compte est protégé par un mot de passe d'assistance. Veuillez le renseigner pour déverrouiller votre session Scrap.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Mot de passe d'accès</label>
                <div className="relative">
                  <input
                    type={showPasswordChar ? "text" : "password"}
                    value={passwordVerifyInput}
                    onChange={(e) => setPasswordVerifyInput(e.target.value)}
                    placeholder="Saisissez votre mot de passe d'accès"
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-3.5 px-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all pr-11 text-white font-medium"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordChar(!showPasswordChar)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPasswordChar ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.96-3.96-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#22e669] text-black font-extrabold text-sm rounded-full py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#1db954]/20 mt-3 cursor-pointer"
              >
                Déverrouiller et accéder
              </button>
              
              <div className="text-center mt-4">
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Perdu ou oublié ? Demandez de l'aide à un administrateur en lui transmettant votre adresse e-mail. Il pourra vérifier votre mot de passe depuis la console.
                </p>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
            <button
              onClick={handleLogout}
              className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 py-2 px-4 rounded bg-white/5 hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Se connecter avec un autre compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent text-white font-sans flex flex-col overflow-hidden select-none relative">
      {/* Dynamic Background Theme Renderer */}
      {(() => {
        if (!customBackgroundUrl || customBackgroundUrl === "trou_noir") {
          return <BlackHoleBackground />;
        } else if (customBackgroundUrl === "stable_singularity") {
          return <StableSingularityBackground />;
        } else if (customBackgroundUrl === "tectonic_lava") {
          return <TectonicLavaBackground />;
        } else if (customBackgroundUrl === "quantum_core") {
          return <QuantumCoreBackground />;
        } else {
          return (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out z-0 animate-fadeIn"
              style={{ backgroundImage: `url(${customBackgroundUrl})` }}
            >
              {/* Subtle dark overlay for readability and gorgeous premium atmosphere */}
              <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
            </div>
          );
        }
      })()}
      
      {/* Upper workspace layout container */}
      <div className="flex flex-1 overflow-hidden p-0 md:p-2 gap-2 z-10 relative">
        
        {/* Sidebar Nav section (Desktop only) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar 
            currentView={currentView}
            setCurrentView={setCurrentView}
            customPlaylists={customPlaylists}
            likedTracks={likedTracks}
            onCreatePlaylist={() => setIsModalOpen(true)}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectLikedSongs={handleSelectLikedSongs}
            user={user}
            onLogout={handleLogout}
            followedArtists={followedArtists}
            onSelectArtist={handleSelectArtist}
            artistAvatars={artistAvatars}
          />
        </div>

        {/* Main interactive window area */}
        <main className="flex-1 bg-[#0a0a14]/40 backdrop-blur-md rounded-none md:rounded-lg relative overflow-hidden flex flex-col border-0 md:border md:border-white/5 shadow-2xl w-full">
          
          {firestoreError && (
            <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 px-4 py-2 text-xs flex justify-between items-center z-30">
              <span className="font-semibold">⚠️ {firestoreError}</span>
              <button 
                onClick={() => setFirestoreError(null)} 
                className="hover:text-white font-bold px-2 uppercase text-[10px]"
              >
                Fermer
              </button>
            </div>
          )}
          
          {/* Main Top Header Controls */}
          <header className="flex items-center justify-between p-2.5 sm:p-4 sticky top-0 z-20 bg-[#0a0a14]/80 backdrop-blur-md border-b border-white/5 shrink-0 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setCurrentView("home")}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
                title="Retour à l'accueil"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setCurrentView("home")}
                className="md:hidden flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
                title="Accueil Scrap"
              >
                <img src="/icon.svg" className="w-6 h-6 object-contain" alt="Scrap Logo" referrerPolicy="no-referrer" />
                <span className="text-[9px] font-bold text-white tracking-widest lowercase leading-tight -mt-0.5">scrap</span>
              </div>
            </div>

            {/* Middle Section: Home button + Pill Search bar */}
            <div className="flex items-center gap-2 max-w-xl w-full justify-center">
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setCurrentView("home");
                }}
                className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center transition-all shrink-0 ${
                  currentView === "home" ? "bg-white text-black scale-105" : "bg-[#242424] text-[#b3b3b3] hover:text-white"
                }`}
                title="Accueil"
              >
                <Home className="w-5 h-5" />
              </button>

              <div 
                ref={searchContainerRef}
                className="relative flex-1 max-w-md bg-[#242424] hover:bg-[#2e2e2e] focus-within:bg-[#242424] focus-within:ring-1 focus-within:ring-white/30 rounded-full flex items-center px-3 py-1.5 sm:px-4 sm:py-2 gap-2 transition-all shadow-md pr-12 sm:pr-20"
              >
                <Search className="w-5 h-5 text-neutral-400 shrink-0" />
                <input
                  id="header_search_input"
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim() && currentView !== "search") {
                      setCurrentView("search");
                    }
                    executeSearch(val);
                  }}
                  onFocus={() => {
                    setIsSearchHistoryOpen(true);
                    setShowSearchInfo(false);
                  }}
                  onClick={() => {
                    setIsSearchHistoryOpen(true);
                    setShowSearchInfo(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      if (currentView !== "search") {
                        setCurrentView("search");
                      }
                      addToSearchHistory({
                        id: `query_${searchQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                        name: searchQuery.trim(),
                        type: "Recherche",
                        subtitle: "Recherche texte",
                        image: ""
                      });
                      setIsSearchHistoryOpen(false);
                    }
                  }}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-400 outline-none"
                />

                <div className="absolute right-3 flex items-center gap-1 shrink-0">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="p-1 hover:bg-[#323232] rounded-full text-[#b3b3b3] hover:text-white transition-colors shrink-0"
                      title="Effacer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSearchInfo(!showSearchInfo);
                      setIsSearchHistoryOpen(false);
                    }}
                    title="Aide à la recherche"
                    className={`p-1 hover:bg-[#323232] rounded-full transition-colors shrink-0 ${
                      showSearchInfo ? "text-[#1DB954] bg-[#323232]" : "text-[#b3b3b3] hover:text-white"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-[1px] bg-neutral-600/80 mx-0.5"></div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      setSearchResults([]);
                      if (currentView !== "search") {
                        setCurrentView("search");
                      }
                    }}
                    title="Parcourir toutes les catégories"
                    className="p-1 hover:bg-[#323232] rounded-full text-[#b3b3b3] hover:text-[#1DB954] transition-colors shrink-0"
                  >
                    <Library className="w-4 h-4" />
                  </button>
                </div>

                {/* SEARCH HELP / INFO POPOVER */}
                {showSearchInfo && (
                  <div 
                    id="search_info_popover"
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#12121e] border border-[#1DB954]/30 rounded-2xl shadow-2xl p-4 text-left animate-in fade-in duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-[#1DB954] uppercase tracking-wider mb-1">Aide à la recherche</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Si vous ne trouvez pas un artiste ou un titre, vous devez saisir le nom de l'artiste ou le titre suivi de la <strong>langue</strong> de l'artiste ou du titre.
                        </p>
                        <div className="mt-2.5 bg-white/5 border border-white/10 rounded-xl p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] text-neutral-400 block uppercase font-mono tracking-wider">Exemple :</span>
                            <span className="text-xs font-medium text-white truncate block">"Elton John Anglais"</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery("Elton John Anglais");
                              if (currentView !== "search") {
                                setCurrentView("search");
                              }
                              executeSearch("Elton John Anglais");
                              setShowSearchInfo(false);
                            }}
                            className="text-[10px] bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold px-2.5 py-1 rounded-full transition-all shrink-0 active:scale-95"
                          >
                            Essayer
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3.5 pt-2.5 border-t border-white/5 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSearchInfo(false);
                        }}
                        className="text-[10px] text-neutral-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}

                {/* SEARCH HISTORY DROPDOWN PANEL */}
                {isSearchHistoryOpen && (
                  <div 
                    id="search_history_dropdown"
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#1a1a1a] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[380px] flex flex-col text-left"
                  >
                    <div className="px-4 py-3 border-b border-neutral-800/80 flex justify-between items-center bg-[#1c1c1c]">
                      <span className="text-xs font-black text-[#ffffff] uppercase tracking-wider">Recherches récentes</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearHistory();
                        }}
                        className="text-[10px] text-neutral-400 hover:text-[#1DB954] transition-colors font-bold uppercase tracking-wider"
                      >
                        Effacer tout
                      </button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 py-1 divide-y divide-neutral-900/40">
                      {searchHistory.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-500 italic">
                          Aucun historique récent
                        </div>
                      ) : (
                        searchHistory.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHistoryItemClick(item);
                            }}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                              {item.type === "Artiste" && !(artistAvatars[item.name] || getDeterministicArtistAvatar(item.name)) ? (
                                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/60 shrink-0 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase select-none">
                                  {item.name.charAt(0)}
                                </div>
                              ) : (
                                <img 
                                  src={item.type === "Artiste" ? (artistAvatars[item.name] || getDeterministicArtistAvatar(item.name)) : (item.image || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60")} 
                                  alt={item.name} 
                                  className={`w-9 h-9 object-cover shrink-0 shadow-md ${
                                    item.type === "Artiste" ? "rounded-full" : "rounded"
                                  }`}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = item.type === "Artiste"
                                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                                      : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=60";
                                  }}
                                />
                              )}
                              <div className="overflow-hidden min-w-0">
                                <p className="font-bold text-xs text-white truncate flex items-center gap-1">
                                  <span className="truncate">{item.name}</span>
                                  {item.type === "Artiste" && (
                                    <CheckCircle className="w-3 h-3 text-[#1DB954] fill-black shrink-0 inline-block" />
                                  )}
                                </p>
                                <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{item.subtitle || item.type}</p>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromHistory(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-opacity duration-200 shrink-0"
                              title="Supprimer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile launcher */}
            <div className="flex items-center gap-3 shrink-0">
              <div 
                onClick={() => {
                  if (user?.isGuest) {
                    setShowAuthModal(true);
                  } else {
                    setCurrentView("settings");
                  }
                }}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-full p-1 md:pr-3 cursor-pointer transition-colors border border-transparent hover:border-neutral-800"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-neutral-800">
                  {user.photoURL ? (
                    <img 
                      referrerPolicy="no-referrer" 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1DB954] text-black flex items-center justify-center text-xs font-bold">
                      {user.displayName?.substring(0, 1).toUpperCase() || "S"}
                    </div>
                  )}
                </div>
                <span className="hidden md:inline text-xs font-bold text-white truncate max-w-[100px]">
                  {user.displayName || "Profil"}
                </span>
              </div>
            </div>
          </header>

          {/* Dynamic Content Views Render */}
          <div className="flex-1 overflow-hidden">
            {currentView === "home" && (
              <HomeView 
                onPlayTrack={handlePlayTrack}
                onSelectArtist={handleSelectArtist}
                recentTracks={recentTracks}
                recommendations={recommendations}
                homeFeedData={homeFeedData}
                loadingFeed={loadingFeed}
                loadingRecommendations={loadingRecommendations}
                onRefreshRecommendations={calculateRecommendations}
                onSelectPlaylist={handleSelectPlaylist}
                followedArtists={followedArtists}
                artistAvatars={artistAvatars}
                tasteProfile={tasteProfile}
                personalizedPlaylists={personalizedPlaylists}
                onOpenTasteSurvey={() => setShowTasteSurvey(true)}
                onRegenerateMixes={handleRegenerateMixes}
                loadingPersonalized={loadingPersonalized}
                recommendationTimestamp={recommendationTimestamp}
                user={user}
                onSelectView={setCurrentView}
              />
            )}

            {currentView === "search" && (
              <SearchView 
                onPlayTrack={handlePlayTrack}
                onSelectArtist={handleSelectArtist}
                onSelectPlaylist={handleSelectPlaylist}
                customPlaylists={customPlaylists}
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
                query={searchQuery}
                setQuery={setSearchQuery}
                results={searchResults}
                setResults={setSearchResults}
                loading={searchLoading}
                setLoading={setSearchLoading}
                executeSearch={executeSearch}
                likedTracks={likedTracks}
                onToggleLike={handleLikeTrackToggle}
                followedArtists={followedArtists}
                onToggleFollowArtist={handleToggleFollowArtist}
                artistAvatars={artistAvatars}
              />
            )}

            {currentView === "library" && (
              <LibraryView 
                customPlaylists={customPlaylists}
                likedTracks={likedTracks}
                onCreatePlaylist={() => setIsModalOpen(true)}
                onSelectPlaylist={handleSelectPlaylist}
                onSelectLikedSongs={handleSelectLikedSongs}
                user={user}
                followedArtists={followedArtists}
                onSelectArtist={handleSelectArtist}
                artistAvatars={artistAvatars}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}

            {currentView === "settings" && (
              <SettingsView 
                user={user}
                onUpdateProfile={(dispName, photo) => {
                  if (user.isGuest) {
                    const updated = { ...user, displayName: dispName, photoURL: photo };
                    setUser(updated);
                  }
                }}
                followedArtists={followedArtists}
                artistAvatars={artistAvatars}
                onSelectArtist={handleSelectArtist}
                onToggleFollowArtist={handleToggleFollowArtist}
                onLogout={handleLogout}
                customBackgroundUrl={customBackgroundUrl}
                onUpdateBackground={async (url) => {
                  setCustomBackgroundUrl(url);
                  if (user && !user.isGuest) {
                    localStorage.setItem("scrap_custom_background_url", url);
                    try {
                      const docRef = doc(db, "users", user.uid);
                      await updateDoc(docRef, { customBackgroundUrl: url });
                    } catch (err) {
                      console.error("Error saving custom background URL to Firestore:", err);
                    }
                  }
                }}
                tasteScores={tasteScores}
              />
            )}

            {currentView === "liked-songs" && (
              <PlaylistView 
                playlist={null}
                likedTracks={likedTracks}
                onPlayTrack={handlePlayTrack}
                onRemoveLikedSong={async (trackId) => {
                  if (user.isGuest) {
                    const updated = likedTracks.filter(t => t.id !== trackId);
                    setLikedTracks(updated);
                  } else {
                    await deleteDoc(doc(db, "users", user.uid, "likedTracks", trackId));
                  }
                }}
                onSelectArtist={handleSelectArtist}
                onOpenSpotifyImport={() => setShowSpotifyImportModal(true)}
                shuffleMode={shuffleMode}
                onShuffleToggle={handleShuffleToggle}
                onSharePlaylist={handleSharePlaylist}
              />
            )}

            {currentView.startsWith("playlist-") && selectedPlaylist && (
              <PlaylistView 
                playlist={customPlaylists.find(p => p.id === selectedPlaylist.id) || selectedPlaylist}
                likedTracks={likedTracks}
                onPlayTrack={handlePlayTrack}
                onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onSelectArtist={handleSelectArtist}
                onImportPlaylist={handleImportPlaylist}
                isCurated={!customPlaylists.some(p => p.id === selectedPlaylist.id)}
                shuffleMode={shuffleMode}
                onShuffleToggle={handleShuffleToggle}
                onSharePlaylist={handleSharePlaylist}
              />
            )}

            {currentView.startsWith("artist-") && (
              <ArtistView 
                artistName={selectedArtistName}
                onPlayTrack={handlePlayTrack}
                onSelectArtist={handleSelectArtist}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPauseToggle={handlePlayPauseToggle}
                followedArtists={followedArtists}
                onToggleFollowArtist={handleToggleFollowArtist}
              />
            )}
          </div>

        </main>
      </div>

      {/* Embedded headless YouTube streaming bridge */}
      <YoutubePlayerBridge 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        seekTo={seekTo}
        onSeekComplete={() => setSeekTo(null)}
        onTimeUpdate={(curr, dur) => {
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
        }}
        onTrackReady={(durSec) => {
          setDuration(durSec);
        }}
        onTrackEnd={handleNextTrack}
        initialStartTime={initialStartTime}
        playTrigger={playTrigger}
      />

      {/* Bottom Sticky Spotify Media Player Controller */}
      <Player 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPauseToggle={handlePlayPauseToggle}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        setVolume={setVolume}
        isLiked={currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false}
        onLikeToggle={handleLikeToggle}
        onSelectArtist={handleSelectArtist}
        shuffleMode={shuffleMode}
        onShuffleToggle={handleShuffleToggle}
        isLikedSongsContext={currentView === "liked-songs" || activePlaybackContext === "liked"}
        isRecommendation={currentTrack?.isRecommendation || false}
        onDislikeRecommendation={handleDislikeRecommendation}
      />

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileNav 
        currentView={currentView}
        setCurrentView={setCurrentView}
        hasCurrentTrack={!!currentTrack}
        onCreatePlaylist={() => setIsModalOpen(true)}
      />

      {/* Create Custom Playlist Interactive Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-[#2c2c2c] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-[#1DB954]" /> Créer une playlist
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Nom de la playlist</label>
                <input
                  id="modal_pl_name"
                  type="text"
                  placeholder="Ma playlist n°3"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-transparent focus:border-white/30 rounded px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description (Optionnelle)</label>
                <textarea
                  id="modal_pl_desc"
                  placeholder="Une playlist regroupant mes meilleures découvertes..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-transparent focus:border-white/30 rounded px-3 py-2 text-sm h-20 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Couleur de fond de la couverture</label>
                <div className="flex gap-3">
                  {["#2e7d32", "#c62828", "#1565c0", "#ad1457", "#ef6c00", "#4527a0", "#37474f"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewPlaylistColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        newPlaylistColor === color ? "border-white scale-105" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#2a2a2a]">
              <button
                id="modal_cancel"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Annuler
              </button>
              <button
                id="modal_confirm"
                onClick={handleCreatePlaylist}
                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs px-5 py-2.5 rounded-full transition-transform hover:scale-105"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal for Guest Users */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] border border-neutral-800 rounded-xl max-w-md w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
            
            <div className="text-center flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] mb-2 shadow-lg shadow-[#1db954]/5">
                <Music className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-white tracking-tight">Connectez-vous avec Google</h3>
              <p className="text-xs text-[#a7a7a7] leading-relaxed max-w-xs">
                Cette fonctionnalité nécessite un compte. Créez des playlists, enregistrez vos favoris et personnalisez votre profil en un instant !
              </p>
              
              <div className="w-full mt-4 flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setShowAuthModal(false);
                    handleLogout();
                  }}
                  className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 rounded-full text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  S'inscrire avec Google
                </button>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full bg-transparent hover:bg-[#282828] text-white border border-neutral-700 hover:border-neutral-500 font-bold py-3 rounded-full text-xs uppercase tracking-wider transition-all"
                >
                  Continuer à écouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taste Survey Questionnaire Overlay */}
      <TasteSurveyModal 
        isOpen={showTasteSurvey}
        onClose={() => setShowTasteSurvey(false)}
        onSubmit={handleTasteSurveySubmit}
        isGuest={user?.isGuest}
      />

      {/* Spotify Playlist Import Overlay */}
      <SpotifyImportModal
        isOpen={showSpotifyImportModal}
        onClose={() => setShowSpotifyImportModal(false)}
        spotifyClientId={spotifyClientId}
        spotifyClientSecret={spotifyClientSecret}
        onSaveCredentials={handleSaveSpotifyCredentials}
        onImportPlaylist={handleImportSpotifyPlaylist}
        onAddTracksToLiked={handleSaveImportedTracks}
      />

    </div>
  );
}
