// Copyright (C) 2017-2026 Smart code 203358507

// Une rangée de l'accueil par recherche enregistrée ; « Tout voir » l'ouvre dans Découvrir.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { MetaItem, MetaRow } = require('stremio/components');
const { normalized, buildQuery } = require('./query');
const { toMetaItem, defaultRequest, discoverHref } = require('./metaItem');
const { useSaved, apply } = require('./savedStore');
const { useLibraryFlags } = require('./useLibraryFlags');

const MAX_ROWS = 8;

const SavedRow = ({ className, search, library, withFlags }) => {
    const [state, setState] = React.useState({ status: 'Loading', items: [] });
    const request = search.request ?? defaultRequest(search.type ?? 'movie');
    const query = buildQuery(normalized(search.filters), request, [], library);
    React.useEffect(() => {
        const controller = new AbortController();
        fetch(`${query}&skip=0`, { headers: { 'X-Stremio-Custom': '1' }, signal: controller.signal })
            .then((r) => r.ok ? r.json() : Promise.reject(r.status))
            .then(({ metas }) => setState({ status: 'Ready', items: metas.map(toMetaItem) }))
            .catch(() => !controller.signal.aborted && setState({ status: 'Err', items: [] }));
        return () => controller.abort();
    }, [query]);

    if (state.status === 'Loading') {
        return <MetaRow.Placeholder className={className} title={search.name} />;
    }
    if (state.items.length === 0) {
        return null;
    }
    const catalog = { items: withFlags(state.items), deepLinks: { discover: discoverHref(request) } };
    return (
        <div onClickCapture={(event) => event.target.closest('[class*=see-all]') && apply(search.filters)}>
            <MetaRow className={className} title={search.name} catalog={catalog} itemComponent={MetaItem} />
        </div>
    );
};

SavedRow.propTypes = {
    className: PropTypes.string,
    search: PropTypes.object,
    library: PropTypes.object,
    withFlags: PropTypes.func,
};

const SavedRows = ({ className }) => {
    const [saved] = useSaved();
    const { withFlags, library } = useLibraryFlags(true);
    return saved.slice(0, MAX_ROWS).map((search) => (
        <SavedRow key={search.name} className={classnames(className, 'animation-fade-in')} search={search} library={library} withFlags={withFlags} />
    ));
};

SavedRows.propTypes = {
    className: PropTypes.string,
};

module.exports = SavedRows;
