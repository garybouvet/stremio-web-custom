// Copyright (C) 2017-2026 Smart code 203358507

// Actions de bibliothèque de l'aperçu (mêmes appels que Stremio), puis relecture pour les titres venus du moteur.

const React = require('react');
const { useCore } = require('stremio/core');

const useLibraryActions = (item, changed) => {
    const core = useCore();
    return React.useMemo(() => {
        const run = (args) => () => {
            core.transport.dispatch({ action: 'Ctx', args });
            changed();
        };
        return item === null ? {} : {
            onToggleLibrary: run(item.inLibrary ?
                { action: 'RemoveFromLibrary', args: item.id }
                :
                { action: 'AddToLibrary', args: item }),
            onToggleWatched: run({ action: 'MetaItemMarkAsWatched', args: { meta_item: item, is_watched: !item.watched } }),
        };
    }, [core, item, changed]);
};

module.exports = { useLibraryActions };
