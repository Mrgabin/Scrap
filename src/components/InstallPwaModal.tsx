import React, { useState, useEffect } from "react";
import { X, Share, PlusSquare, Smartphone, CheckCircle2, Download, ArrowUpRight } from "lucide-react";

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallPwaModal({ isOpen, onClose }: InstallPwaModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && /macintosh/.test(userAgent));
    setIsIOS(iosDevice);

    // Detect standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Capture Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header App Preview */}
        <div className="flex items-center gap-4 mb-6 pt-2">
          <img
            src="/icon.png"
            alt="Scrap App Icon"
            className="w-16 h-16 rounded-2xl shadow-lg border border-white/10 object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Scrap Music
              <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full border border-[#1DB954]/30 uppercase font-semibold">
                Web App
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Installez l'application sur votre écran d'accueil
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl p-4 text-center my-4">
            <CheckCircle2 className="w-10 h-10 text-[#1DB954] mx-auto mb-2" />
            <h3 className="font-bold text-[#1DB954]">Application déjà installée !</h3>
            <p className="text-xs text-neutral-300 mt-1">
              Vous utilisez déjà Scrap en mode application autonome sur votre écran d'accueil.
            </p>
          </div>
        ) : installedSuccess ? (
          <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl p-4 text-center my-4">
            <CheckCircle2 className="w-10 h-10 text-[#1DB954] mx-auto mb-2 animate-bounce" />
            <h3 className="font-bold text-[#1DB954]">Installation réussie !</h3>
            <p className="text-xs text-neutral-300 mt-1">
              L'icône Scrap a été ajoutée sur votre écran d'accueil.
            </p>
          </div>
        ) : isIOS ? (
          /* Instructions iOS Safari */
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-neutral-300">
              <span className="font-semibold text-white">Sur iOS (iPhone / iPad) :</span> Safari ne permet pas l'installation automatique en 1 clic. Suivez ces 3 étapes simples :
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-white flex items-center gap-1.5">
                    Appuyez sur le bouton Partager <Share className="w-4 h-4 text-blue-400 inline" />
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Situé dans le menu en bas ou en haut de Safari.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-white flex items-center gap-1.5">
                    Défilez et touchez <PlusSquare className="w-4 h-4 text-neutral-200 inline" /> <span className="text-[#1DB954]">"Sur l'écran d'accueil"</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    (Ou "Add to Home Screen" en anglais).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">
                    Appuyez sur <span className="text-[#1DB954] font-bold">"Ajouter"</span> en haut à droite
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    L'icône Scrap apparaîtra sur votre écran d'accueil comme une vraie application !
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Instructions Android / Desktop Chrome */
          <div className="space-y-4">
            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Download className="w-5 h-5" />
                Installer Scrap sur l'écran d'accueil
              </button>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-neutral-300">
                  Pour installer Scrap sur Android ou Chrome :
                </div>
                <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white">Ouvrez le menu du navigateur (3 points)</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      En haut à droite de votre navigateur Chrome / Samsung Internet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white flex items-center gap-1">
                      Sélectionnez <Smartphone className="w-4 h-4 text-[#1DB954]" /> "Installer l'application" ou "Ajouter à l'écran d'accueil"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
