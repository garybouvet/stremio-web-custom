// Copyright (C) 2017-2026 Smart code 203358507

// Filtres cumulables, affichés sous les menus de la page Découvrir : barre, puis panneau (feuille du bas sur téléphone).

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: useMediaQuery } = require('stremio/common/useMediaQuery');
const screenSizes = require('stremio/common/screen-sizes.less');
const { default: BottomSheet } = require('stremio/components/BottomSheet');
const { default: Button } = require('stremio/components/Button');
const { default: SegmentedControl } = require('stremio/components/SegmentedControl');
const FiltersPanel = require('./FiltersPanel');
const SavedSearches = require('./SavedSearches');
const { TEXTS, SOURCES, GENRES, summary } = require('./labels');
const styles = require('./styles');

const EMPTY_OPTIONS = { genres: [], languages: [], countries: [], places: [], scores: [], links: [] };

const useOptions = () => {
    const [options, setOptions] = React.useState(EMPTY_OPTIONS);
    React.useEffect(() => {
        fetch('api/options', { headers: { 'X-Stremio-Custom': '1' } })
            .then((r) => r.json())
            .then((body) => setOptions({ ...EMPTY_OPTIONS, ...body, genres: body.genres.filter((g) => GENRES[g]).sort((a, b) => GENRES[a].localeCompare(GENRES[b], 'fr')) }))
            .catch(() => setOptions(EMPTY_OPTIONS));
    }, []);
    return options;
};

const CustomFilters = ({ supported, active, filters, setFilters, reset, total }) => {
    const [open, setOpen] = React.useState(false);
    const isMobile = useMediaQuery(`(max-width: ${screenSizes.xsmall})`);
    const options = useOptions();
    const setSource = React.useCallback((source) => setFilters((f) => ({ ...f, source })), [setFilters]);
    if (!supported) return null;

    return (
        <div className={styles['custom-filters']}>
            <div className={styles['bar']}>
                <Button className={classnames(styles['toggle'], { [styles['on']]: active })} aria-expanded={open} onClick={() => setOpen(!open)}>
                    <Icon className={styles['icon']} name={'filters'} />
                    <span>{TEXTS.filters}</span>
                </Button>
                <SegmentedControl options={SOURCES} value={filters.source} ariaLabel={'Source'} onSelect={setSource} />
                {active ? <Button className={styles['reset']} onClick={reset}>{TEXTS.reset}</Button> : null}
                {active && total !== null ? <span className={styles['total']}>{`${total.toLocaleString('fr')} titre${total > 1 ? 's' : ''}`}</span> : null}
                {active && !open ? <span className={styles['summary']} title={summary(filters)}>{summary(filters)}</span> : null}
            </div>
            <SavedSearches active={active} filters={filters} setFilters={setFilters} />
            {isMobile ?
                <BottomSheet show={open} title={TEXTS.filters} closeOnContentClick={false} onCloseRequest={() => setOpen(false)}>
                    <FiltersPanel options={options} filters={filters} setFilters={setFilters} />
                </BottomSheet>
                :
                open ?
                    <FiltersPanel options={options} filters={filters} setFilters={setFilters}>
                        <Button className={styles['close']} aria-label={TEXTS.close} title={TEXTS.close} onClick={() => setOpen(false)}>
                            <Icon className={styles['icon']} name={'close'} />
                        </Button>
                    </FiltersPanel>
                    :
                    null
            }
        </div>
    );
};

CustomFilters.propTypes = {
    supported: PropTypes.bool,
    active: PropTypes.bool,
    filters: PropTypes.object,
    setFilters: PropTypes.func,
    reset: PropTypes.func,
    total: PropTypes.number,
};

module.exports = CustomFilters;
