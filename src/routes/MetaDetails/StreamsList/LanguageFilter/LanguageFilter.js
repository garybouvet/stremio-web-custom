// Copyright (C) 2017-2026 Smart code 203358507

// Filtre des liens par langue audio et sous-titres, d'après le texte de chaque lien (voir streamLanguages).

const React = require('react');
const PropTypes = require('prop-types');
const { detect, audioMatch, subsMatch, badge } = require('./streamLanguages');
const styles = require('./styles');

// Interface volontairement en français seul : textes regroupés ici plutôt que dans stremio-translations.
const TEXTS = { audio: 'Audio', subs: 'Sous-titres', all: 'Toutes', allSubs: 'Tous', maybe: 'Inclure MULTi et incertains', links: 'liens' };
const STORAGE_KEY = 'stream_language_filter';
const DEFAULTS = { audio: '', subs: '', includeMaybe: true };
const RANK = { sure: 0, maybe: 1 };
const NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });
const PREFERRED = ['fr', 'en'];

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

    const detected = React.useMemo(() => streams.map((stream) => ({ stream, d: detect(stream) })), [streams]);
    const result = React.useMemo(() => {
        const allowed = filter.includeMaybe ? ['sure', 'maybe'] : ['sure'];
        const kept = detected
            .map(({ stream, d }) => {
                const a = filter.audio ? audioMatch(d, filter.audio) : 'sure';
                const s = filter.subs ? subsMatch(d, filter.subs) : 'sure';
                return { stream, d, rank: Math.max(RANK[a] ?? 9, RANK[s] ?? 9) };
            })
            .filter(({ rank }) => allowed.some((level) => RANK[level] === rank))
            // Sûrs d'abord, puis incertains (MULTi, drapeaux) ; l'ordre de l'addon est gardé à l'intérieur.
            .sort((x, y) => x.rank - y.rank);
        const lang = filter.audio || filter.subs || 'fr';
        return kept.map(({ stream, d }) => ({ ...stream, languageBadge: badge(d, lang) }));
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
    };
};

const LanguageFilter = ({ streams, total, filter, setFilter, audioOptions, subsOptions, active }) => {
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
};

module.exports = { LanguageFilter, useLanguageFilter, badgeClassName: styles['badge'], badgeHostClassName: styles['badge-host'] };
