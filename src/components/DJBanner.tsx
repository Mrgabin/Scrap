import React from "react";
import { Sparkles, Radio, RefreshCw, AlertCircle, Clock, Disc, ShieldCheck, Compass, Flame } from "lucide-react";
import { Track } from "../types";

interface DJBannerProps {
  isDJActive: boolean;
  timeSlotName: string;
  timeSlotDesc?: string;
  userHour: number;
  currentTrack: Track | null;
  speechText: string;
  isSpeaking: boolean;
  consecutiveSkips: number;
  onStartDJ: () => void;
  onChangeMood: () => void;
  onSoftReset: () => void;
  isLoading: boolean;
}

export default function DJBanner({
  isDJActive,
  timeSlotName,
  timeSlotDesc,
  userHour,
  currentTrack,
  speechText,
  isSpeaking,
  consecutiveSkips,
  onStartDJ,
  onChangeMood,
  onSoftReset,
  isLoading
}: DJBannerProps) {
  if (!isDJActive) {
    return (
      <div 
        onClick={onStartDJ}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c2f6d] via-[#103a82] to-[#040f26] p-5 md:p-6 cursor-pointer group border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-2xl mb-8"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0 group-hover:scale-105 transition-transform duration-300 relative">
              <Radio className="w-7 h-7 text-black" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] bg-[#1DB954]/10 px-2 py-0.5 rounded-full border border-[#1DB954]/20">
                  IA Gemini 2.5 Flash
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Règle Cadence 3:1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mt-1 group-hover:text-[#1DB954] transition-colors">
                Lancer le DJ Personnel AI 🎧
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
                Session intelligente adaptée à l'heure ({userHour}h - {timeSlotName || "Routine"}), enchaînements fluides BPM & feedback en temps réel.
              </p>
            </div>
          </div>

          <button 
            type="button"
            className="self-start md:self-auto bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs px-5 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 shrink-0 group-hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            Lancer la Session DJ
          </button>
        </div>
      </div>
    );
  }

  const getCadenceBadge = (type?: string) => {
    if (type === "security") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Valeur Sûre
        </span>
      );
    }
    if (type === "safe_discovery") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2.5 py-1 rounded-full">
          <Compass className="w-3 h-3 text-sky-400" />
          Découverte Sûre
        </span>
      );
    }
    if (type === "bold_discovery") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full">
          <Flame className="w-3 h-3 text-amber-400" />
          Découverte Audacieuse
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-full">
        <Sparkles className="w-3 h-3 text-purple-400" />
        Sélection DJ
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#091e42] via-[#0d2856] to-[#040f26] p-5 md:p-6 border border-blue-500/30 shadow-2xl mb-8 animate-fade-in">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1DB954] text-black flex items-center justify-center font-black text-xs shadow-md animate-pulse">
            DJ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm md:text-base text-white">Scrap DJ en direct</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-blue-200 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-[#1DB954]" />
              Ambiance {userHour}h : <strong className="text-white">{timeSlotName}</strong> {timeSlotDesc ? `— ${timeSlotDesc}` : ""}
            </p>
          </div>
        </div>

        {/* Quick DJ Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onChangeMood}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-3.5 py-2 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Changer le registre ou le style musical immédiatement"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1DB954] ${isLoading ? "animate-spin" : ""}`} />
            Changer de Mood 🎧
          </button>

          {consecutiveSkips >= 2 && (
            <button
              type="button"
              onClick={onSoftReset}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-extrabold text-xs px-3 py-2 rounded-full border border-red-500/30 transition-all"
              title="Ré-ancrer la session sur vos morceaux préférés"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              Soft Reset
            </button>
          )}
        </div>
      </div>

      {/* AI Voice / Commentary Bubble */}
      {speechText && (
        <div className="mb-4 bg-black/40 backdrop-blur-md rounded-xl p-3.5 border border-emerald-500/20 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Radio className="w-4 h-4 text-[#1DB954]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-0.5">Commentaire DJ AI</p>
            <p className="text-xs md:text-sm font-semibold text-emerald-200 leading-relaxed italic">
              "{speechText}"
            </p>
          </div>
        </div>
      )}

      {/* Current Track Cadence Tag */}
      {currentTrack && (
        <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Disc className="w-4 h-4 text-neutral-400 shrink-0 animate-[spin_8s_linear_infinite]" />
            <span className="text-neutral-300 truncate">En cours : <strong className="text-white">{currentTrack.title}</strong> — {currentTrack.artist}</span>
          </div>
          <div className="shrink-0 ml-2">
            {getCadenceBadge(currentTrack.cadenceType)}
          </div>
        </div>
      )}
    </div>
  );
}
