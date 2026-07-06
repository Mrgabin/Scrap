import React, { useState, useEffect } from "react";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, Shield, Image as ImageIcon, Save, CheckCircle, AlertTriangle, Heart, UserMinus, Music, ExternalLink, LogOut } from "lucide-react";

interface SettingsViewProps {
  user: any;
  onUpdateProfile?: (displayName: string, photoURL: string) => void;
  followedArtists?: string[];
  artistAvatars?: Record<string, string>;
  onSelectArtist?: (artistName: string) => void;
  onToggleFollowArtist?: (artistName: string) => void;
  onLogout?: () => void;
  customBackgroundUrl?: string;
  onUpdateBackground?: (url: string) => Promise<void>;
}

export default function SettingsView({ 
  user, 
  onUpdateProfile,
  followedArtists = [],
  artistAvatars = {},
  onSelectArtist,
  onToggleFollowArtist,
  onLogout,
  customBackgroundUrl = "",
  onUpdateBackground
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [bgUrl, setBgUrl] = useState(customBackgroundUrl || "");
  
  // Keep local bgUrl state in sync with external prop changes
  useEffect(() => {
    setBgUrl(customBackgroundUrl || "");
  }, [customBackgroundUrl]);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Firestore Profile (only for non-guest users)
  useEffect(() => {
    if (!user) return;
    if (user.isGuest) {
      const savedBg = localStorage.getItem("scrap_custom_background_url");
      if (savedBg) {
        setBgUrl(savedBg);
      }
      return;
    }
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.photoURL) {
            setPhotoURL(data.photoURL);
          }
          if (data.displayName) {
            setDisplayName(data.displayName);
          }
          if (data.customBackgroundUrl) {
            setBgUrl(data.customBackgroundUrl);
          }
        } else {
          setPhotoURL(user.photoURL || "");
        }
      } catch (err) {
        console.error("Error reading profile:", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    // Basic URL validation
    let finalPhotoURL = photoURL.trim();
    if (finalPhotoURL && !/^https?:\/\/.+/i.test(finalPhotoURL)) {
      setMessage({ type: "error", text: "L'URL de l'image de profil n'est pas valide. Elle doit commencer par http:// ou https://" });
      setLoading(false);
      return;
    }

    if (user.isGuest) {
      setMessage({ type: "error", text: "La modification du profil est désactivée en mode invité." });
      setLoading(false);
      return;
    }

    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL || null
      });

      // 2. Update Firestore Doc
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL || ""
      });

      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Erreur lors de la mise à jour." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    if (user.isGuest) {
      setMessage({ type: "error", text: "La modification des paramètres de sécurité est désactivée en mode invité (pas de compte réel)." });
      setLoading(false);
      return;
    }

    try {
      // 1. Update Email if changed
      if (email.trim() !== user.email) {
        await updateEmail(user, email.trim());
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
          email: email.trim()
        });
      }

      // 2. Update Password if specified
      if (password) {
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
        await updatePassword(user, password);
        setPassword("");
      }

      setMessage({ type: "success", text: "Identifiants de sécurité mis à jour ! Notez qu'une reconnexion peut être nécessaire." });
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setMessage({ type: "error", text: "Cette opération est sensible et nécessite une connexion récente. Veuillez vous déconnecter puis vous reconnecter pour récurer l'autorisation." });
      } else {
        setMessage({ type: "error", text: err.message || "Erreur de sécurité." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto text-white overflow-y-auto h-full" id="settings_view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#282828]" id="settings_header_section">
        <div>
          <h2 className="text-3xl font-bold mb-1">Paramètres du Compte</h2>
          <p className="text-sm text-[#b3b3b3]">Gérez vos préférences de profil Scrap, modifiez votre adresse e-mail ou mettez à jour votre avatar.</p>
        </div>
        {onLogout && (
          <button
            id="settings_logout_btn"
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm transition-all hover:scale-105 self-start md:self-auto shadow-lg shadow-red-900/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-8 flex items-start gap-3 border ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium text-sm">{message.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Card Section */}
        <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#282828]">
            <User className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-bold text-lg">Personnalisation du Profil</h3>
          </div>

          <div className="flex flex-col items-center gap-4 py-4 bg-black/30 rounded-lg p-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#1DB954] shadow-xl bg-neutral-800">
              {photoURL ? (
                <img referrerPolicy="no-referrer" src={photoURL} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#1DB954] to-blue-500 flex items-center justify-center text-3xl font-black">
                  {displayName?.substring(0, 1).toUpperCase() || "S"}
                </div>
              )}
            </div>
            <p className="text-xs text-[#b3b3b3] text-center">Aperçu en temps réel de votre avatar de streaming.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#b3b3b3]">Nom public</label>
              <input
                id="profile_name_input"
                type="text"
                placeholder="Votre nom d'artiste"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/40 rounded px-3 py-2.5 text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#b3b3b3] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#1DB954]" /> URL de l'Avatar Externe
              </label>
              <input
                id="profile_avatar_input"
                type="text"
                placeholder="https://images.unsplash.com/... ou lien Pinterest"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/40 rounded px-3 py-2.5 text-sm transition-all outline-none font-mono text-xs"
              />
              <p className="text-[10px] text-[#b3b3b3] mt-1.5 leading-relaxed">
                Copiez l'adresse de n'importe quelle image sur le web (Pinterest, Google Images, Unsplash) et collez-la ici. Elle sera synchronisée directement.
              </p>
            </div>

            <button
              id="save_profile_btn"
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-5 py-2.5 rounded-full flex items-center justify-center gap-2 self-start transition-transform hover:scale-105"
            >
              <Save className="w-4 h-4" /> Sauvegarder le Profil
            </button>
          </form>

          {/* Section Thème d'arrière-plan */}
          <div className="border-t border-[#282828] pt-5 mt-2 flex flex-col gap-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b3b3b3] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#1DB954]" /> Personnaliser l'Arrière-plan
            </label>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Option 1: Black Hole */}
              <button
                type="button"
                onClick={async () => {
                  setBgUrl("trou_noir");
                  if (onUpdateBackground) {
                    try {
                      setLoading(true);
                      await onUpdateBackground("trou_noir");
                      setMessage({ type: "success", text: "Thème Trou Noir activé !" });
                    } catch (err: any) {
                      setMessage({ type: "error", text: "Erreur de changement de thème." });
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer bg-[#1e1e1e] ${
                  bgUrl === "trou_noir" || bgUrl === "" 
                    ? "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.15)]" 
                    : "border-[#282828] hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-black border-2 border-orange-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.2)] mb-2">
                  <div className="w-6 h-6 rounded-full bg-black shadow-inner" />
                </div>
                <span className="text-xs font-bold text-white">Trou Noir (3D)</span>
                <span className="text-[9px] text-[#b3b3b3] mt-1">Espace infini</span>
              </button>

              {/* Option 2: Stable Singularity */}
              <button
                type="button"
                onClick={async () => {
                  setBgUrl("stable_singularity");
                  if (onUpdateBackground) {
                    try {
                      setLoading(true);
                      await onUpdateBackground("stable_singularity");
                      setMessage({ type: "success", text: "Thème Singularité Stable activé !" });
                    } catch (err: any) {
                      setMessage({ type: "error", text: "Erreur de changement de thème." });
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer bg-[#1e1e1e] ${
                  bgUrl === "stable_singularity" 
                    ? "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.15)]" 
                    : "border-[#282828] hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-[#00f3ff]/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,243,255,0.3)] mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#00f3ff]/10 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-white">Singularité Stable (3D)</span>
                <span className="text-[9px] text-[#b3b3b3] mt-1">Thème Relativiste</span>
              </button>

              {/* Option 3: Tectonic Lava */}
              <button
                type="button"
                onClick={async () => {
                  setBgUrl("tectonic_lava");
                  if (onUpdateBackground) {
                    try {
                      setLoading(true);
                      await onUpdateBackground("tectonic_lava");
                      setMessage({ type: "success", text: "Thème Fissure de Lave activé !" });
                    } catch (err: any) {
                      setMessage({ type: "error", text: "Erreur de changement de thème." });
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer bg-[#1e1e1e] ${
                  bgUrl === "tectonic_lava" 
                    ? "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.15)]" 
                    : "border-[#282828] hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-red-950 border-2 border-red-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)] mb-2">
                  <div className="w-5 h-5 rounded-full bg-orange-600/30 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-white">Fissures de Lave (3D)</span>
                <span className="text-[9px] text-[#b3b3b3] mt-1">Thème Tectonique</span>
              </button>

              {/* Option 4: Quantum Core */}
              <button
                type="button"
                onClick={async () => {
                  setBgUrl("quantum_core");
                  if (onUpdateBackground) {
                    try {
                      setLoading(true);
                      await onUpdateBackground("quantum_core");
                      setMessage({ type: "success", text: "Thème Quantum Core (Aether) activé !" });
                    } catch (err: any) {
                      setMessage({ type: "error", text: "Erreur de changement de thème." });
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer bg-[#1e1e1e] ${
                  bgUrl === "quantum_core" 
                    ? "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.15)]" 
                    : "border-[#282828] hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-950 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)] mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#00f3ff] animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                <span className="text-xs font-bold text-white">Quantum Core (3D)</span>
                <span className="text-[9px] text-[#b3b3b3] mt-1">Simulation Optique</span>
              </button>

              {/* Option 5: Image URL Option */}
              <button
                type="button"
                onClick={() => {
                  // Switch to image mode: prompt/allow url editing. If it is already a URL, keep it. Otherwise make it empty or Unsplash default.
                  if (bgUrl === "trou_noir" || bgUrl === "stable_singularity" || bgUrl === "tectonic_lava" || bgUrl === "quantum_core" || bgUrl === "") {
                    setBgUrl("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2340&auto=format&fit=crop");
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer bg-[#1e1e1e] ${
                  bgUrl !== "trou_noir" && bgUrl !== "stable_singularity" && bgUrl !== "tectonic_lava" && bgUrl !== "quantum_core" && bgUrl !== ""
                    ? "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.15)]" 
                    : "border-[#282828] hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center mb-2">
                  <ImageIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <span className="text-xs font-bold text-white">Image Personnalisée</span>
                <span className="text-[9px] text-[#b3b3b3] mt-1">Lien d'image web</span>
              </button>
            </div>

            {/* Custom URL Input Field (Visible if we selected Option 5) */}
            {bgUrl !== "trou_noir" && bgUrl !== "stable_singularity" && bgUrl !== "tectonic_lava" && bgUrl !== "quantum_core" && bgUrl !== "" && (
              <div className="flex flex-col gap-2 mt-2 bg-black/30 p-3 rounded-lg border border-[#282828] animate-fadeIn">
                <span className="text-xs font-semibold text-neutral-300">URL du lien de l'image :</span>
                <input
                  id="custom_bg_input"
                  type="text"
                  placeholder="https://images.unsplash.com/... (lien direct d'image)"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                  className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/40 rounded px-3 py-2 text-xs transition-all outline-none font-mono"
                />
                <p className="text-[10px] text-[#b3b3b3] leading-relaxed">
                  Entrez l'adresse de n'importe quelle image sur le web (Pinterest, Google Images, Unsplash). L'image se recadrera automatiquement à la taille de votre fenêtre web !
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (onUpdateBackground) {
                        try {
                          setLoading(true);
                          await onUpdateBackground(bgUrl.trim());
                          setMessage({ type: "success", text: "Image d'arrière-plan personnalisée appliquée !" });
                        } catch (err: any) {
                          setMessage({ type: "error", text: "Erreur de mise à jour." });
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs px-4 py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> Appliquer l'image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings Section */}
        <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#282828]">
            <Shield className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-bold text-lg">Sécurité du Compte</h3>
          </div>

          <form onSubmit={handleUpdateSecurity} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#b3b3b3]">Adresse e-mail</label>
              <input
                id="sec_email_input"
                type="email"
                placeholder="nouvel.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/40 rounded px-3 py-2.5 text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#b3b3b3]">Nouveau mot de passe</label>
              <input
                id="sec_password_input"
                type="password"
                placeholder="Remplir uniquement pour modifier"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/40 rounded px-3 py-2.5 text-sm transition-all outline-none"
              />
              <p className="text-[10px] text-[#b3b3b3] mt-1.5 leading-relaxed">
                Laissez vide si vous ne souhaitez pas modifier votre mot de passe actuel. Minimum 6 caractères.
              </p>
            </div>

            <button
              id="save_sec_btn"
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-5 py-2.5 rounded-full flex items-center justify-center gap-2 self-start transition-transform hover:scale-105"
            >
              <Save className="w-4 h-4" /> Mettre à jour la Sécurité
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#282828] text-xs text-[#b3b3b3] leading-relaxed">
            <span className="font-semibold text-white block mb-1">Protection Firebase :</span>
            Toutes les modifications d'e-mail et de mot de passe sont sécurisées par l'architecture Firebase Authentication intégrée.
          </div>
        </div>

      </div>

      {/* Subscriptions Section */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] mt-8 flex flex-col gap-6" id="settings_subscriptions_section">
        <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
            <h3 className="font-bold text-lg">Mes Abonnements • Subscriptions</h3>
          </div>
          <span className="text-xs bg-[#282828] text-[#1DB954] px-2.5 py-1 rounded-full font-bold">
            {followedArtists.length} artiste{followedArtists.length > 1 ? "s" : ""} suivi{followedArtists.length > 1 ? "s" : ""}
          </span>
        </div>

        {followedArtists.length === 0 ? (
          <div className="text-center py-10 px-4 bg-black/15 rounded-xl border border-dashed border-[#282828]">
            <Music className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-400">Aucun artiste suivi pour le moment.</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">Recherchez vos artistes préférés comme "The Weeknd", "Daft Punk" ou "Stromae", visitez leur profil et cliquez sur "S'abonner" pour les voir s'afficher ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {followedArtists.map((artistName) => {
              const avatar = artistAvatars[artistName];
              return (
                <div 
                  key={artistName}
                  className="bg-black/20 hover:bg-[#282828]/50 border border-[#282828] rounded-xl p-3.5 flex items-center justify-between transition-all group"
                >
                  <div 
                    onClick={() => onSelectArtist?.(artistName)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-neutral-800 bg-gradient-to-tr from-[#1DB954]/20 to-emerald-700 flex items-center justify-center font-bold text-lg text-white">
                      {avatar ? (
                        <img referrerPolicy="no-referrer" src={avatar} alt={artistName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        artistName.substring(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-white group-hover:text-[#1DB954] transition-colors truncate flex items-center gap-1.5">
                        {artistName}
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[10px] text-neutral-400">Artiste vérifié • YouTube Music</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFollowArtist?.(artistName)}
                    title="Se désabonner"
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0 animate-pulse-once"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
