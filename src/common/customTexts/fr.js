// Copyright (C) 2017-2026 Smart code 203358507

// Textes ajoutés à Stremio (filtres, choix du lien…), en français. Mêmes clés que en.js.

module.exports = {
    noResults: 'Aucun titre ne correspond à ces filtres',
    filters: 'Filtres', reset: 'Réinitialiser', close: 'Fermer les filtres', to: 'à', minimum: 'minimum', maximum: 'maximum',
    known: 'Sans les titres confidentiels', knownHelp: 'Moins de 100 votes IMDb (10 pour TMDB), et sur aucune plateforme',
    genres: 'Genres (un clic : inclure, deux : exclure)',
    include: 'Inclure…', exclude: 'Exclure…', without: 'sans ', remove: 'Retirer', switchState: 'Inclure ou exclure',
    unseen: 'Sans les déjà vus', mine: 'Ma liste seulement', unknownCountry: 'Sans les pays inconnus',
    unknownHelp: 'Masque les titres dont ni TMDB, ni Wikidata, ni la langue ne donnent le pays',
    save: '+ Enregistrer cette recherche', saveName: 'Nom de la recherche', ok: 'OK', forget: 'Oublier',
    scores: 'Autres notes : TMDB, Rotten Tomatoes, Metacritic…', hideScores: 'Masquer les autres notes',
    source: 'Source', any: 'Peu importe', atLeast: (n) => `${n} et plus`,
    titles: (n, shown) => `${shown} titre${n > 1 ? 's' : ''}`,
    sources: { catalog: 'Ce catalogue', sources: 'Toutes les sources', all: 'Tout', foryou: 'Pour toi' },
    sorts: { rating: 'Meilleure note IMDb', average: 'Moyenne des notes', votes: 'Popularité', year: 'Plus récents', year_asc: 'Plus anciens', foryou: 'Pour toi d’abord' },
    scoreSort: (name) => `Note ${name}`,
    genreModes: { all: 'tous à la fois', any: 'au moins un' },
    genreStates: { in: 'inclus', out: 'exclu', none: 'indifférent' },
    fields: {
        rating: 'Note IMDb', year: 'Année', runtime: 'Durée (minutes)', votes: 'Nombre de votes', countries: 'Pays',
        languages: 'Langue originale', places: 'Disponible sur', links: 'Liens trouvés', sort: 'Tri', genres: 'Genres',
    },
    scoreNames: {
        tmdb: 'TMDB', tomatoes: 'Rotten Tomatoes', popcorn: 'Rotten Tomatoes (public)', metacritic: 'Metacritic',
        metacriticuser: 'Metacritic (public)', trakt: 'Trakt', letterboxd: 'Letterboxd',
    },
    genreNames: {
        Action: 'Action', Adventure: 'Aventure', Animation: 'Animation', Biography: 'Biographie', Comedy: 'Comédie', Crime: 'Policier',
        Documentary: 'Documentaire', Drama: 'Drame', Family: 'Famille', Fantasy: 'Fantastique', 'Film-Noir': 'Film noir',
        'Game-Show': 'Jeu télévisé', History: 'Histoire', Horror: 'Horreur', Music: 'Musique', Musical: 'Comédie musicale',
        Mystery: 'Mystère', News: 'Actualités', 'Reality-TV': 'Téléréalité', Romance: 'Romance', 'Sci-Fi': 'Science-fiction',
        Sport: 'Sport', 'Talk-Show': 'Talk-show', Thriller: 'Thriller', War: 'Guerre', Western: 'Western',
    },
    cached: ', en cache',
    summary: {
        ratingFrom: (a) => `Note ${a} et plus`, ratingUpTo: (b) => `Note ${b} au plus`, ratingBetween: (a, b) => `Note ${a} à ${b}`,
        votes: (n) => `${n} votes et plus`,
        yearFrom: (a) => `depuis ${a}`, yearUpTo: (b) => `jusqu’à ${b}`, yearBetween: (a, b) => `${a} à ${b}`,
        runtimeFrom: (a) => `${a} min et plus`, runtimeUpTo: (b) => `${b} min au plus`, runtimeBetween: (a, b) => `${a} à ${b} min`,
        knownCountry: 'pays connu', unseen: 'pas vus', mine: 'ma liste', links: (name) => `Liens ${name}`,
        score: (name, n) => `${name} ${n} et plus`,
    },
    searchRows: { movie: 'Films (titres français et originaux)', series: 'Séries (titres français et originaux)' },
    links: {
        audio: 'Audio', subs: 'Sous-titres', quality: 'Qualité', size: 'Taille', menuValue: (label, value) => `${label} : ${value}`,
        anyAudio: 'Toutes les langues', anySubs: 'Tous les sous-titres', anyQuality: 'Toutes les qualités', anySize: 'Toutes les tailles',
        sizeAtMost: (n) => `${n} Go au plus`, gb: 'Go', mb: 'Mo',
        ready: 'Prêts à lire', readyHelp: 'Cache les liens à télécharger d’abord (⏳, [RD download])',
        maybe: 'MULTi et incertains', maybeHelp: 'MULTi peut contenir la langue ; les drapeaux mélangent audio et sous-titres',
        verify: (n) => `Vérifier les pistes (${n})`, verifying: (done, total) => `Vérification ${done} / ${total}…`,
        verifyHelp: 'Lit les vraies pistes audio et sous-titres des liens Real-Debrid en cache affichés (15 au plus). Comme une lecture, chaque torrent vérifié s’ajoute à ta liste Real-Debrid.',
        twin: 'Autre numéro IMDb', twinHelp: 'Ce titre existe aussi sous un autre numéro IMDb ; les sources y ont parfois d’autres liens',
        count: (shown, total) => `${shown} / ${total} liens`,
        wrong: 'Autre titre ?', wrongHelp: 'Le nom du fichier ne ressemble pas à ce titre',
        open: 'Ouvrir dans Stremio', openHelp: 'Ouvre cette fiche dans l’appli Stremio (lecteur complet)',
        noneReady: (language) => language ? `Aucun lien prêt à lire en ${language}.` : 'Aucun lien prêt à lire.',
        relax: {
            maybe: (n) => `Voir ${n} MULTi ou incertain${n > 1 ? 's' : ''}`,
            sizes: (n) => `Voir ${n} d’une autre qualité ou taille`,
            languages: (n) => `Voir ${n} dans une autre langue`,
            later: (n) => `Voir ${n} à télécharger d’abord`,
        },
        sections: { ready: 'Prêts à lire', later: 'À télécharger d’abord', external: 'Sur d’autres sites' },
    },
    // Étiquette de langue d'un lien : VF et VOSTFR pour le français, comme les sources françaises l'écrivent.
    badges: {
        dubbed: (lang) => lang === 'fr' ? 'VF' : lang.toUpperCase(),
        subbed: (lang) => lang === 'fr' ? 'VOSTFR' : `ST ${lang.toUpperCase()}`,
        subs: 'ST',
    },
};
