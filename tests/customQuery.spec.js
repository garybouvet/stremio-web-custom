// Copyright (C) 2017-2026 Smart code 203358507

const { normalized, buildQuery, hasCriteria } = require('../src/routes/Discover/CustomFilters/query');

const request = { base: 'https://addon', path: { type: 'movie', id: 'top', extra: [] } };
const params = (f) => new URL(buildQuery(normalized(f), request, [], { watched: ['tt1', 'tt2'], mine: [] }), 'http://x/').searchParams;

describe('filtres du moteur', () => {
    test('anciens filtres à choix unique repris en choix multiples', () => {
        const f = normalized({ country: 'FR', country_not: 'IN', language: 'fr', place: 'Netflix' });
        expect([f.countries, f.languages, f.places]).toEqual([{ FR: 'in', IN: 'out' }, { fr: 'in' }, { Netflix: 'in' }]);
        expect(f.country).toBeUndefined();
    });

    test('plusieurs pays, langues et plateformes, inclus ou exclus', () => {
        const q = params({ source: 'all', countries: { FR: 'in', BE: 'in', IN: 'out' }, languages: { hi: 'out' }, places: { 'Prime Video': 'in', 'HBO Max': 'out' }, unknown_country: true });
        expect([q.get('country'), q.get('country_not'), q.get('language_not'), q.getAll('place'), q.getAll('place_not'), q.get('unknown_country')])
            .toEqual(['FR,BE', 'IN', 'hi', ['Prime Video'], ['HBO Max'], 'hide']);
    });

    test('déjà vus et ma liste', () => {
        expect(params({ unseen: true }).get('exclude_ids')).toBe('tt1,tt2');
        expect(params({ mine: true }).get('only_ids')).toBe('none'); // liste vide : aucun titre
        expect(params({ unknown_country: true }).has('unknown_country')).toBe(false); // sans pays choisi, sans effet
        expect(hasCriteria(normalized({ unseen: true }))).toBe(true);
        expect(hasCriteria(normalized({}))).toBe(false);
    });
});
