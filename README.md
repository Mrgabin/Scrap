# 🎵 Scrap — Player de Streaming Musical Ultra-Rapide

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

> Une expérience de streaming fluide, rapide et esthétique combinant la précision des métadonnées officielles de **Deezer** et la richesse audio-visuelle de **YouTube**, sublimée par une interface moderne aux animations soignées.

---

## ⚠️ À SAVOIR ABSOLUMENT POUR L'UTILISATION (Règles des Navigateurs)

Pour garantir une expérience d'utilisation optimale et sans frustration, veuillez prendre note du fonctionnement suivant lié aux politiques de sécurité modernes des navigateurs web :

### 🎬 Activation du Lecteur (Contrainte d'Autoplay)
Les navigateurs web modernes (Chrome, Safari, Firefox) bloquent strictement la lecture automatique de vidéos ou d'audios avec son sans qu'il y ait eu une interaction préalable explicite de l'utilisateur sur le lecteur d'origine.
* **Si la musique ne se lance pas directement** lorsque vous cliquez sur le bouton de lecture vert d'une chanson, **il vous suffit de cliquer/tapoter une seule fois directement sur le petit encadré vidéo du lecteur** (situé généralement en bas à droite de l'écran).
* Cette interaction unique débloque l'autorisation de lecture du navigateur pour toute votre session de navigation.

### 🛡️ Environnement Iframe & Bac à Sable (Sandbox)
Lorsque l'application tourne à l'intérieur d'un bac à sable ou d'une iframe (comme l'aperçu par défaut d'AI Studio), certaines fonctions matérielles comme le réglage du volume externe ou le plein écran peuvent être restreintes par les règles de sécurité de l'iframe. Pour une expérience 100% immersive, **nous vous recommandons d'ouvrir l'application dans un nouvel onglet autonome** !

---

## 📸 Aperçu & Esthétique Visuelle

L'interface a été conçue pour offrir un confort visuel optimal de jour comme de nuit :

<div align="center">
  <img src="https://i.pinimg.com/736x/ac/87/26/ac87267d9fc724c53d40cb536a45290b.jpg" alt="scrap Visual Concept" width="85%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</div>

* **Thèmes Stellaires Multiples** : Voyagez entre l'arrière-plan interactif *Black Hole* (Trou Noir quantique), *Stable Singularity* (Singularité gravitationnelle apaisée), *Tectonic Lava* (Ambiance chaleureuse magmatique) et *Quantum Core* (Noyau technologique en mouvement).
* **Profils d'Artistes Dynamiques** : Chaque artiste possède un profil unique générant en temps réel sa photo de couverture officielle, sa bannière de chaîne de concert et son nombre exact d'abonnés.
* **Intégration d'Avatars Unsplash Déterministes** : Si une photo officielle manque temporairement, un système d'empreinte numérique calcule un avatar artistique unique, parfaitement coordonné avec le style musical de l'artiste.

---

## 🛠️ Architecture Technique & "Réorientation Musicale"

L'un des défis majeurs de l'application était d'offrir un chargement instantané des pages d'artistes sans temps d'attente. Voici comment nous y sommes parvenus :

### 🚀 La Technique de "Résolution Musicale On-The-Fly"
Auparavant, afficher la liste des 40 titres populaires d'un artiste nécessitait de faire 40 requêtes lourdes vers YouTube pour obtenir l'adresse vidéo de chaque morceau avant même d'afficher la page. Cela prenait parfois plus de 8 secondes !

Nous avons mis au point un système de **résolution au clic (On-The-Fly)** :
1. **Affichage Flash** : Dès que vous ouvrez un artiste, le serveur Express interroge instantanément Deezer pour récupérer en moins de 150ms les titres phares, les durées des morceaux, et les jaquettes d'albums.
2. **Génération de Métadonnées Légères** : L'interface affiche immédiatement les titres populaires complets avec leurs miniatures, leurs nombres de vues simulés de façon réaliste, et leurs minutages exacts. **Aucun chargement n'est bloqué !**
3. **Résolution Ciblée** : Ce n'est **que lorsque vous cliquez sur Play** qu'une requête ultra-rapide `/api/resolve-track` est envoyée en arrière-plan pour obtenir instantanément l'ID YouTube du morceau sélectionné et l'injecter dynamiquement dans le flux du lecteur. La musique se lance ainsi sans aucune sensation de latence !

### 💾 Système de Cache Hybride (Node.js & Client)
Pour éviter de saturer les quotas d'API tiers et garantir un service ultra-stable :
* Le serveur intègre un cache en mémoire vive (RAM) qui conserve les profils, les bannières scrapées et les albums d'artistes pendant plusieurs heures.
* Le client React intègre son propre cache d'état pour éviter les requêtes redondantes lorsque vous naviguez fréquemment d'un artiste à un autre.

---

## 🔌 Les API utilisées

Le projet exploite le meilleur des services connectés pour créer une synergie parfaite :

1. **API Deezer (Metadata Engine)** : Fournit l'accès à l'arbre complet de la musique mondiale (noms réels des chansons, métadonnées de discographies chronologiques complètes, couvertures d'albums HD).
2. **Scraper & API YouTube (Audio & Video Engine)** : Utilisé pour extraire dynamiquement les bannières de chaînes officielles des artistes, leur nombre d'abonnés en temps réel, et assurer le flux audio des pistes musicales.
3. **Firebase Auth & Firestore** : Gère l'inscription, la connexion sécurisée des utilisateurs, la synchronisation temps réel des playlists personnalisées, de l'historique d'écoute, et des morceaux favoris.

---

## ⏱️ Temps de Développement & Passion du Code

Ce projet a été réalisé en environ **36 heures de développement intensif**. 
Chaque brique a été posée avec un souci constant du détail :
* **Premières 12 heures** : Mise en place de l'infrastructure Express + Vite + TypeScript, intégration de la passerelle du lecteur YouTube et de l'authentification Firebase.
* **Heures 12 à 24** : Conception graphique avec Tailwind CSS, programmation des 4 modes d'arrière-plans quantiques interactifs animés en WebGL et canvas CSS, et création de la structure de navigation fluide (Sidebar / Recherche / Bibliothèque).
* **Heures 24 à 36 (Optimisation de pointe)** : Remplacement du chargement synchrone par notre algorithme de **Résolution Musicale On-The-Fly**, développement du système de scraping résilient de bannières YouTube avec contournement intelligent des timeouts réseau, et phase finale de polissage des micro-interactions.

---

## 📦 Installation & Démarrage Local

Vous souhaitez faire tourner BeatStream sur votre machine ? C'est très simple !

### Prérequis
* Node.js (Version 18 ou supérieure recommandée)
* Un projet Firebase (optionnel si vous utilisez la persistence locale fallback automatique)

### Étape 1 : Cloner le dépôt
```bash
git clone https://github.com/votre-compte/beatstream.git
cd beatstream
```

### Étape 2 : Installer les dépendances
```bash
npm install
```

### Étape 3 : Configurer l'environnement
Copiez le fichier exemple et remplissez vos variables si vous souhaitez connecter votre propre base de données :
```bash
cp .env.example .env
```

### Étape 4 : Lancer en mode Développement
```bash
npm run dev
```
Ouvrez ensuite [http://localhost:3000](http://localhost:3000) sur votre navigateur.

---

*Fait avec passion pour redéfinir la liberté et la vitesse du streaming musical web.* 🎧
