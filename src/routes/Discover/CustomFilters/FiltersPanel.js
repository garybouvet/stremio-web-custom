// Copyright (C) 2017-2026 Smart code 203358507

// Champs du panneau de filtres.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { default: MultiselectMenu } = require('stremio/components/MultiselectMenu');
const ChipChoice = require('./ChipChoice');
const { useLabels } = require('./labels');
const styles = require('./styles');

const AS_IS = (name) => name;
const NEXT_GENRE_STATE = { undefined: 'in', in: 'out', out: undefined };

// Comme CredentialsTextInput : les flèches règlent le champ au lieu de déplacer le focus (navigation spatiale).
const keepArrowsInInputs = (event) => {
    if (event.target.tagName === 'INPUT' && event.key.startsWith('Arrow')) {
        event.nativeEvent.spatialNavigationPrevented = true;
    }
};

const Choice = ({ label, options, value, onChange }) => options.length < 2 ? null : (
    <div className={styles['field']} role={'group'} aria-label={label}>
        <div className={styles['label']}>{label}</div>
        <MultiselectMenu className={styles['menu']} portal={true} options={options} value={value || ''} onSelect={onChange} />
    </div>
);

Choice.propTypes = {
    label: PropTypes.string,
    options: PropTypes.array,
    value: PropTypes.string,
    onChange: PropTypes.func,
};

const Range = ({ label, min, max, step, from, to, onFrom, onTo }) => {
    const { TEXTS } = useLabels();
    return (
    <div className={styles['field']} role={'group'} aria-label={label}>
        <div className={styles['label']}>{label}</div>
        <div className={styles['range']}>
            <input type={'number'} inputMode={'decimal'} aria-label={`${label} ${TEXTS.minimum}`} placeholder={String(min)} min={min} max={max} step={step} value={from} onChange={(e) => onFrom(e.target.value)} />
            <span className={styles['dash']}>{TEXTS.to}</span>
            <input type={'number'} inputMode={'decimal'} aria-label={`${label} ${TEXTS.maximum}`} placeholder={String(max)} min={min} max={max} step={step} value={to} onChange={(e) => onTo(e.target.value)} />
        </div>
    </div>
    );
};

Range.propTypes = {
    label: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    from: PropTypes.string,
    to: PropTypes.string,
    onFrom: PropTypes.func,
    onTo: PropTypes.func,
};

const Switch = ({ on, title, onClick, children }) => (
    <Button className={classnames(styles['pill'], { [styles['on']]: on })} role={'switch'} aria-checked={on} title={title} onClick={onClick}>
        {children}
    </Button>
);

Switch.propTypes = {
    on: PropTypes.bool,
    title: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
};

const FiltersPanel = ({ options, filters, setFilters, children }) => {
    const { TEXTS, VOTES, sortsWith, SCORES, GENRE_MODES, SCORE_NAMES, GENRES, languageName, countryName, linkName, choices } = useLabels();
    const optionsOf = (codes, name) => choices(codes, name, '').slice(1);
    const F = TEXTS.fields;
    const { genres, languages, countries, places, scores, links } = options;
    const scoresShown = scores.filter((s) => SCORE_NAMES[s]);
    const [scoresOpen, setScoresOpen] = React.useState(() => scoresShown.some((s) => filters[`score_${s}_min`]));
    const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
    const cycleGenre = (g) => setFilters((f) => {
        const next = { ...f.genres, [g]: NEXT_GENRE_STATE[f.genres[g]] };
        if (next[g] === undefined) delete next[g];
        return { ...f, genres: next };
    });

    return (
        <div className={styles['panel']} onKeyDown={keepArrowsInInputs}>
            {children}
            <Range label={F.rating} min={0} max={10} step={0.5} from={filters.rating_min} to={filters.rating_max} onFrom={set('rating_min')} onTo={set('rating_max')} />
            <Range label={F.year} min={1900} max={new Date().getFullYear()} step={1} from={filters.year_min} to={filters.year_max} onFrom={set('year_min')} onTo={set('year_max')} />
            <Range label={F.runtime} min={0} max={300} step={5} from={filters.runtime_min} to={filters.runtime_max} onFrom={set('runtime_min')} onTo={set('runtime_max')} />
            <Choice label={F.votes} options={VOTES} value={filters.votes_min} onChange={set('votes_min')} />
            <ChipChoice label={F.countries} options={optionsOf(countries, countryName)} value={filters.countries} onChange={set('countries')} />
            <ChipChoice label={F.languages} options={optionsOf(languages, languageName)} value={filters.languages} onChange={set('languages')} />
            <ChipChoice label={F.places} options={optionsOf(places, AS_IS)} value={filters.places} onChange={set('places')} />
            <Choice label={F.links} options={[{ value: '', label: TEXTS.any }, ...links.flatMap((l) => [l, `${l}_cached`]).map((value) => ({ value, label: linkName(value) }))]} value={filters.link} onChange={set('link')} />
            {filters.source !== 'catalog' ? <Choice label={F.sort} options={sortsWith(scores, filters.source)} value={filters.sort} onChange={set('sort')} /> : null}
            <div className={styles['row']}>
                <Switch on={filters.unseen} onClick={() => set('unseen')(!filters.unseen)}>{TEXTS.unseen}</Switch>
                <Switch on={filters.mine} onClick={() => set('mine')(!filters.mine)}>{TEXTS.mine}</Switch>
                {Object.keys(filters.countries).length > 0 ?
                    <Switch on={filters.unknown_country} title={TEXTS.unknownHelp} onClick={() => set('unknown_country')(!filters.unknown_country)}>{TEXTS.unknownCountry}</Switch>
                    :
                    null
                }
                {scoresShown.length > 0 ?
                    <Button className={styles['pill']} aria-expanded={scoresOpen} onClick={() => setScoresOpen(!scoresOpen)}>
                        {scoresOpen ? TEXTS.hideScores : TEXTS.scores}
                    </Button>
                    :
                    null
                }
                {filters.source !== 'catalog' ? <Switch on={filters.known} title={TEXTS.knownHelp} onClick={() => set('known')(!filters.known)}>{TEXTS.known}</Switch> : null}
            </div>
            {scoresOpen ? scoresShown.map((s) => <Choice key={s} label={SCORE_NAMES[s]} options={SCORES} value={filters[`score_${s}_min`]} onChange={set(`score_${s}_min`)} />) : null}
            <div className={classnames(styles['field'], styles['genres'])} role={'group'} aria-label={F.genres}>
                <div className={styles['label']}>
                    {TEXTS.genres}
                    {GENRE_MODES.map(({ value, label }) => (
                        <Button key={value} className={classnames(styles['mode'], { [styles['on']]: filters.genres_mode === value })} aria-pressed={filters.genres_mode === value} onClick={() => set('genres_mode')(value)}>
                            {label}
                        </Button>
                    ))}
                </div>
                <div className={styles['chips']}>
                    {genres.map((g) => (
                        <Button key={g} className={classnames(styles['pill'], styles[filters.genres[g]])} aria-label={`${GENRES[g] || g} : ${TEXTS.genreStates[filters.genres[g] || 'none']}`} onClick={() => cycleGenre(g)}>
                            {GENRES[g] || g}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

FiltersPanel.propTypes = {
    options: PropTypes.object,
    filters: PropTypes.object,
    setFilters: PropTypes.func,
    children: PropTypes.node,
};

module.exports = FiltersPanel;
