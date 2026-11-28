// Copyright (C) 2017-2026 Smart code 203358507

// Filtres choisis -> adresse de l'API du moteur ; filtres gardés d'une session à l'autre.

const STORAGE_KEY = 'custom_filters';
const PAGE_SIZE = 50;
const FILTRES_ADDON = /\/filtres\/manifest\.json$/;
const DEFAULTS = {
    source: 'catalog',
    rating_min: '', rating_max: '', votes_min: '',
    year_min: '', year_max: '', runtime_min: '', runtime_max: '', link: '',
    genres: {},
    genres_mode: 'all',
    // Choix multiples : { code: 'in' | 'out' }, comme les genres.
    countries: {}, languages: {}, places: {},
    unknown_country: false,
    unseen: false,
    mine: false,
    sort: 'rating',
    known: true,
};
const RANGE_KEYS = ['rating_min', 'rating_max', 'votes_min', 'year_min', 'year_max', 'runtime_min', 'runtime_max', 'link'];
const CHOICES = ['genres', 'countries', 'languages', 'places'];
const SWITCHES = ['unknown_country', 'unseen', 'mine'];
// Notes d'autres sources (score_tomatoes_min…) : la liste vient du moteur, selon ce qui a été récupéré.
const keysOf = (f) => RANGE_KEYS.concat(Object.keys(f).filter((k) => k.startsWith('score_')));

// Filtres d'avant les choix multiples : un pays, un pays exclu, une langue, une plateforme.
const migrated = ({ country, country_not, language, place, ...f }) => ({
    ...f,
    countries: f.countries ?? { ...(country ? { [country]: 'in' } : {}), ...(country_not ? { [country_not]: 'out' } : {}) },
    languages: f.languages ?? (language ? { [language]: 'in' } : {}),
    places: f.places ?? (place ? { [place]: 'in' } : {}),
});

const normalized = (f) => ({ ...DEFAULTS, ...migrated(f || {}) });

const load = () => {
    try {
        return normalized(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
        return DEFAULTS;
    }
};

const hasCriteria = (f) => f.source !== 'catalog' || keysOf(f).some((k) => f[k] !== '') ||
    CHOICES.some((k) => Object.keys(f[k]).length > 0) || SWITCHES.some((k) => f[k]);

// Tous les catalogues du type affiché, groupés par addon pour garder l'adresse courte. Filtres n'est que l'index IMDb.
const sourcesOf = (catalogs) => {
    const sources = {};
    catalogs.forEach(({ id, deepLinks }) => {
        // #/discover/<adresse de l'addon>/<type>/<catalogue>?<extra> : stremio-core ne donne l'adresse que dans ce lien.
        const [path, extra = ''] = deepLinks.discover.split('?');
        const url = decodeURIComponent(path.split('/')[2]);
        if (!FILTRES_ADDON.test(url)) sources[url] = (sources[url] || []).concat([[id, extra]]);
    });
    return JSON.stringify(sources);
};

const chosen = (choice, state) => Object.keys(choice).filter((k) => choice[k] === state);

// library : { watched: [id], mine: [id] } (bibliothèque Stremio).
const buildQuery = (f, request, catalogs, library = { watched: [], mine: [], recent: [] }, lang = 'fr') => {
    // lang : titres en français si Stremio est en français, sinon ceux d'IMDb.
    const q = new URLSearchParams({ type: request.path.type, limit: PAGE_SIZE, lang });
    keysOf(f).forEach((k) => f[k] !== '' && q.set(k, f[k]));
    const list = (key, values) => values.length > 0 && q.set(key, values.join(','));
    list(f.genres_mode === 'all' ? 'genres_all' : 'genres_any', chosen(f.genres, 'in'));
    list('genres_none', chosen(f.genres, 'out'));
    list('country', chosen(f.countries, 'in'));
    list('country_not', chosen(f.countries, 'out'));
    list('language', chosen(f.languages, 'in'));
    list('language_not', chosen(f.languages, 'out'));
    // Noms de plateformes : un paramètre par nom, une virgule pourrait faire partie du nom.
    chosen(f.places, 'in').forEach((p) => q.append('place', p));
    chosen(f.places, 'out').forEach((p) => q.append('place_not', p));
    if (f.unknown_country && Object.keys(f.countries).length > 0) q.set('unknown_country', 'hide');
    if (f.unseen) list('exclude_ids', library.watched);
    if (f.mine) q.set('only_ids', library.mine.join(',') || 'none');
    if (f.source !== 'catalog') {
        q.set('sort', f.sort);
        if (f.known) q.set('known', '1');
    }
    if (f.source === 'foryou') {
        q.set('seeds', library.recent.slice(0, 100).join(','));
        return `api/foryou?${q}`;
    }
    if (f.source === 'all') {
        return `api/search?${q}`;
    }
    if (f.source === 'sources') {
        q.set('sources', sourcesOf(catalogs));
        return `api/sources?${q}`;
    }
    q.set('addon', request.base);
    q.set('catalog', request.path.id);
    q.set('extra', new URLSearchParams(request.path.extra.filter(([k]) => k !== 'skip')).toString());
    return `api/catalog?${q}`;
};

module.exports = { STORAGE_KEY, PAGE_SIZE, DEFAULTS, load, normalized, hasCriteria, buildQuery };
