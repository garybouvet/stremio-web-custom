// Copyright (C) 2017-2026 Smart code 203358507

// Recherches enregistrées, gardées sur cet appareil, et passage d'une recherche de l'accueil à Découvrir.

const React = require('react');
const { STORAGE_KEY: CURRENT_KEY, normalized } = require('./query');

const STORAGE_KEY = 'custom_filters_saved';
const CHANGED = 'custom-filters-saved-changed';
const APPLY = 'custom-filters-apply';

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved.filter((s) => typeof s?.name === 'string' && s.filters) : [];
    } catch {
        return [];
    }
};

const write = (saved) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
        // stockage plein ou indisponible : la liste vaut pour cette session
    }
    window.dispatchEvent(new Event(CHANGED));
};

const useSaved = () => {
    const [saved, setSaved] = React.useState(read);
    React.useEffect(() => {
        const update = () => setSaved(read());
        window.addEventListener(CHANGED, update);
        return () => window.removeEventListener(CHANGED, update);
    }, []);
    return [saved, write];
};

// Depuis l'accueil : Découvrir lit ces filtres à l'ouverture, ou les reçoit s'il est déjà ouvert.
const apply = (filters) => {
    try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(normalized(filters)));
    } catch {
        // stockage indisponible : l'événement suffit si Découvrir est déjà ouvert
    }
    window.dispatchEvent(new CustomEvent(APPLY, { detail: normalized(filters) }));
};

const useApplied = (setFilters) => React.useEffect(() => {
    const onApply = (event) => setFilters(event.detail);
    window.addEventListener(APPLY, onApply);
    return () => window.removeEventListener(APPLY, onApply);
}, [setFilters]);

module.exports = { useSaved, apply, useApplied };
