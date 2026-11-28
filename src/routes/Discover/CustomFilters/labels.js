// Copyright (C) 2017-2026 Smart code 203358507

// Libellés du panneau de filtres dans la langue de Stremio (textes : common/customTexts ; pays et langues : Intl).

const { textsFor, useCustomTexts } = require('../../../common/customTexts');

// Les plus fréquents d'abord (ordre du moteur), le reste par ordre alphabétique : la liste n'a pas de recherche.
const FIRST = 10;

const capital = (text) => text.replace(/^./, (c) => c.toUpperCase());
const option = ([value, label]) => ({ value, label });

// Intervalle en mots : « depuis 2025 » plutôt que « 2025 à … ».
const span = (min, max, from, upTo, between) => (min && max ? between(min, max) : min ? from(min) : max ? upTo(max) : null);

// Nom proposé pour une recherche : les premiers éléments du résumé qui tiennent en entier, jamais un mot coupé.
const shortName = (text, max) => text.split(' · ').reduce((name, part) => {
    const longer = name ? `${name} · ${part}` : part;
    return longer.length <= max ? longer : name;
}, '') || text.slice(0, max);

const make = (lang) => {
    const T = textsFor(lang);
    const S = T.summary;
    const named = (type) => {
        const names = new Intl.DisplayNames([lang, 'en'], { type });
        return (code) => {
            try {
                return capital(names.of(code));
            } catch {
                return code;
            }
        };
    };
    const languageName = named('language');
    const countryName = named('region');
    const number = (n) => Number(n).toLocaleString(lang);
    const SCORE_NAMES = T.scoreNames;
    const GENRES = T.genreNames;
    const SORTS = ['rating', 'average', 'votes', 'year', 'year_asc'].map((value) => ({ value, label: T.sorts[value] }));

    // « fr » ou « fr_cached » (engine.playable).
    const linkName = (link) => {
        const [code, cached] = link.split('_');
        return `${languageName(code)}${cached ? T.cached : ''}`;
    };
    const choices = (codes, name, any) => [{ value: '', label: any }].concat(
        codes.slice(0, FIRST).map((value) => ({ value, label: name(value) })),
        codes.slice(FIRST).map((value) => ({ value, label: name(value) })).sort((a, b) => a.label.localeCompare(b.label, lang)),
    );
    // Résumé affiché dans la barre quand le panneau est replié : on garde la place pour les films.
    const summary = (f) => [
        span(f.rating_min, f.rating_max, S.ratingFrom, S.ratingUpTo, S.ratingBetween),
        f.votes_min && S.votes(number(f.votes_min)),
        span(f.year_min, f.year_max, S.yearFrom, S.yearUpTo, S.yearBetween),
        ...[[f.countries, countryName], [f.languages, languageName], [f.places, (p) => p]]
            .flatMap(([choice, name]) => Object.keys(choice || {}).map((k) => `${choice[k] === 'out' ? T.without : ''}${name(k)}`)),
        f.unknown_country && Object.keys(f.countries || {}).length > 0 && S.knownCountry,
        f.unseen && S.unseen,
        f.mine && S.mine,
        f.link && S.links(linkName(f.link).toLowerCase()),
        ...Object.keys(SCORE_NAMES).filter((s) => f[`score_${s}_min`]).map((s) => S.score(SCORE_NAMES[s], f[`score_${s}_min`])),
        span(f.runtime_min, f.runtime_max, S.runtimeFrom, S.runtimeUpTo, S.runtimeBetween),
        ...Object.keys(f.genres || {}).map((g) => `${f.genres[g] === 'out' ? T.without : ''}${GENRES[g] || g}`),
    ].filter(Boolean).join(' · ');
    // Tri par la note d'un autre site, s'il y en a en base.
    const sortsWith = (scores, source) => (source === 'foryou' ? [{ value: 'foryou', label: T.sorts.foryou }] : [])
        .concat(SORTS, scores.filter((s) => SCORE_NAMES[s]).map((s) => ({ value: s, label: T.scoreSort(SCORE_NAMES[s]) })));

    return {
        lang, TEXTS: T, number, SCORE_NAMES, GENRES, SORTS, languageName, countryName, linkName, choices, summary, sortsWith, shortName,
        SOURCES: Object.entries(T.sources).map(option),
        VOTES: [['', T.any], ...['1000', '10000', '50000', '100000', '500000'].map((v) => [v, T.atLeast(number(v))])].map(option),
        SCORES: [['', T.any], ...['6', '7', '8', '9'].map((v) => [v, T.atLeast(v)])].map(option),
        GENRE_MODES: Object.entries(T.genreModes).map(option),
    };
};

const made = {};
const labelsFor = (lang) => made[lang] || (made[lang] = make(lang));
const useLabels = () => labelsFor(useCustomTexts().lang);

module.exports = { labelsFor, useLabels, shortName };
