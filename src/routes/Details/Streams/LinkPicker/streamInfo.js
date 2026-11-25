// Copyright (C) 2017-2026 Smart code 203358507

// Ce qu'un lien dit de lui-même dans son texte : prêt à lire ou à télécharger, qualité, taille, nom de la sortie.

const DOWNLOAD = /\[[A-Z]{2,3} download\]|⏳/u;
const QUALITIES = [[2160, /\b(2160p?|4k|uhd)\b/i], [1440, /\b1440p?\b/i], [1080, /\b1080p?\b/i], [720, /\b720p?\b/i], [480, /\b(576p?|480p?|dvdrip|dvd)\b/i]];
const SIZE = /(?:💾|📦)\s*([\d.,]+)\s*([KMGT])[BO]\b/iu;
const ANY_SIZE = /\b([\d.,]+)\s?([MGT])B\b/i;
const GIGA = { K: 1e-6, M: 1 / 1024, G: 1, T: 1024 };
const DECORATED = /^[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
// Addons de langue du moteur : mêmes liens que les sources, précédés d'un badge.
const LANGUAGE_ADDON = /\/(audio|subs)-[a-z]{2}\/manifest\.json$/;
const ADDED_BADGE = /^(✓[^\n]*|VF|VOSTFR|MULTi|ST [A-Z]{2}|[A-Z]{2})( \?)?\n/;
const STOPWORDS = new Set(['the', 'and', 'les', 'des', 'une', 'for', 'with', 'from', 'season', 'saison', 'integrale', 'complete', 'part', 'film', 'movie', 'serie', 'series']);

const textOf = (s) => `${s.name || ''}\n${s.description || ''}`;

// 'ready' : lecture immédiate ; 'later' : torrent à télécharger d'abord ; 'external' : autre site (WatchHub, YouTube).
const availability = (s) => {
    if (s.externalUrl || s.ytId || s.deepLinks?.externalPlayer?.web) return 'external';
    return !DOWNLOAD.test(textOf(s)) && typeof s.url === 'string' ? 'ready' : 'later';
};

const qualityOf = (s) => QUALITIES.find(([, pattern]) => pattern.test(textOf(s)))?.[0] ?? 0;

const sizeOf = (s) => {
    const found = textOf(s).match(SIZE) ?? textOf(s).match(ANY_SIZE);
    const value = found === null ? NaN : parseFloat(found[1].replace(',', '.')) * GIGA[found[2].toUpperCase()];
    return Number.isFinite(value) ? value : null;
};

const hdrOf = (s) => {
    const text = textOf(s);
    return /\b(DV|dolby[ .]?vision)\b/i.test(text) ? 'DV' : /\bHDR(10)?(?![a-z])/i.test(text) ? 'HDR' : null;
};

const plainName = (s) => (s.name || '').replace(ADDED_BADGE, '');

const releaseOf = (s) => (s.description || '').split('\n').map((l) => l.trim()).find((l) => l.length > 5 && !DECORATED.test(l)) ?? null;

const wordsOf = (text) => text.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOPWORDS.has(w));

// Les sources se trompent parfois de titre : aucun mot en commun avec les noms connus, ni l'année. Dans le doute, on ne dit rien.
const looksWrong = (s, names, year) => {
    const release = releaseOf(s);
    const known = new Set((names || []).flatMap(wordsOf));
    if (release === null || known.size === 0) return false;
    const words = wordsOf(release);
    if (words.length < 2 || (year && words.includes(String(year)))) return false;
    return !words.some((w) => known.has(w));
};

const keysOf = (s) => [
    s.infoHash ? `torrent:${s.infoHash}:${s.fileIdx ?? ''}` : null,
    s.url ? `url:${s.url}` : null,
    `text:${plainName(s)}\n${s.description || ''}`,
].filter(Boolean);

// Un lien présent chez plusieurs addons n'est gardé qu'une fois, chez sa source d'origine. La copie déjà lue lui passe sa marque.
const unique = (groups) => {
    const seen = new Map();
    const out = [];
    [...groups]
        .sort((a, b) => Number(LANGUAGE_ADDON.test(a.addon.transportUrl)) - Number(LANGUAGE_ADDON.test(b.addon.transportUrl)))
        .forEach(({ addon, streams }) => streams.forEach((stream) => {
            const keys = keysOf(stream);
            const known = keys.map((k) => seen.get(k)).find(Boolean);
            if (known) {
                if (stream.lastUsed && !known.stream.lastUsed) known.stream = { ...known.stream, lastUsed: true, progress: stream.progress };
                return;
            }
            const entry = { stream: { ...stream, name: plainName(stream) }, addon };
            keys.forEach((k) => seen.set(k, entry));
            out.push(entry);
        }));
    return out;
};

module.exports = { availability, qualityOf, sizeOf, hdrOf, releaseOf, looksWrong, unique, LANGUAGE_ADDON };
