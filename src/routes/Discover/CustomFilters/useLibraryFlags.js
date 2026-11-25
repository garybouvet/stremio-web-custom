// Copyright (C) 2017-2026 Smart code 203358507

// « Déjà vu » et « en bibliothèque » pour les titres venus du moteur : stremio-core ne connaît que ceux de ses catalogues.
// On lit la bibliothèque là où stremio-core l'enregistre, mêmes règles que lui.

const React = require('react');

const BUCKETS = ['library', 'library_recent'];
const SAVED_AFTER = 600; // stremio-core enregistre juste après l'action

const read = () => {
    try {
        return BUCKETS.reduce((all, key) => ({ ...all, ...JSON.parse(localStorage.getItem(key))?.items }), {});
    } catch {
        return {};
    }
};

const flagsOf = (entry) => ({
    inLibrary: !!entry && !entry.removed && !entry.temp,
    watched: !!entry && (entry.state?.timesWatched || 0) > 0,
});

const useLibraryFlags = (routeActive) => {
    const [items, setItems] = React.useState(read);
    const refresh = React.useCallback(() => setTimeout(() => setItems(read()), SAVED_AFTER), []);
    React.useEffect(() => {
        if (routeActive) setItems(read());
    }, [routeActive]);
    const withFlags = React.useCallback((metas) => metas.map((m) => ({ ...m, ...flagsOf(items[m.id]) })), [items]);
    return { withFlags, refresh };
};

module.exports = { useLibraryFlags, flagsOf };
