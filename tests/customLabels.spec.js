// Copyright (C) 2017-2026 Smart code 203358507

const { summary, shortName } = require('../src/routes/Discover/CustomFilters/labels');

const base = { genres: {}, countries: {}, languages: {}, places: {} };

describe('résumé des filtres', () => {
    it('écrit les intervalles ouverts en mots', () => {
        expect(summary({ ...base, rating_min: '8', year_min: '2025', genres: { Comedy: 'in' } })).toBe('Note 8 et plus · depuis 2025 · Comédie');
        expect(summary({ ...base, year_max: '1990', runtime_max: '90' })).toBe('jusqu’à 1990 · 90 min au plus');
    });

    it('garde les intervalles fermés', () => {
        expect(summary({ ...base, rating_min: '7', rating_max: '9', year_min: '2000', year_max: '2010' })).toBe('Note 7 à 9 · 2000 à 2010');
    });
});

describe('nom proposé pour une recherche enregistrée', () => {
    it('garde les éléments entiers qui tiennent en 40 caractères', () => {
        expect(shortName('Note 8 et plus · depuis 2025 · Comédie · Aventure', 40)).toBe('Note 8 et plus · depuis 2025 · Comédie');
        expect(shortName('Comédie', 40)).toBe('Comédie');
    });
});
