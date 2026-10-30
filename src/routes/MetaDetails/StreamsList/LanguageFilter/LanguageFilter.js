// Copyright (C) 2017-2026 Smart code 203358507

// Filtre des liens par langue audio et sous-titres : pistes réelles quand le lien a été vérifié (useTrackProbe),
// sinon d'après le texte du lien (streamLanguages).

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { detect, fromProbe, audioMatch, subsMatch, badge } = require('./streamLanguages');
const { useTrackProbe } = require('./useTrackProbe');
const styles = require('./styles');

// Interface volontairement en français seul : textes regroupés ici plutôt que dans stremio-translations.
const TEXTS = { audio: 'Audio', subs: 'Sous-titres', all: 'Toutes', allSubs: 'Tous', maybe: 'Inclure MULTi et incertains', links: 'liens',
    verify: 'Vérifier les pistes', verifying: 'Vérification', verifyHelp: 'Lit les vraies pistes audio et sous-titres des liens Real-Debrid en cache affichés (15 au plus). Comme une lecture, chaque torrent vérifié s’ajoute à ta liste Real-Debrid.' };
const STORAGE_KEY = 'stream_language_filter';
const DEFAULTS = { audio: '', subs: '', includeMaybe: true };
const RANK = { sure: 0, maybe: 1 };
const NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });
const PREFERRED = ['fr', 'en'];
// Hébergée sur le serveur (iPad, navigateur) : pas de serveur de streaming à côté pour vérifier les pistes,
// et le navigateur ne décode pas toujours le son (AC3, DTS) : on propose d'ouvrir la fiche dans l'appli Stremio.
const LOCAL = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
const OPEN_IN_APP = { label: 'Ouvrir dans Stremio', help: 'Ouvre cette fiche dans l’appli Stremio (lecteur complet, liens triés par l’addon Langues).' };

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
    .map((code) => [code, NAMES.of(code).replace(/^./, (c) => c.toUpperCase())]);

// Comme CredentialsTextInput : les flèches règlent le champ au lieu de déplacer le focus (navigation spatiale).
const keepArrowsInInputs = (event) => {
    if (['INPUT', 'SELECT'].includes(event.target.tagName) && event.key.startsWith('Arrow')) {
        event.nativeEvent.spatialNavigationPrevented = true;
    }
};

const useLanguageFilter = (streams) => {
    const [filter, setFilter] = React.useState(load);
    React.useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
        } catch {
            // stockage indisponible : le choix ne survivra pas au rechargement
        }
    }, [filter]);

    const probe = useTrackProbe();
    const { tracksOf } = probe;
    const detected = React.useMemo(() => streams.map((stream) => {
        const tracks = tracksOf(stream);
        return { stream, d: tracks ? fromProbe(tracks) : detect(stream) };
    }), [streams, tracksOf]);
    const result = React.useMemo(() => {
        const allowed = filter.includeMaybe ? ['sure', 'maybe'] : ['sure'];
        const kept = detected
            .map(({ stream, d }) => {
                const a = filter.audio ? audioMatch(d, filter.audio) : 'sure';
                const s = filter.subs ? subsMatch(d, filter.subs) : 'sure';
                return { stream, d, rank: Math.max(RANK[a] ?? 9, RANK[s] ?? 9) };
            })
            .filter(({ rank }) => allowed.some((level) => RANK[level] === rank))
            // Vérifiés et sûrs d'abord, puis incertains (MULTi, drapeaux) ; l'ordre de l'addon est gardé à l'intérieur.
            .sort((x, y) => (x.rank - y.rank) || (Number(!x.d.verified) - Number(!y.d.verified)));
        const lang = filter.audio || filter.subs || 'fr';
        return kept.map(({ stream, d }) => {
            const text = badge(d, lang);
            const element = text ? <span className={classnames(styles['badge'], { [styles['verified']]: d.verified })}>{text}</span> : null;
            return { ...stream, languageBadge: element };
        });
    }, [detected, filter]);

    const audioCodes = new Set(['fr', 'en']);
    const subsCodes = new Set(['fr', 'en']);
    detected.forEach(({ d }) => {
        [...d.audio, ...d.flags].forEach((c) => audioCodes.add(c));
        [...d.subs, ...d.flags].forEach((c) => subsCodes.add(c));
    });

    return {
        streams: result,
        total: streams.length,
        filter,
        setFilter,
        audioOptions: languageOptions(audioCodes),
        subsOptions: languageOptions(subsCodes),
        active: filter.audio !== '' || filter.subs !== '',
        verify: () => probe.verify(result),
        verifiable: LOCAL ? probe.pendingCount(result) : 0,
        verifying: probe.running,
    };
};

const LanguageFilter = ({ streams, total, filter, setFilter, audioOptions, subsOptions, active, verify, verifiable, verifying }) => {
    const set = (key) => (event) => setFilter((f) => ({ ...f, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
    return (
        <div className={styles['language-filter']} onKeyDown={keepArrowsInInputs}>
            <label className={styles['field']}>
                <span>{TEXTS.audio}</span>
                <select value={filter.audio} onChange={set('audio')}>
                    <option value={''}>{TEXTS.all}</option>
                    {audioOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
            </label>
            <label className={styles['field']}>
                <span>{TEXTS.subs}</span>
                <select value={filter.subs} onChange={set('subs')}>
                    <option value={''}>{TEXTS.allSubs}</option>
                    {subsOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
            </label>
            {active ? <label className={styles['maybe']} title={'MULTi peut contenir la langue ; les drapeaux mélangent audio et sous-titres'}>
                <input type={'checkbox'} checked={filter.includeMaybe} onChange={set('includeMaybe')} />
                <span>{TEXTS.maybe}</span>
            </label> : null}
            {verifying || verifiable > 0 ? <button type={'button'} className={styles['verify']} title={TEXTS.verifyHelp} disabled={!!verifying} onClick={verify}>
                {verifying ? `${TEXTS.verifying} ${verifying.done} / ${verifying.total}…` : `${TEXTS.verify} (${verifiable})`}
            </button> : null}
            {LOCAL ? null : <a className={styles['verify']} title={OPEN_IN_APP.help} href={window.location.hash.replace(/^#\//, 'stremio:///')}>
                {OPEN_IN_APP.label}
            </a>}
            {active ? <span className={styles['count']}>{`${streams.length} / ${total} ${TEXTS.links}`}</span> : null}
        </div>
    );
};

LanguageFilter.propTypes = {
    streams: PropTypes.array,
    total: PropTypes.number,
    filter: PropTypes.shape({
        audio: PropTypes.string,
        subs: PropTypes.string,
        includeMaybe: PropTypes.bool,
    }),
    setFilter: PropTypes.func,
    audioOptions: PropTypes.array,
    subsOptions: PropTypes.array,
    active: PropTypes.bool,
    verify: PropTypes.func,
    verifiable: PropTypes.number,
    verifying: PropTypes.shape({ done: PropTypes.number, total: PropTypes.number }),
};

module.exports = { LanguageFilter, useLanguageFilter, badgeHostClassName: styles['badge-host'] };
