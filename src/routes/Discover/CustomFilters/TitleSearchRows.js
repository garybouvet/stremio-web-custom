// Copyright (C) 2017-2026 Smart code 203358507

// Page Recherche : titres trouvés par le moteur, par titre français ou original, sans accents ni casse.
// Les rangées des addons suivent, inchangées.

const React = require('react');
const PropTypes = require('prop-types');
const { MetaItem, MetaRow } = require('stremio/components');
const { toMetaItem } = require('./metaItem');
const { useLibraryFlags } = require('./useLibraryFlags');
const { useCustomTexts } = require('stremio/common/customTexts');

const KINDS = ['movie', 'series'];

const TitleRow = ({ className, query, type, title, withFlags }) => {
    const { lang } = useCustomTexts();
    const [items, setItems] = React.useState(null);
    React.useEffect(() => {
        setItems(null);
        const controller = new AbortController();
        fetch(`api/find?${new URLSearchParams({ q: query, type, lang })}`, { headers: { 'X-Stremio-Custom': '1' }, signal: controller.signal })
            .then((r) => r.ok ? r.json() : Promise.reject(r.status))
            .then(({ metas }) => setItems(metas.map(toMetaItem)))
            .catch(() => !controller.signal.aborted && setItems([]));
        return () => controller.abort();
    }, [query, type, lang]);
    if (items === null) return <MetaRow.Placeholder className={className} title={title} />;
    return items.length === 0 ? null : <MetaRow className={className} title={title} catalog={{ items: withFlags(items) }} itemComponent={MetaItem} />;
};

TitleRow.propTypes = {
    className: PropTypes.string,
    query: PropTypes.string,
    type: PropTypes.string,
    title: PropTypes.string,
    withFlags: PropTypes.func,
};

const TitleSearchRows = ({ className, query }) => {
    const { withFlags } = useLibraryFlags(true);
    const { T } = useCustomTexts();
    if (typeof query !== 'string' || query.trim().length < 2 || /^[a-z]+:\/\//i.test(query)) return null;
    return KINDS.map((type) => <TitleRow key={type} className={className} query={query.trim()} type={type} title={T.searchRows[type]} withFlags={withFlags} />);
};

TitleSearchRows.propTypes = {
    className: PropTypes.string,
    query: PropTypes.string,
};

module.exports = TitleSearchRows;
