// Filtres cumulables servis par le moteur local (stremio_custom/engine), même origine que cette interface.

const React = require('react');

const STORAGE_KEY = 'custom_filters';
const PAGE_SIZE = 50;
const CINEMETA = 'https://v3-cinemeta.strem.io/manifest.json';
const DEFAULTS = {
    source: 'catalog',
    rating_min: '', rating_max: '', votes_min: '',
    year_min: '', year_max: '', runtime_min: '', runtime_max: '',
    language: '', country: '',
    genres: {},
    genres_mode: 'all',
    sort: 'rating',
};
const RANGE_KEYS = ['rating_min', 'rating_max', 'votes_min', 'year_min', 'year_max', 'runtime_min', 'runtime_max', 'language', 'country'];

const load = () => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
        return DEFAULTS;
    }
};

const hasCriteria = (f) => f.source === 'all' || RANGE_KEYS.some((k) => f[k] !== '') || Object.keys(f.genres).length > 0;

const buildQuery = (f, request) => {
    const q = new URLSearchParams({ type: request.path.type, limit: PAGE_SIZE });
    RANGE_KEYS.forEach((k) => f[k] !== '' && q.set(k, f[k]));
    const genres = (state) => Object.keys(f.genres).filter((g) => f.genres[g] === state).join(',');
    if (genres('in')) q.set(f.genres_mode === 'all' ? 'genres_all' : 'genres_any', genres('in'));
    if (genres('out')) q.set('genres_none', genres('out'));
    if (f.source === 'all') {
        q.set('sort', f.sort);
        return `/api/search?${q}`;
    }
    q.set('addon', request.base);
    q.set('catalog', request.path.id);
    q.set('extra', new URLSearchParams(request.path.extra.filter(([k]) => k !== 'skip')).toString());
    return `/api/catalog?${q}`;
};

const toMetaItem = (m) => ({
    ...m,
    posterShape: m.posterShape || 'poster',
    deepLinks: {
        metaDetailsVideos: `#/detail/${m.type}/${encodeURIComponent(m.id)}`,
        metaDetailsStreams: m.type === 'movie' ? `#/detail/${m.type}/${encodeURIComponent(m.id)}/${encodeURIComponent(m.id)}` : null,
    },
    // Même forme que les liens préparés par stremio-core (MetaPreview exige l'hôte imdb.com exact).
    links: [{ name: m.imdbRating, category: 'imdb', url: `https://imdb.com/title/${m.id}/` }].concat((m.genres || []).map((g) => ({
        name: g, category: 'Genres', url: `stremio:///discover/${encodeURIComponent(CINEMETA)}/${m.type}/top?genre=${encodeURIComponent(g)}`,
    }))),
    // Bandes-annonces brutes de l'addon : l'interface attend celles préparées par stremio-core (avec deepLinks).
    trailerStreams: [],
    released: new Date(NaN),
});

const useCustomFilters = (discover) => {
    const [filters, setFilters] = React.useState(load);
    const [result, setResult] = React.useState({ items: [], next: null, status: 'Loading', error: null });
    const request = discover.selected?.request ?? null;
    const supported = request !== null && ['movie', 'series'].includes(request.path.type);
    const active = supported && hasCriteria(filters);
    const query = active ? buildQuery(filters, request) : null;
    const requestIdRef = React.useRef(0);

    React.useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } catch {
            // stockage indisponible : les filtres ne survivront pas au rechargement, rien de grave
        }
    }, [filters]);

    const fetchPage = React.useCallback((skip, append) => {
        const id = ++requestIdRef.current;
        setResult((r) => ({ ...r, status: append ? r.status : 'Loading', loadingMore: append }));
        fetch(`${query}&skip=${skip}`, { headers: { 'X-Stremio-Custom': '1' } })
            .then((resp) => resp.json().then((body) => resp.ok ? body : Promise.reject(body.error)))
            .then(({ metas, next }) => {
                if (id !== requestIdRef.current) return;
                const nextSkip = filters.source === 'all' ? (metas.length < PAGE_SIZE ? null : skip + metas.length) : next;
                setResult((r) => ({ items: (append ? r.items : []).concat(metas.map(toMetaItem)), next: nextSkip, status: 'Ready', error: null, loadingMore: false }));
            })
            .catch((error) => {
                if (id !== requestIdRef.current) return;
                setResult({ items: [], next: null, status: 'Err', error: typeof error === 'string' ? error : 'Moteur de filtres injoignable', loadingMore: false });
            });
    }, [query, filters.source]);

    React.useEffect(() => {
        if (query === null) return;
        const timer = setTimeout(() => fetchPage(0, false), 300);
        return () => clearTimeout(timer);
    }, [query, fetchPage]);

    const loadNextPage = React.useCallback(() => {
        if (result.next !== null && !result.loadingMore && result.status === 'Ready') fetchPage(result.next, true);
    }, [result, fetchPage]);

    const catalog = active && discover.catalog !== null ? {
        ...discover.catalog,
        installed: true,
        content: result.status === 'Ready' && result.items.length === 0 ?
            { type: 'Err', content: 'Aucun titre ne correspond à ces filtres' } :
            { type: result.status, content: result.status === 'Err' ? result.error : result.items },
    } : discover.catalog;

    return {
        supported,
        active,
        filters,
        setFilters,
        reset: () => setFilters(DEFAULTS),
        discover: catalog === discover.catalog ? discover : { ...discover, catalog },
        hasNextPage: result.next !== null,
        loadNextPage,
    };
};

module.exports = { useCustomFilters, hasCriteria };
