import { useEffect, useState, useRef, useCallback } from "react";
import { doc, collection, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  getDeviceId, 
  getDeviceInfo, 
  setCustomDeviceName, 
  DeviceInfo, 
  SpotifyConnectPlayback, 
  RemoteCommand, 
  DeviceType 
} from "../lib/spotifyConnect";
import { Track } from "../types";

interface UseSpotifyConnectProps {
  user: any;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 100
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  onSeek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  playTrack: (track: Track) => void;
}

export function useSpotifyConnect({
  user,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  setCurrentTrack,
  setIsPlaying,
  onSeek,
  setVolume,
  onNextTrack,
  onPrevTrack,
  playTrack
}: UseSpotifyConnectProps) {
  const thisDeviceId = useRef<string>(getDeviceId()).current;
  const [deviceName, setDeviceNameState] = useState<string>(() => getDeviceInfo().name);
  const [deviceType] = useState<DeviceType>(() => getDeviceInfo().type);
  
  const [onlineDevices, setOnlineDevices] = useState<DeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(thisDeviceId);
  const [remotePlayback, setRemotePlayback] = useState<SpotifyConnectPlayback | null>(null);

  const lastProcessedCommandId = useRef<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to check if current device is active
  const isThisDeviceActive = activeDeviceId === thisDeviceId;
  const isRemoteControlMode = !!activeDeviceId && activeDeviceId !== thisDeviceId;

  // Derive active device name and type
  const activeDeviceObj = onlineDevices.find(d => d.id === activeDeviceId);
  const activeDeviceName = activeDeviceObj ? activeDeviceObj.name : (remotePlayback?.activeDeviceName || "Appareil distant");
  const activeDeviceType = activeDeviceObj ? activeDeviceObj.type : (remotePlayback?.activeDeviceType || "desktop");

  // User ID or Guest ID for Firestore path
  const userId = user ? (user.uid || "guest_session") : "guest_session";

  // 1. Initialize BroadcastChannel for instant same-browser tab sync
  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`spotify_connect_${userId}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === "SYNC_DEVICES") {
          setOnlineDevices(prev => {
            const exists = prev.some(d => d.id === data.device.id);
            if (exists) {
              return prev.map(d => d.id === data.device.id ? { ...d, lastActive: Date.now() } : d);
            }
            return [...prev, data.device];
          });
        } else if (data.type === "PLAYBACK_UPDATE") {
          setRemotePlayback(data.playback);
          if (data.playback.activeDeviceId) {
            setActiveDeviceId(data.playback.activeDeviceId);
          }
        } else if (data.type === "COMMAND" && data.command.targetDeviceId === thisDeviceId) {
          executeCommandLocally(data.command);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [userId, thisDeviceId]);

  // 2. Register & Heartbeat device in Firestore
  useEffect(() => {
    const registerHeartbeat = async () => {
      const thisDev: DeviceInfo = {
        id: thisDeviceId,
        name: deviceName,
        type: deviceType,
        lastActive: Date.now(),
        isThisDevice: true,
        volume
      };

      // Broadcast locally
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: "SYNC_DEVICES", device: thisDev });
      }

      // Sync to Firestore for non-guest authenticated users (or standard session)
      if (user && !user.isGuest) {
        try {
          const devDocRef = doc(db, "users", userId, "devices", thisDeviceId);
          await setDoc(devDocRef, thisDev, { merge: true });
        } catch (e) {
          // Silent catch for guest or offline mode
        }
      }
    };

    registerHeartbeat();
    const interval = setInterval(registerHeartbeat, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, thisDeviceId, deviceName, deviceType, volume, user]);

  // 3. Listen to all online devices in Firestore
  useEffect(() => {
    if (!user || user.isGuest) {
      // For guests, maintain at least this device in list
      setOnlineDevices([
        {
          id: thisDeviceId,
          name: deviceName,
          type: deviceType,
          lastActive: Date.now(),
          isThisDevice: true,
          volume
        }
      ]);
      return;
    }

    const devicesColRef = collection(db, "users", userId, "devices");
    const unsub = onSnapshot(devicesColRef, (snap) => {
      const now = Date.now();
      const list: DeviceInfo[] = [];

      snap.forEach(d => {
        const data = d.data() as DeviceInfo;
        // Keep active devices within last 30 seconds
        if (now - data.lastActive < 30000) {
          list.push({
            ...data,
            isThisDevice: data.id === thisDeviceId
          });
        }
      });

      // Ensure this device is present
      if (!list.some(d => d.id === thisDeviceId)) {
        list.push({
          id: thisDeviceId,
          name: deviceName,
          type: deviceType,
          lastActive: now,
          isThisDevice: true,
          volume
        });
      }

      setOnlineDevices(list);
    }, (err) => {
      // Fallback
    });

    return () => unsub();
  }, [userId, thisDeviceId, deviceName, deviceType, volume, user]);

  // 4. Listen to Playback State & Commands from Firestore
  useEffect(() => {
    if (!user || user.isGuest) return;

    const playbackDocRef = doc(db, "users", userId, "playback", "current");
    const unsub = onSnapshot(playbackDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SpotifyConnectPlayback;
        setRemotePlayback(data);

        if (data.activeDeviceId && data.activeDeviceId !== activeDeviceId) {
          setActiveDeviceId(data.activeDeviceId);
        }

        // Process remote commands directed to THIS device
        if (data.lastCommand && data.lastCommand.targetDeviceId === thisDeviceId) {
          if (data.lastCommand.id !== lastProcessedCommandId.current) {
            lastProcessedCommandId.current = data.lastCommand.id;
            executeCommandLocally(data.lastCommand);
          }
        }
      }
    }, (err) => {
      // Fallback
    });

    return () => unsub();
  }, [userId, thisDeviceId, activeDeviceId, user]);

  // 5. Sync active playback state to Firestore when THIS device is active
  useEffect(() => {
    if (!isThisDeviceActive) return;

    const syncState = async () => {
      const playbackData: SpotifyConnectPlayback = {
        activeDeviceId: thisDeviceId,
        activeDeviceName: deviceName,
        activeDeviceType: deviceType,
        currentTrack,
        isPlaying,
        progressMs: Math.floor(currentTime * 1000),
        durationMs: Math.floor(duration * 1000),
        volume,
        updatedAt: Date.now()
      };

      // Broadcast locally
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: "PLAYBACK_UPDATE", playback: playbackData });
      }

      // Sync to Firestore
      if (user && !user.isGuest) {
        try {
          const playbackDocRef = doc(db, "users", userId, "playback", "current");
          await setDoc(playbackDocRef, playbackData, { merge: true });
        } catch (e) {
          // Ignore
        }
      }
    };

    // Throttle sync
    const timer = setTimeout(syncState, 500);
    return () => clearTimeout(timer);
  }, [isThisDeviceActive, thisDeviceId, deviceName, deviceType, currentTrack, isPlaying, Math.floor(currentTime), Math.floor(duration), volume, userId, user]);

  // Execute incoming remote command on THIS device
  const executeCommandLocally = useCallback((cmd: RemoteCommand) => {
    console.log("[Spotify Connect] Executing command on target device:", cmd);
    switch (cmd.type) {
      case "play":
        setIsPlaying(true);
        break;
      case "pause":
        setIsPlaying(false);
        break;
      case "next":
        onNextTrack();
        break;
      case "previous":
        onPrevTrack();
        break;
      case "seek":
        if (cmd.payload && typeof cmd.payload.positionSec === "number") {
          onSeek(cmd.payload.positionSec);
        }
        break;
      case "playTrack":
        if (cmd.payload && cmd.payload.track) {
          playTrack(cmd.payload.track);
        }
        break;
      case "setVolume":
        if (cmd.payload && typeof cmd.payload.volume === "number") {
          setVolume(cmd.payload.volume);
        }
        break;
      case "transfer":
        // Another device took active audio output, pause local audio
        setIsPlaying(false);
        break;
    }
  }, [setIsPlaying, onNextTrack, onPrevTrack, onSeek, playTrack, setVolume]);

  // Send remote command to active device
  const sendRemoteCommand = useCallback(async (
    type: RemoteCommand["type"],
    payload?: any
  ) => {
    const command: RemoteCommand = {
      id: "cmd_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
      type,
      targetDeviceId: activeDeviceId,
      senderDeviceId: thisDeviceId,
      senderDeviceName: deviceName,
      payload,
      timestamp: Date.now()
    };

    // Broadcast locally
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: "COMMAND", command });
    }

    // Sync to Firestore
    if (user && !user.isGuest) {
      try {
        const playbackDocRef = doc(db, "users", userId, "playback", "current");
        await setDoc(playbackDocRef, {
          lastCommand: command,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error("Error sending remote command:", e);
      }
    }
  }, [activeDeviceId, thisDeviceId, deviceName, userId, user]);

  // Transfer playback to THIS device ("Écouter sur cet appareil")
  const transferPlaybackToThisDevice = useCallback(async () => {
    const previousActiveDeviceId = activeDeviceId;
    
    // 1. Tell old active device to pause
    if (previousActiveDeviceId && previousActiveDeviceId !== thisDeviceId) {
      const stopCmd: RemoteCommand = {
        id: "cmd_transfer_" + Date.now(),
        type: "transfer",
        targetDeviceId: previousActiveDeviceId,
        senderDeviceId: thisDeviceId,
        senderDeviceName: deviceName,
        timestamp: Date.now()
      };

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: "COMMAND", command: stopCmd });
      }
    }

    // 2. Set this device as active
    setActiveDeviceId(thisDeviceId);

    // 3. Resume audio locally from remote playback state if available
    if (remotePlayback) {
      if (remotePlayback.currentTrack) {
        setCurrentTrack(remotePlayback.currentTrack);
      }
      
      let seekSec = 0;
      if (remotePlayback.progressMs) {
        const elapsedSec = (Date.now() - remotePlayback.updatedAt) / 1000;
        seekSec = Math.max(0, (remotePlayback.progressMs / 1000) + (remotePlayback.isPlaying ? elapsedSec : 0));
      }
      
      onSeek(seekSec);
      setIsPlaying(remotePlayback.isPlaying);
    }

    // 4. Update Firestore
    if (user && !user.isGuest) {
      try {
        const playbackDocRef = doc(db, "users", userId, "playback", "current");
        await setDoc(playbackDocRef, {
          activeDeviceId: thisDeviceId,
          activeDeviceName: deviceName,
          activeDeviceType: deviceType,
          isPlaying: remotePlayback ? remotePlayback.isPlaying : isPlaying,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error("Error transferring playback:", e);
      }
    }
  }, [activeDeviceId, thisDeviceId, deviceName, deviceType, remotePlayback, setCurrentTrack, onSeek, setIsPlaying, userId, user]);

  // Update custom device name
  const updateDeviceName = useCallback((newName: string) => {
    setCustomDeviceName(newName);
    setDeviceNameState(newName);
  }, []);

  return {
    thisDeviceId,
    deviceName,
    deviceType,
    updateDeviceName,
    onlineDevices,
    activeDeviceId,
    activeDeviceName,
    activeDeviceType,
    isThisDeviceActive,
    isRemoteControlMode,
    remotePlayback,
    sendRemoteCommand,
    transferPlaybackToThisDevice,
    setActiveDeviceId
  };
}
