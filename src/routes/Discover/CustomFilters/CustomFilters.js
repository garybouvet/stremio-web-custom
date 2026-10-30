// Panneau des filtres cumulables, affiché sous les menus de la page Découvrir.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const styles = require('./styles');

const VOTES = [['', 'Tous'], ['1000', '1 000+'], ['10000', '10 000+'], ['50000', '50 000+'], ['100000', '100 000+'], ['500000', '500 000+']];
const SORTS = [['rating', 'Meilleure note'], ['votes', 'Popularité'], ['year', 'Plus récents'], ['year_asc', 'Plus anciens']];
const NEXT_GENRE_STATE = { undefined: 'in', in: 'out', out: undefined };

// Comme CredentialsTextInput : les flèches règlent le champ au lieu de déplacer le focus (navigation spatiale).
const keepArrowsInInputs = (event) => {
    if (['INPUT', 'SELECT'].includes(event.target.tagName) && event.key.startsWith('Arrow')) {
        event.nativeEvent.spatialNavigationPrevented = true;
    }
};

const useGenres = () => {
    const [genres, setGenres] = React.useState([]);
    React.useEffect(() => {
        fetch('/api/genres', { headers: { 'X-Stremio-Custom': '1' } })
            .then((r) => r.json())
            .then((body) => setGenres(body.genres.filter((g) => !['Adult', 'Short'].includes(g))))
            .catch(() => setGenres([]));
    }, []);
    return genres;
};

const Range = ({ label, unit, min, max, step, from, to, onFrom, onTo }) => (
    <fieldset className={styles['field']}>
        <legend className={styles['label']}>{label}</legend>
        <div className={styles['range']}>
            <input type={'number'} aria-label={`${label} minimum`} placeholder={String(min)} min={min} max={max} step={step} value={from} onChange={(e) => onFrom(e.target.value)} />
            <span className={styles['dash']}>à</span>
            <input type={'number'} aria-label={`${label} maximum`} placeholder={String(max)} min={min} max={max} step={step} value={to} onChange={(e) => onTo(e.target.value)} />
            {unit ? <span className={styles['unit']}>{unit}</span> : null}
        </div>
    </fieldset>
);

const CustomFilters = ({ supported, active, filters, setFilters, reset }) => {
    const [open, setOpen] = React.useState(false);
    const genres = useGenres();
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
                    <button type={'button'} aria-pressed={filters.source === 'catalog'} onClick={() => set('source')('catalog')}>Ce catalogue</button>
                    <button type={'button'} aria-pressed={filters.source === 'all'} onClick={() => set('source')('all')}>Tout IMDb</button>
                </div>
                {active ? <button type={'button'} className={styles['reset']} onClick={reset}>Réinitialiser</button> : null}
            </div>
            {open ? <div className={styles['panel']} onKeyDown={keepArrowsInInputs}>
                <fieldset className={styles['field']}>
                    <legend className={styles['label']}>Note IMDb : <strong>{rating.toFixed(1)} à {ratingMax.toFixed(1)}</strong></legend>
                    <input type={'range'} className={styles['slider']} aria-label={'Note minimum'} min={0} max={10} step={0.5} value={rating} onChange={(e) => set('rating_min')(e.target.value === '0' ? '' : e.target.value)} />
                    <input type={'range'} className={styles['slider']} aria-label={'Note maximum'} min={0} max={10} step={0.5} value={ratingMax} onChange={(e) => set('rating_max')(e.target.value === '10' ? '' : e.target.value)} />
                </fieldset>
                <fieldset className={styles['field']}>
                    <legend className={styles['label']}>Nombre de votes</legend>
                    <select value={filters.votes_min} onChange={(e) => set('votes_min')(e.target.value)}>
                        {VOTES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </fieldset>
                <Range label={'Année'} min={1900} max={new Date().getFullYear()} step={1} from={filters.year_min} to={filters.year_max} onFrom={set('year_min')} onTo={set('year_max')} />
                <Range label={'Durée'} unit={'min'} min={0} max={300} step={5} from={filters.runtime_min} to={filters.runtime_max} onFrom={set('runtime_min')} onTo={set('runtime_max')} />
                {filters.source === 'all' ? <fieldset className={styles['field']}>
                    <legend className={styles['label']}>Tri</legend>
                    <select value={filters.sort} onChange={(e) => set('sort')(e.target.value)}>
                        {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </fieldset> : null}
                <fieldset className={classnames(styles['field'], styles['genres'])}>
                    <legend className={styles['label']}>
                        Genres (un clic : inclure, deux : exclure)
                        <select className={styles['mode']} aria-label={'Genres inclus'} value={filters.genres_mode} onChange={(e) => set('genres_mode')(e.target.value)}>
                            <option value={'all'}>tous à la fois</option>
                            <option value={'any'}>au moins un</option>
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
        genres: PropTypes.objectOf(PropTypes.string),
        genres_mode: PropTypes.string,
        sort: PropTypes.string,
    }),
    setFilters: PropTypes.func,
    reset: PropTypes.func,
};

module.exports = CustomFilters;
