import React, { useState, useEffect } from "react";
import { updateEmail, updatePassword, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, Shield, Image as ImageIcon, Save, CheckCircle, AlertTriangle, Heart, UserMinus, Music, ExternalLink, LogOut, Trash2, Loader2, Key, Sparkles, Github, HelpCircle, Smartphone, Download, PlusSquare } from "lucide-react";
import InstallPwaModal from "./InstallPwaModal";
import { getDeterministicArtistAvatar } from "../lib/avatarHelper";

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
  tasteScores?: any;
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
  onUpdateBackground,
  tasteScores
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

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showInstallPwaModal, setShowInstallPwaModal] = useState(false);

  const openDeleteModal = () => {
    setDeleteStep(1);
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isGuest) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      // 1. Fetch password from 'mot_de_passe' collection to verify
      const pwdRef = doc(db, "mot_de_passe", user.uid);
      const pwdSnap = await getDoc(pwdRef);
      
      if (!pwdSnap.exists()) {
        throw new Error(
          "Aucun mot de passe de sécurité n'est configuré pour ce compte. Veuillez d'abord en définir un dans la section 'Sécurité du compte' ci-dessus pour pouvoir valider la suppression."
        );
      }

      const storedPassword = pwdSnap.data().password;
      if (deletePassword !== storedPassword) {
        throw new Error("Le mot de passe saisi est incorrect.");
      }

      // 2. Reauthenticate user if possible (critical for Firebase Auth user deletion)
      try {
        const credential = EmailAuthProvider.credential(user.email || auth.currentUser?.email || "", deletePassword);
        if (auth.currentUser) {
          await reauthenticateWithCredential(auth.currentUser, credential);
        }
      } catch (authErr: any) {
        console.warn("Reauthentication skipped or failed (might be a Google provider only):", authErr);
      }

      // 3. Delete all subcollection documents in Firestore
      const collectionsToDelete = [
        "likedTracks",
        "playlists",
        "history",
        "followedArtists",
        "personalizedPlaylists",
        "searchHistory"
      ];
      for (const colName of collectionsToDelete) {
        const colRef = collection(db, "users", user.uid, colName);
        const colSnap = await getDocs(colRef);
        for (const docItem of colSnap.docs) {
          await deleteDoc(doc(db, "users", user.uid, colName, docItem.id));
        }
      }

      // 4. Delete main user profile document
      await deleteDoc(doc(db, "users", user.uid));

      // 5. Delete password record document
      await deleteDoc(pwdRef);

      // 6. Delete Firebase Auth account
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      // 7. Clear local cache and logout
      localStorage.clear();
      setShowDeleteModal(false);
      if (onLogout) {
        onLogout();
      }
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setDeleteError(err.message || "Une erreur est survenue lors de la suppression de votre compte.");
    } finally {
      setDeleteLoading(false);
    }
  };

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
          throw new Error("Le mot de passe doit de préférence contenir au moins 6 caractères.");
        }
        
        let authPasswordUpdated = false;
        try {
          await updatePassword(user, password);
          authPasswordUpdated = true;
        } catch (authPassErr: any) {
          console.warn("Could not update password in Firebase Auth directly (might be a Google provider only):", authPassErr);
        }

        // Save password to 'mot_de_passe' collection
        const pwdRef = doc(db, "mot_de_passe", user.uid);
        await setDoc(pwdRef, {
          uid: user.uid,
          email: user.email || email.trim(),
          password: password,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        setPassword("");

        if (!authPasswordUpdated) {
          setMessage({
            type: "success",
            text: "Mot de passe de sécurité enregistré dans la base de données ! (Note: Comme vous êtes connecté via Google, ce mot de passe servira uniquement de clé de sécurité pour valider la suppression de votre compte)."
          });
          setLoading(false);
          return;
        }
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
    <div className="p-4 md:p-8 pb-36 md:pb-28 max-w-4xl mx-auto text-white overflow-y-auto h-full" id="settings_view">
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
                      {(() => {
                        const avatarUrl = avatar || getDeterministicArtistAvatar(artistName);
                        return (
                          <img 
                            referrerPolicy="no-referrer" 
                            src={avatarUrl} 
                            alt={artistName} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = getDeterministicArtistAvatar(artistName);
                            }}
                          />
                        );
                      })()}
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

      {/* Profilage IA & Scores d'Affinité */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] mt-8 flex flex-col gap-6" id="settings_ai_profile_section">
        <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-bold text-lg">Mon Profil Acoustique IA • Real-Time Taste Profiler</h3>
          </div>
          <span className="text-xs bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20 px-2.5 py-1 rounded-full font-bold">
            Analyse Active • Active
          </span>
        </div>

        <p className="text-xs text-[#b3b3b3] leading-relaxed">
          Le Profil Acoustique Scrap suit le temps passé sur chaque musique proposée. Les morceaux écoutés en entier ajoutent <span className="text-[#1DB954] font-semibold">+2 points</span>, les morceaux écoutés partiellement ajoutent <span className="text-[#1DB954] font-semibold">+1 point</span> et les musiques passées rapidement retirent <span className="text-red-400 font-semibold">-1 point</span> à leurs dimensions respectives (Styles, Langues, Rythmes, Époques).
        </p>

        {tasteScores ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
            {/* Genres */}
            <div className="bg-black/20 p-4 rounded-xl border border-[#282828]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b3b3b3] mb-3">Styles Musicaux (Genres)</h4>
              <div className="space-y-2.5">
                {Object.entries(tasteScores.genres || {}).map(([g, val]: any) => (
                  <div key={g} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="capitalize font-semibold text-neutral-200">{g === "lofi" ? "Lofi / Chill" : g}</span>
                      <span className="font-mono text-[#1DB954]">{val} pts</span>
                    </div>
                    <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1DB954] h-full transition-all duration-500" style={{ width: `${Math.min(100, (val / 30) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-black/20 p-4 rounded-xl border border-[#282828]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b3b3b3] mb-3">Langues d'Écoute</h4>
              <div className="space-y-2.5">
                {Object.entries(tasteScores.languages || {}).map(([l, val]: any) => (
                  <div key={l} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-neutral-200">{l === "fr" ? "Français" : "Anglais / Autre"}</span>
                      <span className="font-mono text-[#1DB954]">{val} pts</span>
                    </div>
                    <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1DB954] h-full transition-all duration-500" style={{ width: `${Math.min(100, (val / 30) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rhythms */}
            <div className="bg-black/20 p-4 rounded-xl border border-[#282828]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b3b3b3] mb-3">Rythmes & Tempo</h4>
              <div className="space-y-2.5">
                {Object.entries(tasteScores.rhythms || {}).map(([r, val]: any) => (
                  <div key={r} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="capitalize font-semibold text-neutral-200">
                        {r === "fast" ? "Rapide / Dance" : r === "medium" ? "Modéré" : "Lent / Ambiant"}
                      </span>
                      <span className="font-mono text-[#1DB954]">{val} pts</span>
                    </div>
                    <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1DB954] h-full transition-all duration-500" style={{ width: `${Math.min(100, (val / 30) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eras */}
            <div className="bg-black/20 p-4 rounded-xl border border-[#282828]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b3b3b3] mb-3">Époques de Sortie</h4>
              <div className="space-y-2.5">
                {Object.entries(tasteScores.eras || {}).map(([e, val]: any) => (
                  <div key={e} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-neutral-200">
                        {e === "2020s" ? "Actuel (2020s)" : e === "2010s" ? "Années 2010" : e === "2000s" ? "Années 2000" : "Classiques / Oldies"}
                      </span>
                      <span className="font-mono text-[#1DB954]">{val} pts</span>
                    </div>
                    <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1DB954] h-full transition-all duration-500" style={{ width: `${Math.min(100, (val / 30) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-neutral-500 text-xs">
            Aucun score d'affinité calculé pour l'instant. Commencez à écouter de la musique pour construire votre profil !
          </div>
        )}
      </div>

      {/* Application Mobile & PWA Section */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] mt-8 flex flex-col gap-6" id="settings_pwa_section">
        <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-bold text-lg">Application Mobile • Écran d'Accueil iOS & Android</h3>
          </div>
          <span className="text-xs bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20 px-2.5 py-1 rounded-full font-bold">
            Mode PWA Standalone
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-neutral-900 to-black p-5 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
              <img src="/icon.png" alt="Scrap Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Installer Scrap comme une vraie App</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-lg leading-relaxed">
                Ajoutez le logo et l'icône Scrap directement sur l'écran d'accueil de votre iPhone, iPad ou téléphone Android pour lancer le lecteur en plein écran sans barre de navigateur !
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstallPwaModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Installer l'application
          </button>
        </div>
      </div>

      {/* À propos & En savoir plus Section */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828] mt-8 flex flex-col gap-6" id="settings_about_section">
        <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-bold text-lg">En savoir plus • About Scrap</h3>
          </div>
          <span className="text-xs bg-[#282828] text-neutral-300 px-2.5 py-1 rounded-full font-bold">
            v1.2.0-stable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Rejoignez la communauté de développement de Scrap !</p>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              Scrap est un lecteur audio intelligent, propulsé par des algorithmes de recherche prédictive LTR (Learning to Rank) et une intégration de streaming YouTube Music fluide. 
            </p>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              Consultez le code source sur GitHub pour contribuer, signaler des bugs ou proposer de nouvelles fonctionnalités, et rejoignez notre serveur Discord pour échanger avec d'autres passionnés !
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            {/* GitHub button */}
            <a
              href="https://github.com/Mrgabin/Scrap"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 max-w-[200px] py-3 px-5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all border border-transparent hover:border-white/10 shadow-lg hover:scale-105 active:scale-95"
              id="settings_github_btn"
            >
              <Github className="w-5 h-5 text-white" />
              GitHub
            </a>

            {/* Discord button */}
            <a
              href="https://discord.gg/pJj6FAVnEy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 max-w-[200px] py-3 px-5 rounded-full bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] text-sm font-bold flex items-center justify-center gap-2 transition-all border border-[#5865F2]/20 hover:border-[#5865F2]/40 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              id="settings_discord_btn"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.18,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,73,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.87,48.12,122.94,25.35,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.14-12.69,11.41-12.69S53.9,46,53.8,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53s5.14-12.69,11.41-12.69S96.13,46,96,53,91,65.69,84.69,65.69Z"/>
              </svg>
              Discord
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-[#181818] rounded-xl p-6 border border-red-500/20 mt-8 flex flex-col gap-6" id="settings_danger_zone">
        <div className="flex items-center gap-3 pb-4 border-b border-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-lg text-red-500">Zone de Danger • Danger Zone</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm text-neutral-200">Supprimer mon compte Scrap et toutes mes données</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Cette action supprimera définitivement votre profil, vos titres favoris (likes), vos listes de lecture personnalisées (playlists), votre historique d'écoute et vos abonnements d'artistes de notre base de données.
            </p>
          </div>
          {user?.isGuest ? (
            <span className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full font-semibold">
              Mode Invité (Pas de données cloud)
            </span>
          ) : (
            <button
              id="delete_account_btn"
              onClick={openDeleteModal}
              className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-transparent text-red-500 hover:text-white rounded-full text-xs font-bold transition-all hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </button>
          )}
        </div>
      </div>

      {/* Account Deletion Double-Validation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn" id="delete_modal_overlay">
          <div className="bg-[#181818] border border-red-500/30 max-w-md w-full rounded-2xl p-6 shadow-2xl relative animate-scaleUp" id="delete_modal_container">
            {/* Step 1: Confirm Deletion */}
            {deleteStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-center text-red-500">Première demande de validation</h3>
                <p className="text-sm text-neutral-300 text-center leading-relaxed">
                  Vous êtes sur le point de supprimer votre compte Scrap. Cette opération est <strong className="text-red-400">totalement irréversible</strong> et entraînera la perte définitive de toutes vos données :
                </p>
                <div className="bg-black/20 p-3 rounded-lg text-xs text-neutral-400 space-y-1">
                  <p>• Votre profil et identifiants de sécurité</p>
                  <p>• Tous vos titres likés</p>
                  <p>• Vos playlists personnalisées</p>
                  <p>• Votre historique de lecture complet</p>
                  <p>• Vos abonnements aux artistes</p>
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  Êtes-vous absolument certain de vouloir procéder à la suppression ?
                </p>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-white text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Oui, je confirme
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Double Confirmation with Password */}
            {deleteStep === 2 && (
              <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-center text-red-500">Seconde demande de validation</h3>
                <p className="text-sm text-neutral-300 text-center leading-relaxed">
                  Pour valider définitivement la suppression de votre compte, veuillez saisir <strong className="text-white">le mot de passe</strong> de votre compte Scrap.
                </p>

                {deleteError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-medium text-center">
                    {deleteError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Mot de passe de confirmation</label>
                  <input
                    type="password"
                    required
                    placeholder="Saisissez votre mot de passe"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#2a2a2a] border border-transparent focus:border-red-500/40 rounded-lg px-3.5 py-2.5 text-sm transition-all outline-none text-white"
                  />
                  <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                    Dans tous les cas, même si c'est un compte Google, vous devez avoir configuré un mot de passe de sécurité dans la section 'Sécurité du compte' ci-dessus pour pouvoir valider cette étape.
                  </p>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setDeleteStep(1)}
                    className="flex-1 py-2.5 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-white text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Install PWA Modal */}
      <InstallPwaModal 
        isOpen={showInstallPwaModal} 
        onClose={() => setShowInstallPwaModal(false)} 
      />
    </div>
  );
}
