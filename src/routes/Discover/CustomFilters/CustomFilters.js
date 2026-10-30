// Copyright (C) 2017-2026 Smart code 203358507

// Panneau des filtres cumulables, affiché sous les menus de la page Découvrir.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const styles = require('./styles');

// Interface volontairement en français seul : textes regroupés ici plutôt que dans stremio-translations.
const TEXTS = {
    all: 'Toutes', to: 'à', catalog: 'Ce catalogue', everything: 'Tout IMDb', reset: 'Réinitialiser',
    rating: 'Note IMDb :', votes: 'Nombre de votes', sort: 'Tri',
    genres: 'Genres (un clic : inclure, deux : exclure)', genresAll: 'tous à la fois', genresAny: 'au moins un',
};
const VOTES = [['', 'Tous'], ['1000', '1 000+'], ['10000', '10 000+'], ['50000', '50 000+'], ['100000', '100 000+'], ['500000', '500 000+']];
const SORTS = [['rating', 'Meilleure note'], ['votes', 'Popularité'], ['year', 'Plus récents'], ['year_asc', 'Plus anciens']];
const NEXT_GENRE_STATE = { undefined: 'in', in: 'out', out: undefined };

// Comme CredentialsTextInput : les flèches règlent le champ au lieu de déplacer le focus (navigation spatiale).
const keepArrowsInInputs = (event) => {
    if (['INPUT', 'SELECT'].includes(event.target.tagName) && event.key.startsWith('Arrow')) {
        event.nativeEvent.spatialNavigationPrevented = true;
    }
};

const EMPTY_OPTIONS = { genres: [], languages: [], countries: [] };
const LANGUAGE_NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });
const COUNTRY_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' });
const displayName = (names, code) => {
    try {
        return names.of(code);
    } catch {
        return code;
    }
};

const useOptions = () => {
    const [options, setOptions] = React.useState(EMPTY_OPTIONS);
    React.useEffect(() => {
        fetch('/api/options', { headers: { 'X-Stremio-Custom': '1' } })
            .then((r) => r.json())
            .then((body) => setOptions({ ...body, genres: body.genres.filter((g) => !['Adult', 'Short'].includes(g)) }))
            .catch(() => setOptions(EMPTY_OPTIONS));
    }, []);
    return options;
};

// Langues et pays : TMDB, présents seulement après l'enrichissement (engine.tmdb).
const CodeSelect = ({ label, codes, names, value, onChange }) => codes.length === 0 ? null : (
    <fieldset className={styles['field']}>
        <legend className={styles['label']}>{label}</legend>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value={''}>{TEXTS.all}</option>
            {codes.map((c) => [c, displayName(names, c)])
                .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
                .map(([c, name]) => <option key={c} value={c}>{name}</option>)}
        </select>
    </fieldset>
);

const Range = ({ label, unit, min, max, step, from, to, onFrom, onTo }) => (
    <fieldset className={styles['field']}>
        <legend className={styles['label']}>{label}</legend>
        <div className={styles['range']}>
            <input type={'number'} aria-label={`${label} minimum`} placeholder={String(min)} min={min} max={max} step={step} value={from} onChange={(e) => onFrom(e.target.value)} />
            <span className={styles['dash']}>{TEXTS.to}</span>
            <input type={'number'} aria-label={`${label} maximum`} placeholder={String(max)} min={min} max={max} step={step} value={to} onChange={(e) => onTo(e.target.value)} />
            {unit ? <span className={styles['unit']}>{unit}</span> : null}
        </div>
    </fieldset>
);

const CustomFilters = ({ supported, active, filters, setFilters, reset }) => {
    const [open, setOpen] = React.useState(false);
    const { genres, languages, countries } = useOptions();
    const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
    const cycleGenre = (g) => setFilters((f) => {
        const next = { ...f.genres, [g]: NEXT_GENRE_STATE[f.genres[g]] };
        if (next[g] === undefined) delete next[g];
        return { ...f, genres: next };
    });
    if (!supported) return null;
    const rating = filters.rating_min === '' ? 0 : Number(filters.rating_min);
    const ratingMax = filters.rating_max === '' ? 10 : Number(filters.rating_max);

    return (
        <div className={styles['custom-filters']}>
            <div className={styles['bar']}>
                <button type={'button'} className={classnames(styles['toggle'], { [styles['on']]: active })} aria-expanded={open} onClick={() => setOpen(!open)}>
                    <Icon className={styles['icon']} name={'filters'} />
                    <span>{active ? 'Filtres actifs' : 'Filtrer par note, année, genre…'}</span>
                </button>
                <div className={styles['segmented']} role={'group'} aria-label={'Source'}>
                    <button type={'button'} aria-pressed={filters.source === 'catalog'} onClick={() => set('source')('catalog')}>{TEXTS.catalog}</button>
                    <button type={'button'} aria-pressed={filters.source === 'all'} onClick={() => set('source')('all')}>{TEXTS.everything}</button>
                </div>
                {active ? <button type={'button'} className={styles['reset']} onClick={reset}>{TEXTS.reset}</button> : null}
            </div>
            {open ? <div className={styles['panel']} onKeyDown={keepArrowsInInputs}>
                <fieldset className={styles['field']}>
                    <legend className={styles['label']}>{TEXTS.rating} <strong>{`${rating.toFixed(1)} ${TEXTS.to} ${ratingMax.toFixed(1)}`}</strong></legend>
                    <input type={'range'} className={styles['slider']} aria-label={'Note minimum'} min={0} max={10} step={0.5} value={rating} onChange={(e) => set('rating_min')(e.target.value === '0' ? '' : e.target.value)} />
                    <input type={'range'} className={styles['slider']} aria-label={'Note maximum'} min={0} max={10} step={0.5} value={ratingMax} onChange={(e) => set('rating_max')(e.target.value === '10' ? '' : e.target.value)} />
                </fieldset>
                <fieldset className={styles['field']}>
                    <legend className={styles['label']}>{TEXTS.votes}</legend>
                    <select value={filters.votes_min} onChange={(e) => set('votes_min')(e.target.value)}>
                        {VOTES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </fieldset>
                <Range label={'Année'} min={1900} max={new Date().getFullYear()} step={1} from={filters.year_min} to={filters.year_max} onFrom={set('year_min')} onTo={set('year_max')} />
                <CodeSelect label={'Langue originale'} codes={languages} names={LANGUAGE_NAMES} value={filters.language} onChange={set('language')} />
                <CodeSelect label={'Pays'} codes={countries} names={COUNTRY_NAMES} value={filters.country} onChange={set('country')} />
                <Range label={'Durée'} unit={'min'} min={0} max={300} step={5} from={filters.runtime_min} to={filters.runtime_max} onFrom={set('runtime_min')} onTo={set('runtime_max')} />
                {filters.source === 'all' ? <fieldset className={styles['field']}>
                    <legend className={styles['label']}>{TEXTS.sort}</legend>
                    <select value={filters.sort} onChange={(e) => set('sort')(e.target.value)}>
                        {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </fieldset> : null}
                <fieldset className={classnames(styles['field'], styles['genres'])}>
                    <legend className={styles['label']}>
                        {TEXTS.genres}
                        <select className={styles['mode']} aria-label={'Genres inclus'} value={filters.genres_mode} onChange={(e) => set('genres_mode')(e.target.value)}>
                            <option value={'all'}>{TEXTS.genresAll}</option>
                            <option value={'any'}>{TEXTS.genresAny}</option>
                        </select>
                    </legend>
                    <div className={styles['chips']}>
                        {genres.map((g) => (
                            <button key={g} type={'button'} className={classnames(styles['chip'], styles[filters.genres[g] || 'neutral'])} aria-label={`${g} : ${{ in: 'inclus', out: 'exclu' }[filters.genres[g]] || 'indifférent'}`} onClick={() => cycleGenre(g)}>
                                {filters.genres[g] === 'out' ? '− ' : filters.genres[g] === 'in' ? '+ ' : ''}{g}
                            </button>
                        ))}
                    </div>
                </fieldset>
            </div> : null}
        </div>
    );
};

Range.propTypes = {
    label: PropTypes.string,
    unit: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    from: PropTypes.string,
    to: PropTypes.string,
    onFrom: PropTypes.func,
    onTo: PropTypes.func,
};

CodeSelect.propTypes = {
    label: PropTypes.string,
    codes: PropTypes.arrayOf(PropTypes.string),
    names: PropTypes.object,
    value: PropTypes.string,
    onChange: PropTypes.func,
};

CustomFilters.propTypes = {
    supported: PropTypes.bool,
    active: PropTypes.bool,
    filters: PropTypes.shape({
        source: PropTypes.string,
        rating_min: PropTypes.string,
        rating_max: PropTypes.string,
        votes_min: PropTypes.string,
        year_min: PropTypes.string,
        year_max: PropTypes.string,
        runtime_min: PropTypes.string,
        runtime_max: PropTypes.string,
        language: PropTypes.string,
        country: PropTypes.string,
        genres: PropTypes.objectOf(PropTypes.string),
        genres_mode: PropTypes.string,
        sort: PropTypes.string,
    }),
    setFilters: PropTypes.func,
    reset: PropTypes.func,
};

module.exports = CustomFilters;
