// Copyright (C) 2017-2026 Smart code 203358507

// Filtres cumulables servis par le moteur local (stremio_custom/engine), même origine que cette interface.

const React = require('react');
const { useLibraryFlags } = require('./useLibraryFlags');
const { STORAGE_KEY, DEFAULTS, load, hasCriteria, buildQuery } = require('./query');
const { toMetaItem } = require('./metaItem');
const { useApplied } = require('./savedStore');

const useCustomFilters = (discover, routeActive) => {
    const [filters, setFilters] = React.useState(load);
    const [result, setResult] = React.useState({ items: [], next: null, status: 'Loading', error: null, total: null });
    const { withFlags, refresh, library } = useLibraryFlags(routeActive);
    const request = discover.selected?.request ?? null;
    const supported = request !== null && ['movie', 'series'].includes(request.path.type);
    const active = supported && hasCriteria(filters);
    const query = active ? buildQuery(filters, request, discover.selectable.catalogs, library) : null;
    const requestIdRef = React.useRef(0);
    useApplied(setFilters);

    React.useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } catch {
            // stockage indisponible : les filtres ne survivront pas au rechargement, rien de grave
        }
    }, [filters]);

    const fetchPage = React.useCallback((skip, append) => {
        const id = ++requestIdRef.current;
        setResult((r) => ({ ...r, status: append ? r.status : 'Loading', loadingMore: append }));
        fetch(`${query}&skip=${skip}`, { headers: { 'X-Stremio-Custom': '1' } })
            .then((resp) => resp.json().then((body) => resp.ok ? body : Promise.reject(body.error)))
            .then(({ metas, next, total }) => {
                if (id !== requestIdRef.current) return;
                setResult((r) => {
                    // « Toutes les sources » : une page lue entre-temps peut décaler le classement d'un titre déjà affiché.
                    const items = append ? r.items : [];
                    const shown = new Set(items.map(({ id }) => id));
                    return { items: items.concat(metas.filter(({ id }) => !shown.has(id)).map(toMetaItem)), next, total: append ? r.total : total ?? null, status: 'Ready', error: null, loadingMore: false };
                });
            })
            .catch((error) => {
                if (id !== requestIdRef.current) return;
                setResult({ items: [], next: null, total: null, status: 'Err', error: typeof error === 'string' ? error : 'Moteur de filtres injoignable', loadingMore: false });
            });
    }, [query]);

    React.useEffect(() => {
        if (query === null) return;
        const timer = setTimeout(() => fetchPage(0, false), 300);
        return () => clearTimeout(timer);
    }, [query, fetchPage]);

    const loadNextPage = React.useCallback(() => {
        if (result.next !== null && !result.loadingMore && result.status === 'Ready') fetchPage(result.next, true);
    }, [result, fetchPage]);

    const items = React.useMemo(() => withFlags(result.items), [withFlags, result.items]);
    const catalog = active && discover.catalog !== null ? {
        ...discover.catalog,
        installed: true,
        content: result.status === 'Ready' && result.items.length === 0 ?
            { type: 'Err', content: 'Aucun titre ne correspond à ces filtres' } :
            { type: result.status, content: result.status === 'Err' ? result.error : items },
    } : discover.catalog;

    return {
        supported,
        active,
        request,
        filters,
        setFilters,
        reset: () => setFilters(DEFAULTS),
        total: result.status === 'Ready' ? result.total : null,
        libraryChanged: refresh,
        discover: catalog === discover.catalog ? discover : { ...discover, catalog },
        hasNextPage: result.next !== null,
        loadNextPage,
    };
};

module.exports = { useCustomFilters, hasCriteria };
