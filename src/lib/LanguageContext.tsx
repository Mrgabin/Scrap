import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "fr" | "en";

export interface LanguageContextType {
  language: Language;
  country: string;
  setLanguage: (lang: Language) => void;
  setCountry: (country: string) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Sidebar
    "sidebar.home": "Accueil",
    "sidebar.search": "Rechercher",
    "sidebar.library": "Bibliothèque",
    "sidebar.create_playlist": "Créer une playlist",
    "sidebar.liked_songs": "Titres likés",
    "sidebar.followed_artists": "Artistes suivis",
    "sidebar.guest_mode": "Mode Invité",
    "sidebar.logout": "Se déconnecter",
    "sidebar.login": "Se connecter",

    // HomeView
    "home.morning": "Bon matin 🌅",
    "home.afternoon": "Bon après-midi ☀️",
    "home.evening": "Bonsoir 🌃",
    "home.night": "Bonne nuit 🌙",
    "home.mixes_title": "Vos Mixs Algorithmiques Persos ⚡️",
    "home.mixes_desc": "3 playlists sur-mesure de 25 titres chacune, actualisées selon vos goûts & historique.",
    "home.update_mixes": "Mettre à jour les mixes",
    "home.no_mixes_title": "Vos mixes personnalisés vous attendent !",
    "home.no_mixes_desc": "Scrap peut composer 3 playlists hebdomadaires de 25 titres uniques en analysant vos genres musicaux favoris et vos rythmes de prédilection.",
    "home.start_survey": "Lancer le test de goûts ⚡️",
    "home.exclusive": "Exclusivité Scrap",
    "home.trending": "Tendances Actuelles (Charts)",
    "home.trending_desc": "Les morceaux populaires du moment.",
    "home.new_releases": "Nouveautés",
    "home.new_releases_desc": "Les dernières sorties musicales.",
    "home.ambient": "Suggestions d'ambiance",
    "home.ambient_desc": "Pour se détendre et s'évader.",
    "home.retro": "Retro & Synthwave Essentials",
    "home.retro_desc": "Ambiance vintage et néon.",

    // ArtistView
    "artist.verified": "Artiste Certifié",
    "artist.followers": "Abonnés (Followers)",
    "artist.listeners": "Auditeurs mensuels",
    "artist.world_rank": "Classement Mondial",
    "artist.streams": "Écoutes cumulées",
    "artist.popular_cities": "Principales villes d'écoute",
    "artist.popular": "Populaires",
    "artist.about": "À Propos de l'artiste",
    "artist.real_stats": "Statistiques réelles (Spotify)",
    "artist.fans_like": "Les fans aiment aussi",
    "artist.similar": "Artiste similaire",
    "artist.follow": "S'abonner",
    "artist.unfollow": "Abonné",
    "artist.discography": "Discographie (Albums)",
    "artist.tracks_count": "titres",

    // SearchView
    "search.placeholder": "Que voulez-vous écouter ?",
    "search.title": "Rechercher",
    "search.recent": "Recherches récentes",
    "search.clear": "Effacer",
    "search.no_results": "Aucun résultat trouvé pour votre recherche.",
    "search.categories": "Parcourir tout",
    "search.table_title": "Titre",
    "search.table_artist": "Artiste / Chaîne",
    "search.add_to_playlist": "Ajouter à la playlist",
    "search.no_playlist": "Aucune playlist disponible.",
    "search.browse_all": "Parcourir tout",
    "search.results": "Meilleurs résultats",
    "search.btn": "Rechercher",

    // PlaylistView
    "playlist.by": "Par",
    "playlist.songs": "titres",
    "playlist.play": "Lecture",
    "playlist.add_queue": "Ajouter à la file",
    "playlist.added_success": "Ajouté avec succès !",
    "playlist.import_yt": "Importer une playlist YouTube",
    "playlist.import_placeholder": "Collez l'URL de la playlist YouTube ici...",
    "playlist.import_btn": "Importer",

    // TasteSurvey
    "survey.title": "Questionnaire de goûts Scrap",
    "survey.step": "Étape {current} sur {total}",
    "survey.welcome_title": "Générez vos 3 playlists hebdomadaires sur-mesure ! ⚡️",
    "survey.welcome_desc_guest": "En tant qu'invité, découvrez la puissance de notre algorithme d'analyse musicale. Répondez à quelques questions pour que Scrap crée 3 playlists hebdomadaires ultra-personnalisées de 25 titres chacune !",
    "survey.welcome_desc_user": "Définissons votre profil musical. Notre algorithme analysera vos choix ainsi que votre historique pour vous composer 3 playlists thématiques uniques de 25 titres, actualisées en temps réel.",
    "survey.step_info_1": "Questionnaire Rapide",
    "survey.step_info_1_desc": "Pays, langue, genres, humeur, tempo & décennies favorites.",
    "survey.step_info_2": "Algorithme Scrap",
    "survey.step_info_2_desc": "Mix intelligent basé sur vos réponses & écoutes.",
    "survey.step_info_3": "3 Mixs de 25 Titres",
    "survey.step_info_3_desc": "Mis à jour chaque semaine automatiquement !",
    "survey.btn_start": "Commencer le test de goûts",
    "survey.btn_next": "Continuer",
    "survey.btn_prev": "Retour",
    "survey.btn_generate": "Générer mes playlists",
    "survey.genre_title": "Quels sont vos genres de musique préférés ?",
    "survey.genre_desc": "Sélectionnez au moins un genre musical (plusieurs choix recommandés).",
    "survey.mood_title": "Quelle humeur d'écoute vous correspond le plus ?",
    "survey.mood_desc": "Sélectionnez une ou plusieurs humeurs pour vos playlists thématiques.",
    "survey.tempo_title": "Quel rythme musical préférez-vous ?",
    "survey.tempo_desc": "Sélectionnez le tempo de prédilection de votre vie quotidienne.",
    "survey.epoch_title": "De quelle décennie musicale vous sentez-vous le plus proche ?",
    "survey.epoch_desc": "Sélectionnez au moins une époque pour guider la variété temporelle de vos mixes.",
    "survey.country_title": "Quel est votre pays de résidence et langue préférée ?",
    "survey.country_desc": "Ces informations permettent de prioriser les artistes locaux dans vos recherches et d'adapter l'application.",
    "survey.country_label": "Pays de résidence",
    "survey.lang_label": "Langue d'affichage",
    "survey.analyzing": "Analyse de vos préférences en cours...",
    "survey.analyzing_desc": "Notre algorithme d'intelligence musicale Scrap assemble vos 3 playlists hebdomadaires personnalisées basées sur vos genres préférés et vos humeurs d'écoute."
  },
  en: {
    // Sidebar
    "sidebar.home": "Home",
    "sidebar.search": "Search",
    "sidebar.library": "Your Library",
    "sidebar.create_playlist": "Create Playlist",
    "sidebar.liked_songs": "Liked Songs",
    "sidebar.followed_artists": "Followed Artists",
    "sidebar.guest_mode": "Guest Mode",
    "sidebar.logout": "Log out",
    "sidebar.login": "Log in",

    // HomeView
    "home.morning": "Good morning 🌅",
    "home.afternoon": "Good afternoon ☀️",
    "home.evening": "Good evening 🌃",
    "home.night": "Good night 🌙",
    "home.mixes_title": "Your Personal Algorithmic Mixes ⚡️",
    "home.mixes_desc": "3 customized playlists of 25 tracks each, updated based on your tastes & history.",
    "home.update_mixes": "Update my mixes",
    "home.no_mixes_title": "Your personalized mixes are waiting!",
    "home.no_mixes_desc": "Scrap can compose 3 weekly playlists of 25 unique tracks by analyzing your favorite genres and preferred rhythms.",
    "home.start_survey": "Start Tastes Survey ⚡️",
    "home.exclusive": "Scrap Exclusive",
    "home.trending": "Current Trends (Charts)",
    "home.trending_desc": "Popular tracks of the moment.",
    "home.new_releases": "New Releases",
    "home.new_releases_desc": "The latest music releases.",
    "home.ambient": "Ambient Suggestions",
    "home.ambient_desc": "To relax and wander away.",
    "home.retro": "Retro & Synthwave Essentials",
    "home.retro_desc": "Vintage vibes and neon glow.",

    // ArtistView
    "artist.verified": "Verified Artist",
    "artist.followers": "Followers",
    "artist.listeners": "Monthly listeners",
    "artist.world_rank": "World Rank",
    "artist.streams": "Total streams",
    "artist.popular_cities": "Popular listening cities",
    "artist.popular": "Popular Tracks",
    "artist.about": "About the Artist",
    "artist.real_stats": "Real Stats (Spotify)",
    "artist.fans_like": "Fans also like",
    "artist.similar": "Similar Artist",
    "artist.follow": "Follow",
    "artist.unfollow": "Following",
    "artist.discography": "Discography (Albums)",
    "artist.tracks_count": "tracks",

    // SearchView
    "search.placeholder": "What do you want to listen to?",
    "search.title": "Search",
    "search.recent": "Recent searches",
    "search.clear": "Clear",
    "search.no_results": "No results found for your search.",
    "search.categories": "Browse All",
    "search.table_title": "Title",
    "search.table_artist": "Artist / Channel",
    "search.add_to_playlist": "Add to playlist",
    "search.no_playlist": "No playlists available.",
    "search.browse_all": "Browse All",
    "search.results": "Top results",
    "search.btn": "Search",

    // PlaylistView
    "playlist.by": "By",
    "playlist.songs": "tracks",
    "playlist.play": "Play",
    "playlist.add_queue": "Add to queue",
    "playlist.added_success": "Successfully added!",
    "playlist.import_yt": "Import YouTube Playlist",
    "playlist.import_placeholder": "Paste YouTube playlist URL here...",
    "playlist.import_btn": "Import",

    // TasteSurvey
    "survey.title": "Scrap Taste Survey",
    "survey.step": "Step {current} of {total}",
    "survey.welcome_title": "Generate your 3 weekly custom playlists! ⚡️",
    "survey.welcome_desc_guest": "As a guest, experience the power of our music analysis algorithm. Answer a few questions and let Scrap build 3 ultra-personalized weekly playlists of 25 tracks each!",
    "survey.welcome_desc_user": "Let's define your musical profile. Our algorithm will analyze your choices and listening history to compose 3 unique thematic playlists of 25 tracks, updated in real time.",
    "survey.step_info_1": "Quick Survey",
    "survey.step_info_1_desc": "Country, language, genres, mood, tempo & favorite eras.",
    "survey.step_info_2": "Scrap Algorithm",
    "survey.step_info_2_desc": "Smart mix based on your preferences & listens.",
    "survey.step_info_3": "3 Mixes of 25 Tracks",
    "survey.step_info_3_desc": "Updated automatically every single week!",
    "survey.btn_start": "Start Taste Survey",
    "survey.btn_next": "Continue",
    "survey.btn_prev": "Back",
    "survey.btn_generate": "Generate my playlists",
    "survey.genre_title": "What are your favorite music genres?",
    "survey.genre_desc": "Select at least one genre (multiple choices recommended).",
    "survey.mood_title": "Which listening mood matches you best?",
    "survey.mood_desc": "Select one or more moods for your themed playlists.",
    "survey.tempo_title": "What musical tempo do you prefer?",
    "survey.tempo_desc": "Select your preferred tempo for your daily life.",
    "survey.epoch_title": "Which musical era do you feel closest to?",
    "survey.epoch_desc": "Select at least one era to guide the temporal variety of your mixes.",
    "survey.country_title": "What is your country of residence & language?",
    "survey.country_desc": "This information helps prioritize local artists in your searches and adapt the app's language.",
    "survey.country_label": "Country of residence",
    "survey.lang_label": "Display Language",
    "survey.analyzing": "Analyzing your preferences...",
    "survey.analyzing_desc": "Our Scrap music intelligence algorithm is assembling your 3 personalized weekly playlists based on your favorite genres and listening moods."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [country, setCountryState] = useState<string>("FR");

  useEffect(() => {
    // 1. Check local storage
    const storedLang = localStorage.getItem("scrap_language") as Language | null;
    const storedCountry = localStorage.getItem("scrap_country");

    if (storedLang === "fr" || storedLang === "en") {
      setLanguageState(storedLang);
    } else {
      // 2. Auto-detect from browser
      const browserLang = navigator.language || "";
      if (browserLang.toLowerCase().startsWith("fr")) {
        setLanguageState("fr");
      } else {
        setLanguageState("en");
      }
    }

    if (storedCountry) {
      setCountryState(storedCountry);
    } else {
      // Default to FR for French browser, otherwise US
      const browserLang = navigator.language || "";
      if (browserLang.toLowerCase().startsWith("fr")) {
        setCountryState("FR");
      } else {
        setCountryState("US");
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("scrap_language", lang);
  };

  const setCountry = (c: string) => {
    setCountryState(c);
    localStorage.setItem("scrap_country", c);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to FR dict
    const frDict = translations["fr"];
    if (frDict && frDict[key]) {
      return frDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, country, setLanguage, setCountry, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
