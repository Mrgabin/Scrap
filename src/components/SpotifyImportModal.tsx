import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, Key, Check, Loader2, ArrowRight, Music, AlertCircle } from "lucide-react";
import { Track } from "../types";

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotifyClientId: string;
  spotifyClientSecret: string;
  onSaveCredentials: (clientId: string, clientSecret: string) => Promise<void> | void;
  onImportPlaylist: (playlistUrl: string) => Promise<Track[]>;
  onAddTracksToLiked: (tracks: Track[]) => Promise<void> | void;
}

export default function SpotifyImportModal({
  isOpen,
  onClose,
  spotifyClientId,
  spotifyClientSecret,
  onSaveCredentials,
  onImportPlaylist,
  onAddTracksToLiked,
}: SpotifyImportModalProps) {
  const [clientIdInput, setClientIdInput] = useState(spotifyClientId);
  const [clientSecretInput, setClientSecretInput] = useState(spotifyClientSecret);
  const [playlistUrlInput, setPlaylistUrlInput] = useState("");
  
  const [mode, setMode] = useState<"credentials" | "import" | "loading" | "success" | "error">("credentials");
  const [errorText, setErrorText] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  // Sync inputs with props when they load
  useEffect(() => {
    setClientIdInput(spotifyClientId);
    setClientSecretInput(spotifyClientSecret);
    
    // Automatically transition to import screen if they already have saved credentials
    if (spotifyClientId && spotifyClientSecret) {
      setMode("import");
    } else {
      setMode("credentials");
    }
  }, [spotifyClientId, spotifyClientSecret, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setErrorText("Veuillez remplir le Client ID et le Client Secret.");
      return;
    }

    try {
      setErrorText("");
      await onSaveCredentials(clientIdInput.trim(), clientSecretInput.trim());
      setMode("import");
    } catch (err: any) {
      setErrorText(err.message || "Impossible de sauvegarder les identifiants.");
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrlInput.trim()) {
      setErrorText("Veuillez saisir un lien ou identifiant de playlist Spotify.");
      return;
    }

    setMode("loading");
    setErrorText("");

    try {
      const tracks = await onImportPlaylist(playlistUrlInput.trim());
      if (tracks.length === 0) {
        throw new Error("Aucun morceau trouvé dans cette playlist.");
      }
      
      await onAddTracksToLiked(tracks);
      setImportedCount(tracks.length);
      setPlaylistUrlInput("");
      setMode("success");
    } catch (err: any) {
      setErrorText(err.message || "Une erreur est survenue lors de l'importation de la playlist.");
      setMode("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-fadeIn">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-[#1db954]/5 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954]/10 to-transparent px-6 py-5 border-b border-neutral-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-[#1DB954]">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">Transférer une Playlist Spotify</h3>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">Importation instantanée</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors text-sm font-semibold p-1.5 rounded-full hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex-1">
          {mode === "credentials" && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="bg-[#1c1c1e] border border-neutral-800 rounded-xl p-4 flex gap-3.5 items-start">
                <HelpCircle className="w-5 h-5 text-[#1DB954] shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Comment obtenir mes accès API ?</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Pour importer vos playlists, vous devez créer une application sur le portail développeur de Spotify. C'est 100% gratuit et prend 2 minutes.
                  </p>
                  <a 
                    href="https://developer.spotify.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1DB954] hover:underline pt-1"
                  >
                    Ouvrir le portail Spotify Developer <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {errorText && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Client ID Spotify
                  </label>
                  <input
                    type="text"
                    placeholder="Saisissez votre Client ID"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full bg-[#18181a] border border-neutral-800 focus:border-[#1DB954] rounded-lg py-3 px-4 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-[#1DB954]/30 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Client Secret Spotify
                  </label>
                  <input
                    type="password"
                    placeholder="Saisissez votre Client Secret"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    className="w-full bg-[#18181a] border border-neutral-800 focus:border-[#1DB954] rounded-lg py-3 px-4 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-[#1DB954]/30 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs px-5 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#1db954]/10"
                >
                  Valider les accès API
                </button>
              </div>
            </form>
          )}

          {mode === "import" && (
            <form onSubmit={handleImport} className="space-y-5">
              <div className="text-center py-2">
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  Collez simplement le lien de partage de n'importe quelle playlist Spotify publique pour transférer tous ses titres dans vos <strong className="text-white">Titres Likés</strong>.
                </p>
              </div>

              {errorText && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                    Lien de la Playlist Spotify
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGsy6g8j"
                    value={playlistUrlInput}
                    onChange={(e) => setPlaylistUrlInput(e.target.value)}
                    className="w-full bg-[#18181a] border border-neutral-800 focus:border-[#1DB954] rounded-lg py-3.5 px-4 text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-[#1DB954]/30 transition-all placeholder-neutral-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* API Credentials Info bar */}
              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-bold bg-[#18181a]/40 border border-neutral-900 rounded-lg p-3">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#1DB954]" /> Identifiants API configurés
                </span>
                <button
                  type="button"
                  onClick={() => setMode("credentials")}
                  className="text-[#1DB954] hover:underline"
                >
                  Modifier les clés API
                </button>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#1db954]/10"
                >
                  Transférer la playlist
                </button>
              </div>
            </form>
          )}

          {mode === "loading" && (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-[#1DB954] animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Importation en cours...</p>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Récupération des morceaux de votre playlist Spotify et conversion on-the-fly de haute qualité...
                </p>
              </div>
            </div>
          )}

          {mode === "success" && (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] border border-[#1DB954]/30 shadow-lg shadow-[#1db954]/5 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-white">Transfert Réussi !</h4>
                <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                  Excellent ! <strong className="text-[#1DB954]">{importedCount} morceaux</strong> ont été ajoutés instantanément à vos <strong className="text-white">Titres Likés</strong>.
                </p>
                <p className="text-[10px] text-neutral-500 max-w-xs leading-relaxed mx-auto italic pt-2">
                  Tous les morceaux sont pré-configurés pour se résoudre et se jouer instantanément en haute qualité au clic !
                </p>
              </div>
              <div className="w-full pt-4 border-t border-neutral-900 flex justify-center">
                <button
                  onClick={onClose}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-transform hover:scale-105 active:scale-95"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {mode === "error" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center py-4 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Échec du transfert</h4>
                  <p className="text-xs text-red-400/90 leading-relaxed max-w-xs mx-auto">
                    {errorText || "Une erreur inconnue est survenue lors du transfert."}
                  </p>
                </div>
              </div>

              {(errorText.includes("403") || errorText.toLowerCase().includes("forbidden") || errorText.toLowerCase().includes("invalides")) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3.5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <HelpCircle className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Comment résoudre l'erreur 403 / Interdit :</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Votre application Spotify API est en <strong>mode Développement</strong>. Par défaut, Spotify bloque l'accès aux playlists si le propriétaire du compte n'est pas déclaré comme utilisateur autorisé.
                  </p>
                  <div className="text-[11px] text-neutral-400 space-y-1.5 list-decimal pl-1">
                    <p className="flex gap-2 items-start">
                      <span className="bg-[#1DB954]/20 text-[#1DB954] w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[9px] mt-0.5">1</span>
                      <span>Allez sur votre <strong><a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:underline">Spotify Developer Dashboard</a></strong> et cliquez sur votre projet.</span>
                    </p>
                    <p className="flex gap-2 items-start">
                      <span className="bg-[#1DB954]/20 text-[#1DB954] w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[9px] mt-0.5">2</span>
                      <span>Dans le menu latéral ou l'engrenage, cliquez sur <strong>Users and Access</strong> (ou <strong>User Management</strong>).</span>
                    </p>
                    <p className="flex gap-2 items-start">
                      <span className="bg-[#1DB954]/20 text-[#1DB954] w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[9px] mt-0.5">3</span>
                      <span>Ajoutez l'adresse e-mail de votre compte Spotify principal (celui avec lequel vous écoutez de la musique et avez créé la playlist) et validez.</span>
                    </p>
                    <p className="flex gap-2 items-start">
                      <span className="bg-[#1DB954]/20 text-[#1DB954] w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[9px] mt-0.5">4</span>
                      <span>Vérifiez que votre playlist est bien définie en <strong>Public</strong> sur l'application Spotify, puis réessayez l'importation.</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setMode("import")}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Réessayer
                </button>
                <button
                  type="button"
                  onClick={() => setMode("credentials")}
                  className="bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] font-bold text-xs px-5 py-2.5 rounded-full transition-transform hover:scale-105"
                >
                  Modifier mes clés API
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
