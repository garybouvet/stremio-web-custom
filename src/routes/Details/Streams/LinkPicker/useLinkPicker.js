// Copyright (C) 2017-2026 Smart code 203358507

// Choix du lien : tous les addons réunis sans doublon, triés du plus sûr au moins sûr, prêts à lire d'abord.

const React = require('react');
const { useParams } = require('react-router');
const { detect, fromProbe, audioMatch, subsMatch, badge } = require('./streamLanguages');
const { availability, qualityOf, sizeOf, hdrOf, looksWrong, unique } = require('./streamInfo');
const { useTrackProbe } = require('./useTrackProbe');
const { useCustomPreview } = require('stremio/common/customPreview');

const STORAGE_KEY = 'stream_language_filter';
const DEFAULTS = { audio: '', subs: '', includeMaybe: true, quality: '', maxSize: '', readyOnly: true };
const NOTHING_RELAXED = { maybe: false, later: false, languages: false, sizes: false };
const RANK = { sure: 0, maybe: 1 };
const NO_MATCH = 9;
const HEAVY = 40; // Go : au-delà, une copie de disque qui saccade vite ; à qualité égale, après les autres
const NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });
const PREFERRED = ['fr', 'en'];
// Hébergée sur le serveur (iPad, navigateur) : pas de serveur de streaming à côté pour vérifier les pistes.
const LOCAL = ['127.0.0.1', 'localhost'].includes(window.location.hostname);

const load = () => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
        return DEFAULTS;
    }
};

const weight = (code) => PREFERRED.includes(code) ? PREFERRED.indexOf(code) : PREFERRED.length;
const languageOptions = (codes) => [...codes]
    .sort((a, b) => (weight(a) - weight(b)) || NAMES.of(a).localeCompare(NAMES.of(b), 'fr'))
    .map((code) => ({ value: code, label: NAMES.of(code).replace(/^./, (c) => c.toUpperCase()) }));

const better = (x, y) => (Number(x.wrong) - Number(y.wrong)) || (x.rank - y.rank) || (Number(!x.d.verified) - Number(!y.d.verified)) ||
    (y.quality - x.quality) || (Number(x.size > HEAVY) - Number(y.size > HEAVY)) || ((y.size ?? 0) - (x.size ?? 0));

const useLinkPicker = (groups) => {
    const [filter, setFilter] = React.useState(load);
    const [relaxed, setRelaxed] = React.useState(NOTHING_RELAXED);
    const { type, id, videoId } = useParams();
    // Noms connus du titre, pour repérer les liens d'un autre film ; sans moteur, la vérification est simplement absente.
    const known = useCustomPreview(type, id);
    const probe = useTrackProbe();
    const { tracksOf } = probe;

    React.useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
        } catch {
            // stockage indisponible : le choix ne survivra pas au rechargement
        }
    }, [filter]);
    React.useEffect(() => setRelaxed(NOTHING_RELAXED), [id, videoId]);

    const links = React.useMemo(() => unique(groups).map(({ stream, addon }) => {
        const tracks = tracksOf(stream);
        return {
            stream, addon, d: tracks ? fromProbe(tracks) : detect(stream),
            kind: availability(stream), quality: qualityOf(stream), size: sizeOf(stream), hdr: hdrOf(stream),
            wrong: looksWrong(stream, known?.names, known?.year),
        };
    }), [groups, tracksOf, known]);

    const result = React.useMemo(() => {
        const lang = filter.audio || filter.subs || 'fr';
        const ranked = links.map((link) => ({
            ...link,
            badge: badge(link.d, lang),
            rank: Math.max(
                filter.audio ? RANK[audioMatch(link.d, filter.audio)] ?? NO_MATCH : 0,
                filter.subs ? RANK[subsMatch(link.d, filter.subs)] ?? NO_MATCH : 0,
            ),
        }));
        const playable = ranked.filter(({ kind }) => kind !== 'external');
        const fits = (l) => relaxed.sizes || ((filter.quality === '' || l.quality === Number(filter.quality)) &&
            (filter.maxSize === '' || (l.size !== null && l.size <= Number(filter.maxSize))));
        const allowed = relaxed.languages ? NO_MATCH : filter.includeMaybe || relaxed.maybe ? RANK.maybe : RANK.sure;
        const withLater = !filter.readyOnly || relaxed.later;
        const kept = (kind, maxRank = allowed, fit = fits) => playable.filter((l) => l.kind === kind && l.rank <= maxRank && fit(l)).sort(better);
        const ready = kept('ready');
        const later = kept('later');
        const gain = (maxRank, fit) => kept('ready', maxRank, fit).length - ready.length;
        return {
            ready,
            later: withLater ? later : [],
            external: ranked.filter(({ kind }) => kind === 'external'),
            total: playable.length,
            shown: ready.length + (withLater ? later.length : 0),
            // Ce que chaque assouplissement ferait apparaître quand plus rien n'est prêt à lire.
            hidden: {
                maybe: allowed === RANK.sure ? gain(RANK.maybe, fits) : 0,
                sizes: gain(allowed, () => true),
                languages: allowed === NO_MATCH ? 0 : gain(NO_MATCH, fits),
                later: withLater ? 0 : later.length,
            },
        };
    }, [links, filter, relaxed]);

    const audioCodes = new Set(PREFERRED);
    const subsCodes = new Set(PREFERRED);
    links.forEach(({ d }) => {
        [...d.audio, ...d.flags].forEach((c) => audioCodes.add(c));
        [...d.subs, ...d.flags].forEach((c) => subsCodes.add(c));
    });
    const readyStreams = result.ready.map(({ stream }) => stream);

    return {
        ...result,
        filter,
        set: (key, value) => setFilter((f) => ({ ...f, [key]: value })),
        relax: (key) => setRelaxed((r) => ({ ...r, [key]: true })),
        audioOptions: languageOptions(audioCodes),
        subsOptions: languageOptions(subsCodes),
        languageName: filter.audio ? NAMES.of(filter.audio) : null,
        verify: () => probe.verify(readyStreams),
        verifiable: LOCAL ? probe.pendingCount(readyStreams) : 0,
        verifying: probe.running,
        local: LOCAL,
    };
};

module.exports = { useLinkPicker };
