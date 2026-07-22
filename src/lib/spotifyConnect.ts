// Spotify Connect Helpers & Device Utils

export type DeviceType = "mobile" | "desktop" | "tv" | "speaker" | "browser";

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  lastActive: number;
  isThisDevice: boolean;
  volume: number;
}

export interface RemoteCommand {
  id: string;
  type: "play" | "pause" | "next" | "previous" | "seek" | "playTrack" | "setVolume" | "transfer";
  targetDeviceId: string;
  senderDeviceId: string;
  senderDeviceName: string;
  payload?: any;
  timestamp: number;
}

export interface SpotifyConnectPlayback {
  activeDeviceId: string;
  activeDeviceName: string;
  activeDeviceType: DeviceType;
  currentTrack: any | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  volume: number;
  updatedAt: number;
  lastCommand?: RemoteCommand;
}

// Get or generate persistent unique Device ID
export function getDeviceId(): string {
  let deviceId = localStorage.getItem("spotify_connect_device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    localStorage.setItem("spotify_connect_device_id", deviceId);
  }
  return deviceId;
}

// Detect device type and name
export function getDeviceInfo(): { name: string; type: DeviceType } {
  const savedName = localStorage.getItem("spotify_connect_device_name");
  const ua = navigator.userAgent || "";
  
  let type: DeviceType = "desktop";
  let defaultName = "Navigateur Web";

  if (/TV|SmartTV|GoogleTV|AppleTV|HbbTV|NetCast|WebOS/i.test(ua)) {
    type = "tv";
    defaultName = "Smart TV";
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    type = "mobile";
    defaultName = "Tablette";
  } else if (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    type = "mobile";
    if (/iPhone/i.test(ua)) defaultName = "iPhone";
    else if (/Android/i.test(ua)) defaultName = "Téléphone Android";
    else defaultName = "Smartphone";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    type = "desktop";
    defaultName = "MacBook / Mac";
  } else if (/Windows/i.test(ua)) {
    type = "desktop";
    defaultName = "PC Windows";
  } else if (/Linux/i.test(ua)) {
    type = "desktop";
    defaultName = "PC Linux";
  }

  return {
    name: savedName || defaultName,
    type
  };
}

export function setCustomDeviceName(name: string): void {
  localStorage.setItem("spotify_connect_device_name", name.trim());
}
