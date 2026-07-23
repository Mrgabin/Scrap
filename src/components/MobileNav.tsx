import React from "react";
import { Home, Search, Library, Plus } from "lucide-react";

interface MobileNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  hasCurrentTrack: boolean;
  onOpenPlayerModal?: () => void;
  onCreatePlaylist?: () => void;
}

export default function MobileNav({
  currentView,
  setCurrentView,
  hasCurrentTrack,
  onOpenPlayerModal,
  onCreatePlaylist
}: MobileNavProps) {
  const isHome = currentView === "home";
  const isSearch = currentView === "search";
  const isLibrary = currentView === "library" || currentView === "liked-songs" || currentView.startsWith("playlist-");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#090909] border-t border-white/5 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex justify-around items-center md:hidden select-none shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
      {/* Home Tab */}
      <button
        id="mobile_nav_home"
        onClick={() => setCurrentView("home")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isHome ? "text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Home className={`w-5.5 h-5.5 ${isHome ? "stroke-[2.5px] text-white" : "text-neutral-400"}`} />
        <span className={`text-[10px] ${isHome ? "font-bold text-white" : "font-medium text-neutral-400"}`}>
          Accueil
        </span>
      </button>

      {/* Search Tab */}
      <button
        id="mobile_nav_search"
        onClick={() => setCurrentView("search")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isSearch ? "text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Search className={`w-5.5 h-5.5 ${isSearch ? "stroke-[2.5px] text-white" : "text-neutral-400"}`} />
        <span className={`text-[10px] ${isSearch ? "font-bold text-white" : "font-medium text-neutral-400"}`}>
          Recherche
        </span>
      </button>

      {/* Library Tab */}
      <button
        id="mobile_nav_library"
        onClick={() => setCurrentView("library")}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 ${
          isLibrary ? "text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        <Library className={`w-5.5 h-5.5 ${isLibrary ? "stroke-[2.5px] text-white" : "text-neutral-400"}`} />
        <span className={`text-[10px] ${isLibrary ? "font-bold text-white" : "font-medium text-neutral-400"}`}>
          Bibliothèque
        </span>
      </button>

      {/* Créer Tab */}
      <button
        id="mobile_nav_create"
        onClick={() => {
          if (onCreatePlaylist) {
            onCreatePlaylist();
          }
        }}
        className="flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl active:scale-95 text-neutral-400 hover:text-white"
      >
        <Plus className="w-5.5 h-5.5 text-neutral-400" />
        <span className="text-[10px] font-medium text-neutral-400">
          Créer
        </span>
      </button>
    </nav>
  );
}
