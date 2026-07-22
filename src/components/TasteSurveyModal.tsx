import React, { useState } from "react";
import { Music, Check, ArrowRight, ArrowLeft, Sparkles, Activity, Calendar, Smile, Globe } from "lucide-react";
import { useTranslation, Language } from "../lib/LanguageContext";

interface TasteSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: any) => void;
  isGuest?: boolean;
}

const GENRES = [
  { id: "rap", name: "Rap / Hip-Hop", icon: "🎤", desc: "Mots tranchants, beats puissants" },
  { id: "pop", name: "Pop", icon: "🌸", desc: "Mélodies colorées, hits mondiaux" },
  { id: "rock", name: "Rock / Indie", icon: "🎸", desc: "Guitares saturées, énergie brute" },
  { id: "electro", name: "Electro / EDM", icon: "⚡️", desc: "Basses lourdes, rythmes de club" },
  { id: "french", name: "Variété Française", icon: "🇫🇷", desc: "Belles paroles, mélodies d'ici" },
  { id: "rnb", name: "R&B / Soul", icon: "🍇", desc: "Voix sensuelles, grooves profonds" },
  { id: "lofi", name: "Lo-Fi / Relax", icon: "☕️", desc: "Ambiance calme, idéal pour étudier" },
  { id: "metal", name: "Metal / Hardcore", icon: "🤘", desc: "Puissance extrême, double pédale" },
  { id: "jazz", name: "Jazz / Blues", icon: "🎷", desc: "Improvisations, notes feutrées" },
  { id: "country", name: "Country / Folk", icon: "🤠", desc: "Ballades guitare-voix, récits de vie" }
];

const MOODS = [
  { id: "triste", name: "Mélancolique / Triste", icon: "😢", desc: "Pour les jours de pluie ou de réflexion" },
  { id: "energetique", name: "Énergique / Motivant", icon: "🔥", desc: "Pour faire du sport ou se motiver" },
  { id: "calme", name: "Calme / Détente", icon: "🧘", desc: "Se relaxer, méditer, se déconnecter" },
  { id: "concentre", name: "Concentré / Focus", icon: "🧠", desc: "Un fond sonore parfait pour travailler" }
];

const TEMPOS = [
  { id: "lent", name: "Lent & Apaisant", icon: "🍃", desc: "Prendre son temps, souffler" },
  { id: "modere", name: "Modéré & Équilibré", icon: "⏱️", desc: "Le juste milieu pour toute la journée" },
  { id: "rapide", name: "Rapide & Énergique", icon: "⚡️", desc: "Rythme cardiaque à 120+ BPM" }
];

const EPOCHS = [
  { id: "retro", name: "Années 70 / 80", icon: "📻", desc: "Disco, Classic Rock, Synthpop vintage" },
  { id: "golden", name: "Années 90 / 2000", icon: "📼", desc: "Golden Age Hip-hop, Pop Punk, Eurodance" },
  { id: "actuel", name: "Musique Actuelle", icon: "📱", desc: "Modern Trap, Synthwave, Hits d'aujourd'hui" }
];

const COUNTRIES = [
  { id: "FR", name: "France", flag: "🇫🇷" },
  { id: "BE", name: "Belgique", flag: "🇧🇪" },
  { id: "CH", name: "Suisse", flag: "🇨🇭" },
  { id: "CA", name: "Canada", flag: "🇨🇦" },
  { id: "US", name: "United States", flag: "🇺🇸" },
  { id: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { id: "Other", name: "Autre / Other", flag: "🌍" }
];

export default function TasteSurveyModal({ isOpen, onSubmit, isGuest = false }: TasteSurveyModalProps) {
  const { language, setLanguage, country, setCountry, t } = useTranslation();
  const [step, setStep] = useState(0); // 0: Intro, 1: Country & Lang, 2: Genres, 3: Moods, 4: Tempos, 5: Epochs, 6: Generating
  
  // State for survey responses
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTempo, setSelectedTempo] = useState<string>("");
  const [selectedEpochs, setSelectedEpochs] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    );
  };

  const handleToggleMood = (moodId: string) => {
    setSelectedMoods(prev =>
      prev.includes(moodId) ? prev.filter(id => id !== moodId) : [...prev, moodId]
    );
  };

  const handleSelectTempo = (tempoId: string) => {
    setSelectedTempo(tempoId);
  };

  const handleToggleEpoch = (epochId: string) => {
    setSelectedEpochs(prev =>
      prev.includes(epochId) ? prev.filter(id => id !== epochId) : [...prev, epochId]
    );
  };

  const handleNextStep = () => {
    if (step === 0) setStep(1);
    else if (step === 1 && country) setStep(2);
    else if (step === 2 && selectedGenres.length > 0) setStep(3);
    else if (step === 3 && selectedMoods.length > 0) setStep(4);
    else if (step === 4 && selectedTempo) setStep(5);
    else if (step === 5 && selectedEpochs.length > 0) {
      setStep(6);
      // Trigger submission with a beautiful loading fake delay so the user feels the algorithm "working"
      setTimeout(() => {
        onSubmit({
          country,
          language,
          genres: selectedGenres,
          moods: selectedMoods,
          tempo: selectedTempo,
          epochs: selectedEpochs,
          completedAt: new Date().toISOString()
        });
      }, 3000);
    }
  };

  const handlePrevStep = () => {
    if (step > 0 && step < 6) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 pt-safe pb-safe overflow-y-auto select-none" id="taste_survey_modal">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Progress bar */}
        {step > 0 && step < 6 && (
          <div className="w-full h-1.5 bg-neutral-900 flex">
            <div 
              className="h-full bg-gradient-to-r from-[#1DB954] to-emerald-400 transition-all duration-500 ease-out" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Header (Steps indicator) */}
        {step > 0 && step < 6 && (
          <div className="px-6 pt-5 pb-2 flex justify-between items-center text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-900">
            <span>{t("survey.title")}</span>
            <span className="text-[#1DB954] font-mono">
              {t("survey.step").replace("{current}", step.toString()).replace("{total}", "5")}
            </span>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col justify-center">
          
          {/* STEP 0: WELCOME INTRO */}
          {step === 0 && (
            <div className="text-center py-6 flex flex-col items-center animate-fade-in">
              <div className="w-16 h-16 bg-[#1DB954]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#1DB954]/20">
                <Sparkles className="w-9 h-9 text-[#1DB954] animate-pulse" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {t("survey.welcome_title")}
              </h2>
              <p className="text-sm text-neutral-400 mt-3 max-w-lg mx-auto leading-relaxed">
                {isGuest 
                  ? t("survey.welcome_desc_guest")
                  : t("survey.welcome_desc_user")
                }
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 text-left max-w-lg">
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="text-[#1DB954] font-extrabold text-lg mb-1">01.</div>
                  <div className="font-bold text-xs text-white">{t("survey.step_info_1")}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{t("survey.step_info_1_desc")}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="text-[#1DB954] font-extrabold text-lg mb-1">02.</div>
                  <div className="font-bold text-xs text-white">{t("survey.step_info_2")}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{t("survey.step_info_2_desc")}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="text-[#1DB954] font-extrabold text-lg mb-1">03.</div>
                  <div className="font-bold text-xs text-white">{t("survey.step_info_3")}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{t("survey.step_info_3_desc")}</div>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="mt-8 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold rounded-full px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-[#1DB954]/25 transition-all hover:scale-105 active:scale-95"
              >
                {t("survey.btn_start")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 1: COUNTRY & LANGUAGE SELECTION */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Globe className="w-5 h-5 text-[#1DB954]" />
                  <h3 className="text-xl font-bold md:text-2xl">{t("survey.country_title")}</h3>
                </div>
                <p className="text-xs text-neutral-400">{t("survey.country_desc")}</p>
              </div>

              <div className="space-y-6">
                {/* Language Select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                    {t("survey.lang_label")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setLanguage("fr")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        language === "fr"
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white"
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl select-none">🇫🇷</span>
                        <span className="font-bold text-sm">Français</span>
                      </div>
                      {language === "fr" && <Check className="w-4 h-4 text-[#1DB954]" />}
                    </div>

                    <div
                      onClick={() => setLanguage("en")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        language === "en"
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white"
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl select-none">🇬🇧</span>
                        <span className="font-bold text-sm">English</span>
                      </div>
                      {language === "en" && <Check className="w-4 h-4 text-[#1DB954]" />}
                    </div>
                  </div>
                </div>

                {/* Country Select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                    {t("survey.country_label")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[30vh] overflow-y-auto pr-1">
                    {COUNTRIES.map((c) => {
                      const isSelected = country === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setCountry(c.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#1DB954]/10 border-[#1DB954] text-white"
                              : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0 select-none">{c.flag}</span>
                            <span className="font-bold text-xs truncate">{c.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GENRES SELECTION */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Music className="w-5 h-5 text-[#1DB954]" />
                  <h3 className="text-xl font-bold md:text-2xl">{t("survey.genre_title")}</h3>
                </div>
                <p className="text-xs text-neutral-400">{t("survey.genre_desc")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto pr-2 custom-scrollbar">
                {GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleToggleGenre(g.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white" 
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 select-none">{g.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{g.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{g.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1DB954] border-[#1DB954] text-black" : "border-neutral-700 text-transparent"
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: MOODS SELECTION */}
          {step === 3 && (
            <div className="animate-fade-in flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Smile className="w-5 h-5 text-[#1DB954]" />
                  <h3 className="text-xl font-bold md:text-2xl">{t("survey.mood_title")}</h3>
                </div>
                <p className="text-xs text-neutral-400">{t("survey.mood_desc")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto">
                {MOODS.map((m) => {
                  const isSelected = selectedMoods.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMood(m.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white" 
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-3xl shrink-0 select-none">{m.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{m.name}</p>
                          <p className="text-[10px] text-neutral-500 leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1DB954] border-[#1DB954] text-black" : "border-neutral-700 text-transparent"
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: TEMPO SELECTION */}
          {step === 4 && (
            <div className="animate-fade-in flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Activity className="w-5 h-5 text-[#1DB954]" />
                  <h3 className="text-xl font-bold md:text-2xl">{t("survey.tempo_title")}</h3>
                </div>
                <p className="text-xs text-neutral-400">{t("survey.tempo_desc")}</p>
              </div>

              <div className="space-y-3">
                {TEMPOS.map((tItem) => {
                  const isSelected = selectedTempo === tItem.id;
                  return (
                    <div
                      key={tItem.id}
                      onClick={() => handleSelectTempo(tItem.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white" 
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-3xl shrink-0 select-none">{tItem.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{tItem.name}</p>
                          <p className="text-[10px] text-neutral-500 leading-relaxed">{tItem.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1DB954] border-[#1DB954]" : "border-neutral-700"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: EPOCH SELECTION */}
          {step === 5 && (
            <div className="animate-fade-in flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Calendar className="w-5 h-5 text-[#1DB954]" />
                  <h3 className="text-xl font-bold md:text-2xl">{t("survey.epoch_title")}</h3>
                </div>
                <p className="text-xs text-neutral-400">{t("survey.epoch_desc")}</p>
              </div>

              <div className="space-y-3">
                {EPOCHS.map((e) => {
                  const isSelected = selectedEpochs.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => handleToggleEpoch(e.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-[#1DB954]/10 border-[#1DB954] text-white" 
                          : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-3xl shrink-0 select-none">{e.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{e.name}</p>
                          <p className="text-[10px] text-neutral-500 leading-relaxed">{e.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1DB954] border-[#1DB954] text-black" : "border-neutral-700 text-transparent"
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: GENERATING LOADING PAGE */}
          {step === 6 && (
            <div className="text-center py-10 flex flex-col items-center justify-center animate-fade-in">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-neutral-800 border-t-[#1DB954] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#1DB954] animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{t("survey.analyzing")}</h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
                {t("survey.analyzing_desc")}
              </p>
              
              <div className="mt-8 flex flex-col gap-2 w-full max-w-xs text-left text-xs bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-[#1DB954]">✓</span> {t("survey.country_label")}: {COUNTRIES.find(c => c.id === country)?.name} ({language.toUpperCase()})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#1DB954]">✓</span> Genres: {selectedGenres.map(g => GENRES.find(x => x.id === g)?.name).join(", ")}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#1DB954]">✓</span> Ambiance: {selectedMoods.map(m => MOODS.find(x => x.id === m)?.name).join(", ")}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#1DB954]">✓</span> Tempo: {TEMPOS.find(tItem => tItem.id === selectedTempo)?.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 animate-pulse">⚡︎</span> Compilation...
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        {step > 0 && step < 6 && (
          <div className="p-6 bg-[#0c0c0c] border-t border-neutral-900 flex justify-between items-center shrink-0">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("survey.btn_prev")}
            </button>

            <button
              onClick={handleNextStep}
              disabled={
                (step === 1 && !country) ||
                (step === 2 && selectedGenres.length === 0) ||
                (step === 3 && selectedMoods.length === 0) ||
                (step === 4 && !selectedTempo) ||
                (step === 5 && selectedEpochs.length === 0)
              }
              className="bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold rounded-full px-6 py-2.5 flex items-center gap-1.5 transition-all active:scale-95 text-sm"
            >
              {step === 5 ? t("survey.btn_generate") : t("survey.btn_next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
