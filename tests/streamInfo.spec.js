// Copyright (C) 2017-2026 Smart code 203358507

const { availability, qualityOf, sizeOf, hdrOf, releaseOf, looksWrong, unique } = require('../src/routes/Details/Streams/LinkPicker/streamInfo');

// Textes réels renvoyés par Torrentio, MediaFusion et WatchHub (2026-11-25).
const CACHED = { name: '[RD+] Torrentio\n4k DV | HDR', description: 'Leon.1994.MULTi.2160p.BluRay.x265\n👤 12 💾 38.8 GB ⚙️ Torrent9\nMulti Audio / 🇫🇷', url: 'https://x/a' };
const DOWNLOAD = { name: '[RD download] Torrentio\nHDRip', description: 'The.Holdovers.2023.FRENCH.HDRip.x264-DDLPZ\n👤 3 💾 921.66 MB ⚙️ Torrent9\n🇫🇷', url: 'https://x/b' };
const FUSION = { name: 'MediaFusion | Midnight 🧲 RD ⚡️ 2160p', description: '🎨 DV|HDR10+ 📺 BluRay 🎞️ hevc\n📦 38.80 GB  ▶️ 51\n🌐 English + French', url: 'https://y/a' };
const FUSION_LATER = { name: 'MediaFusion | Midnight 🧲 RD ⏳ 1080p', description: '📺 BluRay\n📦 5.09 GB\n🌐 French', url: 'https://y/b' };
const WATCHHUB = { name: 'Rakuten TV', description: 'Rent, Buy', externalUrl: 'https://rakuten.tv' };
const addon = (transportUrl) => ({ transportUrl, manifest: { name: transportUrl } });

describe('streamInfo', () => {
    test('prêt à lire, à télécharger, autre site', () => {
        expect([CACHED, DOWNLOAD, FUSION, FUSION_LATER, WATCHHUB, { infoHash: 'a', name: 'P2P' }].map(availability))
            .toEqual(['ready', 'later', 'ready', 'later', 'external', 'later']);
    });

    test('qualité, taille, HDR', () => {
        expect([CACHED, DOWNLOAD, FUSION, FUSION_LATER].map(qualityOf)).toEqual([2160, 0, 2160, 1080]);
        expect(sizeOf(FUSION)).toBeCloseTo(38.8);
        expect(sizeOf(DOWNLOAD)).toBeCloseTo(0.9, 1);
        expect(sizeOf(WATCHHUB)).toBe(null);
        expect([CACHED, DOWNLOAD, FUSION].map(hdrOf)).toEqual(['DV', null, 'DV']);
    });

    test('le lien d’un autre titre est signalé, sans accuser un titre traduit', () => {
        const wrong = { description: 'Au Service de la France\nAu.Service.De.La.France.S01E01.FRENCH.BDRip.XviD.avi' };
        expect(looksWrong(wrong, ['The Hookup Plan', 'Plan cœur'], 2018)).toBe(true);
        expect(looksWrong({ description: 'Plan.Coeur.S01E01.FRENCH.WEB' }, ['Plan cœur'], 2018)).toBe(false);
        expect(looksWrong({ description: 'Los que se quedan 2023 1080p' }, ['The Holdovers'], 2023)).toBe(false);
        expect(looksWrong(FUSION, ['Léon'], 1994)).toBe(false); // aucun nom de fichier : on ne dit rien
        expect(looksWrong(wrong, [], null)).toBe(false);
        expect(releaseOf(FUSION)).toBe(null);
    });

    test('un lien repris par un addon de langue n’apparaît qu’une fois, chez sa source', () => {
        const copy = { ...CACHED, name: `VF\n${CACHED.name}`, lastUsed: true, progress: 0.4 };
        const out = unique([
            { addon: addon('https://o/addon/x/audio-fr/manifest.json'), streams: [copy, { ...FUSION, url: 'https://autre', name: `✓ FR EN\n${FUSION.name}` }] },
            { addon: addon('https://torrentio/manifest.json'), streams: [CACHED, DOWNLOAD] },
        ]);
        expect(out.map(({ stream }) => stream.name)).toEqual([CACHED.name, DOWNLOAD.name, FUSION.name]);
        expect(out[0].addon.transportUrl).toBe('https://torrentio/manifest.json');
        expect(out[0].stream.lastUsed).toBe(true);
    });
});
