// Copyright (C) 2017-2026 Smart code 203358507

// Recherches enregistrées : une pastille par recherche, un clic la rouvre. Gardées sur cet appareil.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { normalized } = require('./query');
const { TEXTS, summary } = require('./labels');
const styles = require('./styles');

const STORAGE_KEY = 'custom_filters_saved';
const MAX_NAME = 40;

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved.filter((s) => typeof s?.name === 'string' && s.filters) : [];
    } catch {
        return [];
    }
};

// Même recherche, quel que soit l'ordre des clés ou des choix.
const sameSearch = (a, b) => {
    const stable = (v) => v && typeof v === 'object' ? Object.keys(v).sort().map((k) => [k, stable(v[k])]) : v;
    return JSON.stringify(stable(normalized(a))) === JSON.stringify(stable(normalized(b)));
};

const SavedSearches = ({ active, filters, setFilters }) => {
    const [saved, setSaved] = React.useState(read);
    const [naming, setNaming] = React.useState(null);
    const keep = (next) => {
        setSaved(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // stockage plein ou indisponible : la liste vaut pour cette session
        }
    };
    const current = saved.find((s) => sameSearch(s.filters, filters));
    const save = (event) => {
        event.preventDefault();
        const name = naming.trim().slice(0, MAX_NAME);
        if (name) keep(saved.filter((s) => s.name !== name).concat([{ name, filters }]));
        setNaming(null);
    };
    if (saved.length === 0 && !active) return null;

    return (
        <div className={styles['saved']}>
            {saved.map((s) => (
                <span key={s.name} className={classnames(styles['chip'], { [styles['in']]: s === current })}>
                    <Button className={styles['chip-label']} title={summary(normalized(s.filters))} onClick={() => setFilters(normalized(s.filters))}>{s.name}</Button>
                    <Button className={styles['chip-remove']} aria-label={`${TEXTS.forget} ${s.name}`} onClick={() => keep(saved.filter((x) => x !== s))}>
                        <Icon className={styles['icon']} name={'close'} />
                    </Button>
                </span>
            ))}
            {active && !current ?
                naming === null ?
                    <Button className={styles['save']} onClick={() => setNaming(summary(filters).slice(0, MAX_NAME))}>{TEXTS.save}</Button>
                    :
                    <form className={styles['naming']} onSubmit={save}>
                        <input
                            aria-label={TEXTS.saveName}
                            value={naming}
                            maxLength={MAX_NAME}
                            autoFocus={true}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setNaming(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setNaming(null)}
                        />
                        <button type={'submit'} className={styles['save']}>{TEXTS.ok}</button>
                    </form>
                :
                null
            }
        </div>
    );
};

SavedSearches.propTypes = {
    active: PropTypes.bool,
    filters: PropTypes.object,
    setFilters: PropTypes.func,
};

module.exports = SavedSearches;
