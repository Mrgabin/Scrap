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
          <svg viewBox="0 0 211 218" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scrap-logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1DB954" />
                <stop offset="60%" stopColor="#1aa34a" />
                <stop offset="100%" stopColor="#0d5c2a" />
              </linearGradient>
            </defs>
            <g transform="translate(0.000000,218.000000) scale(0.100000,-0.100000)" fill="url(#scrap-logo-grad-1)" stroke="none">
              <path d="M1065 1933 c-159 -127 -248 -293 -249 -468 -1 -79 3 -98 27 -150 36 -78 64 -105 232 -235 77 -59 150 -119 162 -132 60 -64 70 -187 27 -316 -26 -78 -52 -125 -34 -61 16 56 17 56 -62 43 -40 -7 -94 -10 -120 -7 -43 5 -48 4 -48 -13 0 -11 10 -40 23 -64 25 -51 54 -63 125 -53 l46 6 -21 -29 c-34 -47 -70 -76 -90 -72 -22 4 -79 96 -98 160 -7 25 -19 82 -25 125 -7 43 -14 88 -16 100 -2 12 -29 39 -61 62 -56 40 -58 40 -67 20 -17 -36 9 -253 40 -346 16 -45 25 -85 22 -89 -4 -3 -39 11 -80 32 -53 28 -97 63 -163 128 -101 102 -153 183 -192 301 -24 71 -27 96 -27 220 -1 158 9 205 74 340 35 73 110 175 130 175 4 0 1 -19 -8 -42 -8 -24 -17 -80 -20 -125 -6 -105 21 -194 88 -297 57 -85 107 -134 265 -256 66 -51 123 -99 128 -106 12 -20 99 -65 115 -59 22 8 12 127 -13 156 -11 12 -81 68 -155 124 -202 153 -252 214 -286 348 -21 80 -14 186 20 293 33 101 71 167 142 243 31 34 53 61 49 61 -22 0 -129 -37 -180 -63 -86 -43 -141 -82 -218 -156 -182 -175 -269 -382 -268 -640 1 -237 88 -446 255 -614 143 -143 320 -228 508 -243 l73 -6 60 44 c208 154 313 473 221 673 -34 75 -92 134 -241 245 -71 54 -140 108 -152 121 -71 78 -70 217 4 363 29 57 131 166 156 166 20 0 81 -91 103 -153 8 -23 18 -78 21 -122 l6 -81 66 -47 66 -47 3 57 c4 79 -14 207 -38 271 -27 71 -26 75 16 57 98 -41 247 -178 313 -288 136 -229 147 -477 31 -712 -41 -85 -135 -214 -146 -203 -2 2 8 39 21 81 44 137 31 272 -37 414 -40 83 -146 193 -300 311 -91 70 -109 89 -119 123 -19 62 -99 95 -115 47 -12 -38 -8 -127 7 -155 8 -14 68 -67 134 -117 270 -203 318 -279 319 -501 0 -86 -5 -126 -23 -185 -36 -119 -100 -229 -179 -313 l-36 -37 54 16 c273 80 501 299 591 569 102 302 30 626 -191 868 -137 150 -353 259 -540 274 l-75 6 -50 -40z" />
              <path d="M1168 1726 c-20 -15 -88 -105 -88 -117 0 -5 41 -9 91 -9 69 0 90 3 87 13 -3 6 -13 35 -22 63 -18 54 -40 70 -68 50z" />
              <path d="M1453 1583 c8 -63 16 -85 38 -113 21 -25 29 -45 29 -75 0 -37 5 -45 64 -97 l63 -57 6 102 c3 70 1 112 -8 133 -21 51 -162 184 -196 184 -3 0 -1 -35 4 -77z" />
              <path d="M590 860 c0 -84 4 -129 14 -148 29 -56 185 -186 203 -168 3 2 0 38 -7 78 -10 59 -19 80 -46 111 -30 33 -34 43 -34 96 l0 58 -59 47 c-33 25 -62 46 -65 46 -3 0 -6 -54 -6 -120z" />
            </g>
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
            <svg viewBox="0 0 211 218" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="scrap-logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1DB954" />
                  <stop offset="60%" stopColor="#1aa34a" />
                  <stop offset="100%" stopColor="#0d5c2a" />
                </linearGradient>
              </defs>
              <g transform="translate(0.000000,218.000000) scale(0.100000,-0.100000)" fill="url(#scrap-logo-grad-2)" stroke="none">
                <path d="M1065 1933 c-159 -127 -248 -293 -249 -468 -1 -79 3 -98 27 -150 36 -78 64 -105 232 -235 77 -59 150 -119 162 -132 60 -64 70 -187 27 -316 -26 -78 -52 -125 -34 -61 16 56 17 56 -62 43 -40 -7 -94 -10 -120 -7 -43 5 -48 4 -48 -13 0 -11 10 -40 23 -64 25 -51 54 -63 125 -53 l46 6 -21 -29 c-34 -47 -70 -76 -90 -72 -22 4 -79 96 -98 160 -7 25 -19 82 -25 125 -7 43 -14 88 -16 100 -2 12 -29 39 -61 62 -56 40 -58 40 -67 20 -17 -36 9 -253 40 -346 16 -45 25 -85 22 -89 -4 -3 -39 11 -80 32 -53 28 -97 63 -163 128 -101 102 -153 183 -192 301 -24 71 -27 96 -27 220 -1 158 9 205 74 340 35 73 110 175 130 175 4 0 1 -19 -8 -42 -8 -24 -17 -80 -20 -125 -6 -105 21 -194 88 -297 57 -85 107 -134 265 -256 66 -51 123 -99 128 -106 12 -20 99 -65 115 -59 22 8 12 127 -13 156 -11 12 -81 68 -155 124 -202 153 -252 214 -286 348 -21 80 -14 186 20 293 33 101 71 167 142 243 31 34 53 61 49 61 -22 0 -129 -37 -180 -63 -86 -43 -141 -82 -218 -156 -182 -175 -269 -382 -268 -640 1 -237 88 -446 255 -614 143 -143 320 -228 508 -243 l73 -6 60 44 c208 154 313 473 221 673 -34 75 -92 134 -241 245 -71 54 -140 108 -152 121 -71 78 -70 217 4 363 29 57 131 166 156 166 20 0 81 -91 103 -153 8 -23 18 -78 21 -122 l6 -81 66 -47 66 -47 3 57 c4 79 -14 207 -38 271 -27 71 -26 75 16 57 98 -41 247 -178 313 -288 136 -229 147 -477 31 -712 -41 -85 -135 -214 -146 -203 -2 2 8 39 21 81 44 137 31 272 -37 414 -40 83 -146 193 -300 311 -91 70 -109 89 -119 123 -19 62 -99 95 -115 47 -12 -38 -8 -127 7 -155 8 -14 68 -67 134 -117 270 -203 318 -279 319 -501 0 -86 -5 -126 -23 -185 -36 -119 -100 -229 -179 -313 l-36 -37 54 16 c273 80 501 299 591 569 102 302 30 626 -191 868 -137 150 -353 259 -540 274 l-75 6 -50 -40z" />
                <path d="M1168 1726 c-20 -15 -88 -105 -88 -117 0 -5 41 -9 91 -9 69 0 90 3 87 13 -3 6 -13 35 -22 63 -18 54 -40 70 -68 50z" />
                <path d="M1453 1583 c8 -63 16 -85 38 -113 21 -25 29 -45 29 -75 0 -37 5 -45 64 -97 l63 -57 6 102 c3 70 1 112 -8 133 -21 51 -162 184 -196 184 -3 0 -1 -35 4 -77z" />
                <path d="M590 860 c0 -84 4 -129 14 -148 29 -56 185 -186 203 -168 3 2 0 38 -7 78 -10 59 -19 80 -46 111 -30 33 -34 43 -34 96 l0 58 -59 47 c-33 25 -62 46 -65 46 -3 0 -6 -54 -6 -120z" />
              </g>
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
