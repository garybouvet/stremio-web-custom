// Copyright (C) 2017-2026 Smart code 203358507

const { labelsFor, shortName } = require('../src/routes/Discover/CustomFilters/labels');
const { twoLetters, textsFor } = require('../src/common/customTexts');
const fr = require('../src/common/customTexts/fr');
const en = require('../src/common/customTexts/en');

const base = { genres: {}, countries: {}, languages: {}, places: {} };

describe('résumé des filtres', () => {
    it('écrit les intervalles ouverts en mots', () => {
        const { summary } = labelsFor('fr');
        expect(summary({ ...base, rating_min: '8', year_min: '2025', genres: { Comedy: 'in' } })).toBe('Note 8 et plus · depuis 2025 · Comédie');
        expect(summary({ ...base, year_max: '1990', runtime_max: '90' })).toBe('jusqu’à 1990 · 90 min au plus');
    });

    it('garde les intervalles fermés', () => {
        expect(labelsFor('fr').summary({ ...base, rating_min: '7', rating_max: '9', year_min: '2000', year_max: '2010' })).toBe('Note 7 à 9 · 2000 à 2010');
    });

    it('suit la langue de Stremio, pays et langues compris', () => {
        const { summary } = labelsFor('en');
        expect(summary({ ...base, rating_min: '8', year_min: '2025', countries: { IN: 'out' }, genres: { Comedy: 'in' } }))
            .toBe('Rated 8+ · since 2025 · no India · Comedy');
        expect(labelsFor('fr').summary({ ...base, countries: { IN: 'out' } })).toBe('sans Inde');
    });
});

describe('nom proposé pour une recherche enregistrée', () => {
    it('garde les éléments entiers qui tiennent en 40 caractères', () => {
        expect(shortName('Note 8 et plus · depuis 2025 · Comédie · Aventure', 40)).toBe('Note 8 et plus · depuis 2025 · Comédie');
        expect(shortName('Comédie', 40)).toBe('Comédie');
    });
});

describe('textes ajoutés', () => {
    it('reconnaît la langue de Stremio et prend l’anglais pour les autres', () => {
        expect(['eng', 'en-US', 'fr-FR', 'fre', 'deu', undefined].map(twoLetters)).toEqual(['en', 'en', 'fr', 'fr', 'de', 'en']);
        expect(textsFor('fr').filters).toBe('Filtres');
        expect(textsFor('de').filters).toBe('Filters');
    });

    it('a les mêmes clés en français et en anglais', () => {
        const keys = (o, prefix = '') => Object.keys(o).flatMap((k) => (o[k] && typeof o[k] === 'object' ? keys(o[k], `${prefix}${k}.`) : [`${prefix}${k}`])).sort();
        expect(keys(en)).toEqual(keys(fr));
    });
});
