import React, { useState, useEffect } from "react";
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Music } from "lucide-react";

interface AuthViewProps {
  onGuestLogin: () => void;
}

export default function AuthView({ onGuestLogin }: AuthViewProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);

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

  if (checkingRedirect) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white font-sans select-none">
        <div className="w-20 h-20 animate-pulse mb-6 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(29,185,84,0.5)]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scrap-logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1DB954" />
                <stop offset="100%" stopColor="#1ed760" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="#0c0c14" stroke="url(#scrap-logo-grad-1)" strokeWidth="3" />
            <path d="M 65 32 C 60 25, 40 25, 35 32 C 30 40, 45 45, 55 50 C 65 55, 70 65, 65 72 C 60 80, 40 80, 35 72" stroke="url(#scrap-logo-grad-1)" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Vérification de la session Google...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4" id="auth_container">
      <div className="w-full max-w-[450px] bg-[#121212] rounded-xl p-8 md:p-12 shadow-2xl border border-[#282828]">
        
        {/* Spotify Logo Head */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 filter drop-shadow-[0_4px_16px_rgba(29,185,84,0.4)] hover:scale-105 transition-transform duration-300 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="scrap-logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1DB954" />
                  <stop offset="100%" stopColor="#1ed760" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="#0c0c14" stroke="url(#scrap-logo-grad-2)" strokeWidth="3" />
              <path d="M 65 32 C 60 25, 40 25, 35 32 C 30 40, 45 45, 55 50 C 65 55, 70 65, 65 72 C 60 80, 40 80, 35 72" stroke="url(#scrap-logo-grad-2)" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-1">
            Scrap<span className="text-[#1DB954] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 ml-2">APP</span>
          </h1>
          <p className="text-xs text-[#b3b3b3] mt-2 text-center">
            Moteur de recherche & audio propulsé par YouTube Music
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Google Sign-In Button */}
          <button
            id="google_signin_btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-full py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm shadow-md"
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
            Se connecter avec Google
          </button>

          {/* Guest Session Button */}
          <button
            id="guest_signin_btn"
            onClick={onGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-full py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-neutral-800 text-sm shadow-md"
          >
            <Music className="w-4 h-4 text-[#1DB954]" />
            Continuer en tant qu'invité (sans compte)
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#535353] leading-relaxed">
            Pour sauvegarder vos playlists et vos favoris en ligne, connectez-vous avec votre compte Google.
            Le mode invité enregistre vos données localement sur cet appareil.
          </p>
        </div>

      </div>
    </div>
  );
}
