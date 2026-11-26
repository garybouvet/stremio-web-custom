// Copyright (C) 2017-2026 Smart code 203358507

// Textes du panneau de filtres. Interface volontairement en français seul : regroupés ici plutôt que dans stremio-translations.

const TEXTS = {
    filters: 'Filtres', reset: 'Réinitialiser', close: 'Fermer les filtres', to: 'à', known: 'Sans les titres confidentiels',
    knownHelp: 'Moins de 100 votes IMDb (10 pour TMDB), et sur aucune plateforme',
    genres: 'Genres (un clic : inclure, deux : exclure)',
    include: 'Inclure…', exclude: 'Exclure…', without: 'sans ', remove: 'Retirer', switchState: 'Inclure ou exclure',
    unseen: 'Sans les déjà vus', mine: 'Ma liste seulement', unknownCountry: 'Sans les pays inconnus',
    unknownHelp: 'Masque les titres dont ni TMDB, ni Wikidata, ni la langue ne donnent le pays',
    save: '+ Enregistrer cette recherche', saveName: 'Nom de la recherche', ok: 'OK', forget: 'Oublier',
    scores: 'Autres notes : TMDB, Rotten Tomatoes, Metacritic…', hideScores: 'Masquer les autres notes',
};
const SOURCES = [['catalog', 'Ce catalogue'], ['sources', 'Toutes les sources'], ['all', 'Tout'], ['foryou', 'Pour toi']].map(([value, label]) => ({ value, label }));
const VOTES = [['', 'Peu importe'], ['1000', '1 000 et plus'], ['10000', '10 000 et plus'], ['50000', '50 000 et plus'], ['100000', '100 000 et plus'], ['500000', '500 000 et plus']]
    .map(([value, label]) => ({ value, label }));
const SORTS = [['rating', 'Meilleure note IMDb'], ['average', 'Moyenne des notes'], ['votes', 'Popularité'], ['year', 'Plus récents'], ['year_asc', 'Plus anciens']]
    .map(([value, label]) => ({ value, label }));
const SCORES = [['', 'Peu importe'], ['6', '6 et plus'], ['7', '7 et plus'], ['8', '8 et plus'], ['9', '9 et plus']].map(([value, label]) => ({ value, label }));
const GENRE_MODES = [['all', 'tous à la fois'], ['any', 'au moins un']].map(([value, label]) => ({ value, label }));

const SCORE_NAMES = {
    tmdb: 'TMDB', tomatoes: 'Rotten Tomatoes', popcorn: 'Rotten Tomatoes (public)', metacritic: 'Metacritic',
    metacriticuser: 'Metacritic (public)', trakt: 'Trakt', letterboxd: 'Letterboxd',
};

const GENRES = {
    Action: 'Action', Adventure: 'Aventure', Animation: 'Animation', Biography: 'Biographie', Comedy: 'Comédie', Crime: 'Policier',
    Documentary: 'Documentaire', Drama: 'Drame', Family: 'Famille', Fantasy: 'Fantastique', 'Film-Noir': 'Film noir',
    'Game-Show': 'Jeu télévisé', History: 'Histoire', Horror: 'Horreur', Music: 'Musique', Musical: 'Comédie musicale',
    Mystery: 'Mystère', News: 'Actualités', 'Reality-TV': 'Téléréalité', Romance: 'Romance', 'Sci-Fi': 'Science-fiction',
    Sport: 'Sport', 'Talk-Show': 'Talk-show', Thriller: 'Thriller', War: 'Guerre', Western: 'Western',
};

const named = (type) => {
    const names = new Intl.DisplayNames(['fr'], { type });
    return (code) => {
        try {
            return names.of(code).replace(/^./, (c) => c.toUpperCase());
        } catch {
            return code;
        }
    };
};
const languageName = named('language');
const countryName = named('region');

// « fr » ou « fr_cached » (engine.playable).
const linkName = (link) => {
    const [lang, cached] = link.split('_');
    return `${languageName(lang)}${cached ? ', en cache' : ''}`;
};

// Les plus fréquents d'abord (ordre du moteur), le reste par ordre alphabétique : la liste n'a pas de recherche.
const FIRST = 10;
const choices = (codes, name, any) => [{ value: '', label: any }].concat(
    codes.slice(0, FIRST).map((value) => ({ value, label: name(value) })),
    codes.slice(FIRST).map((value) => ({ value, label: name(value) })).sort((a, b) => a.label.localeCompare(b.label, 'fr')),
);

// Intervalle en mots : « depuis 2025 » plutôt que « 2025 à … ».
const span = (min, max, from, upTo, between) => (min && max ? between(min, max) : min ? from(min) : max ? upTo(max) : null);

// Résumé affiché dans la barre quand le panneau est replié : on garde la place pour les films.
const summary = (f) => [
    span(f.rating_min, f.rating_max, (a) => `Note ${a} et plus`, (b) => `Note ${b} au plus`, (a, b) => `Note ${a} à ${b}`),
    f.votes_min && `${Number(f.votes_min).toLocaleString('fr')} votes et plus`,
    span(f.year_min, f.year_max, (a) => `depuis ${a}`, (b) => `jusqu’à ${b}`, (a, b) => `${a} à ${b}`),
    ...[[f.countries, countryName], [f.languages, languageName], [f.places, (p) => p]]
        .flatMap(([choice, name]) => Object.keys(choice || {}).map((k) => `${choice[k] === 'out' ? 'sans ' : ''}${name(k)}`)),
    f.unknown_country && Object.keys(f.countries || {}).length > 0 && 'pays connu',
    f.unseen && 'pas vus',
    f.mine && 'ma liste',
    f.link && `Liens ${linkName(f.link).toLowerCase()}`,
    ...Object.keys(SCORE_NAMES).filter((s) => f[`score_${s}_min`]).map((s) => `${SCORE_NAMES[s]} ${f[`score_${s}_min`]} et plus`),
    span(f.runtime_min, f.runtime_max, (a) => `${a} min et plus`, (b) => `${b} min au plus`, (a, b) => `${a} à ${b} min`),
    ...Object.keys(f.genres).map((g) => `${f.genres[g] === 'out' ? 'sans ' : ''}${GENRES[g] || g}`),
].filter(Boolean).join(' · ');

// Nom proposé pour une recherche : les premiers éléments du résumé qui tiennent en entier, jamais un mot coupé.
const shortName = (text, max) => text.split(' · ').reduce((name, part) => {
    const longer = name ? `${name} · ${part}` : part;
    return longer.length <= max ? longer : name;
}, '') || text.slice(0, max);

// Tri par la note d'un autre site, s'il y en a en base.
const sortsWith = (scores, source) => (source === 'foryou' ? [{ value: 'foryou', label: 'Pour toi d’abord' }] : [])
    .concat(SORTS, scores.filter((s) => SCORE_NAMES[s]).map((s) => ({ value: s, label: `Note ${SCORE_NAMES[s]}` })));

module.exports = { TEXTS, SOURCES, VOTES, SORTS, sortsWith, SCORES, GENRE_MODES, SCORE_NAMES, GENRES, languageName, countryName, linkName, choices, summary, shortName };
