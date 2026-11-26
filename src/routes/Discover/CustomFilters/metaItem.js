// Copyright (C) 2017-2026 Smart code 203358507

// Titre renvoyé par le moteur -> forme attendue par les composants de Stremio (MetaItem, MetaPreview).

const CINEMETA = 'https://v3-cinemeta.strem.io/manifest.json';

const toMetaItem = (m) => ({
    ...m,
    posterShape: m.posterShape || 'poster',
    deepLinks: {
        metaDetailsVideos: `#/detail/${m.type}/${encodeURIComponent(m.id)}`,
        metaDetailsStreams: m.type === 'movie' ? `#/detail/${m.type}/${encodeURIComponent(m.id)}/${encodeURIComponent(m.id)}` : null,
    },
    // Même forme que les liens préparés par stremio-core (MetaPreview exige l'hôte imdb.com exact).
    links: (m.imdbRating && m.id.startsWith('tt') ? [{ name: m.imdbRating, category: 'imdb', url: `https://imdb.com/title/${m.id}/` }] : []).concat((m.genres || []).map((g) => ({
        name: g, category: 'Genres', url: `stremio:///discover/${encodeURIComponent(CINEMETA)}/${m.type}/top?genre=${encodeURIComponent(g)}`,
    }))),
    // Bandes-annonces brutes de l'addon : l'interface attend celles préparées par stremio-core (avec deepLinks).
    trailerStreams: [],
    released: new Date(NaN),
});

// Catalogue par défaut d'une recherche enregistrée sans catalogue : le plus connu, Cinemeta.
const defaultRequest = (type) => ({ base: CINEMETA.replace(/\/manifest\.json$/, ''), path: { type, id: 'top', extra: [] } });

const discoverHref = (request) => `#/discover/${encodeURIComponent(`${request.base}/manifest.json`)}/${request.path.type}/${encodeURIComponent(request.path.id)}`;

module.exports = { toMetaItem, defaultRequest, discoverHref };
