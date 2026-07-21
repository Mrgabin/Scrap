import React from "react";
import { Home, Search, Library, Settings, Heart, Music } from "lucide-react";

interface MobileNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  hasCurrentTrack: boolean;
  onOpenPlayerModal?: () => void;
}

export default function MobileNav({
  currentView,
  setCurrentView,
  hasCurrentTrack,
  onOpenPlayerModal
}: MobileNavProps) {
  const isHome = currentView === "home";
  const isSearch = currentView === "search";
  const isLibrary = currentView === "library" || currentView === "liked-songs" || currentView.startsWith("playlist-");
  const isSettings = currentView === "settings";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a14]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 flex justify-around items-center md:hidden select-none shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {/* Home Tab */}
      <button
        id="mobile_nav_home"
        onClick={() => setCurrentView("home")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isHome ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5px] scale-110 drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]" : ""}`} />
        <span className={`text-[10px] ${isHome ? "font-bold text-white" : "font-medium"}`}>
          Accueil
        </span>
      </button>

      {/* Search Tab */}
      <button
        id="mobile_nav_search"
        onClick={() => setCurrentView("search")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isSearch ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Search className={`w-5 h-5 ${isSearch ? "stroke-[2.5px] scale-110 drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]" : ""}`} />
        <span className={`text-[10px] ${isSearch ? "font-bold text-white" : "font-medium"}`}>
          Recherche
        </span>
      </button>

      {/* Library Tab */}
      <button
        id="mobile_nav_library"
        onClick={() => setCurrentView("library")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isLibrary ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Library className={`w-5 h-5 ${isLibrary ? "stroke-[2.5px] scale-110 drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]" : ""}`} />
        <span className={`text-[10px] ${isLibrary ? "font-bold text-white" : "font-medium"}`}>
          Bibliothèque
        </span>
      </button>

      {/* Settings / Profile Tab */}
      <button
        id="mobile_nav_settings"
        onClick={() => setCurrentView("settings")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isSettings ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Settings className={`w-5 h-5 ${isSettings ? "stroke-[2.5px] scale-110 drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]" : ""}`} />
        <span className={`text-[10px] ${isSettings ? "font-bold text-white" : "font-medium"}`}>
          Réglages
        </span>
      </button>
    </nav>
  );
}
