// Copyright (C) 2017-2026 Smart code 203358507

const { detect, fromProbe, audioMatch, subsMatch, badge } = require('../src/routes/MetaDetails/StreamsList/LanguageFilter/streamLanguages');

// Titres réels renvoyés par Torrentio et MediaFusion (2026-10-30).
const torrentio = (title) => ({ name: 'Torrentio\n1080p', description: title });
const FR_EN = torrentio('Les evades 1994 - 1080p FR EN x264 ac3 mHDgz..mkv\n👤 66 💾 3.53 GB ⚙️ Torrent9\n🇬🇧 / 🇫🇷');
const SUBS = torrentio('The.Shawshank.Redemption.1994.bluray.sdr.1080p.av1.5.1.opus.subs…\n👤 32 💾 3.87 GB ⚙️ TorrentGalaxy\n🇬🇧 / 🇯🇵 / 🇫🇷 / 🇩🇪');
const MULTI = torrentio('The.Shawshank.Redemption.1994.1080p.Bluray.MULTi.DTS-HD.Master.H264-BEN.THE.MEN\n👤 17 💾 19.56 GB\nMulti Audio / 🇬🇧 / 🇫🇷');
const SLASHES = torrentio('The Shawshank Redemption 1994 Bluray 1080p AV1 EN/FR/ES/DE/ITA OPUS 5.1-UH [UserHEVC]\n🇬🇧 / 🇮🇹 / 🇪🇸 / 🇫🇷 / 🇩🇪');
const VOSTFR = torrentio('Dune.Part.Two.2024.VOSTFR.1080p.WEB.H264\n👤 40 💾 4 GB\n🇫🇷');
const TRUEFRENCH = torrentio('Dune.Deuxieme.Partie.2024.TRUEFRENCH.1080p.BluRay.x264\n👤 90 💾 9 GB');
const PL = torrentio('The Shawshank Redemption (1994) [2160p.BluRay.HEVC] [Lektor i Napisy PL]\n🇬🇧 / 🇫🇷 / 🇵🇱');
const ENGLISH_ONLY = torrentio('The.Shawshank.Redemption.1994.1080p.BluRay.x264-AMIABLE\n👤 50 💾 2 GB\n🇬🇧');
const MEDIAFUSION_FR = { name: 'MediaFusion | Midnight 🧲 RD ⚡️ 1080p', description: '📺 BluRay REMUX 🎞️ avc\n📦 29.73 GB\n🌐 French\n🔗 Zilean' };
const MEDIAFUSION_NONE = { name: 'MediaFusion | Midnight 🧲 RD ⚡️ 2160p', description: '📺 BluRay REMUX 🎞️ hevc 🎵 DTS Lossless 🔊 5.1\n📦 54.33 GB  ▶️ 20\n🔗 Zilean DMM' };

describe('streamLanguages', () => {
    test('audio français explicite', () => {
        for (const s of [FR_EN, SLASHES, TRUEFRENCH, MEDIAFUSION_FR]) {
            expect(audioMatch(detect(s), 'fr')).toBe('sure');
        }
    });

    test('MULTi sans détail : français possible', () => {
        const d = detect(torrentio('Film.2024.MULTi.1080p.WEB'));
        expect(audioMatch(d, 'fr')).toBe('maybe');
        expect(badge(d)).toBe('MULTi');
    });

    test('Torrentio « Multi Audio » : ses drapeaux sont l\'audio', () => {
        expect(audioMatch(detect(MULTI), 'fr')).toBe('sure');
        expect(badge(detect(MULTI))).toBe('VF');
        expect(audioMatch(detect(torrentio('Film.2024.MULTi.1080p\nMulti Audio / 🇬🇧 / 🇪🇸')), 'fr')).toBe(null);
    });

    test('Torrentio, drapeaux seuls : premier = audio, suivants = sous-titres', () => {
        // Pistes réelles lues le 2026-11-05 : audio anglais seul, sous-titres français.
        const d = detect(torrentio('Backrooms 2026 BluRay 1080p DDP 5 1 x264-hallowed\n👤 96 💾 8.25 GB ⚙️ ThePirateBay\n🇬🇧 / 🇪🇸 / 🇫🇷'));
        expect(audioMatch(d, 'fr')).toBe(null);
        expect(audioMatch(d, 'es')).toBe(null);
        expect(audioMatch(d, 'en')).toBe('maybe');
        expect(subsMatch(d, 'fr')).toBe('maybe');
        expect(badge(d)).toBe('ST FR ?');
    });

    test('codes de sortie : audio, mais pas un mot du titre', () => {
        expect(audioMatch(detect(torrentio('Parasite.2019.MULTi.KOR.Bluray.1080p')), 'ko')).toBe('sure');
        expect(audioMatch(detect(torrentio('Dune (2024 Eng 7.1-Fre 5.1-Spa 5.1)')), 'es')).toBe('sure');
        expect(audioMatch(detect(torrentio('The.Italian.Job.2003.1080p.BluRay')), 'it')).toBe(null);
    });

    test('drapeaux d\'une sortie à sous-titres : pas de l\'audio', () => {
        expect(audioMatch(detect(SUBS), 'fr')).toBe(null);
        expect(subsMatch(detect(SUBS), 'fr')).toBe('maybe');
        expect(audioMatch(detect(PL), 'fr')).toBe(null);
        expect(badge(detect(SUBS))).toBe('ST FR ?');
    });

    test('VOSTFR : sous-titres français, pas d\'audio français', () => {
        const d = detect(VOSTFR);
        expect(audioMatch(d, 'fr')).toBe(null);
        expect(subsMatch(d, 'fr')).toBe('sure');
        expect(badge(d)).toBe('VOSTFR');
    });

    test('rien de français', () => {
        expect(audioMatch(detect(ENGLISH_ONLY), 'fr')).toBe(null);
        expect(subsMatch(detect(ENGLISH_ONLY), 'fr')).toBe(null);
        expect(audioMatch(detect(MEDIAFUSION_NONE), 'fr')).toBe(null);
        expect(badge(detect(MEDIAFUSION_NONE))).toBe(null);
    });

    test('Multi Subs n\'est pas du multi-audio', () => {
        const d = detect(torrentio('[moon] Dune: Part Two 2024 1080p WEBRip x264 AC3 MultiSubs\nMulti Subs / 🇬🇧 / 🇫🇷'));
        expect(d.multi).toBe(false);
        expect(audioMatch(d, 'fr')).toBe(null);
        expect(subsMatch(d, 'fr')).toBe('maybe');
    });

    test('liste de langues après « Sub » : sous-titres, pas audio', () => {
        const d = detect(torrentio('The Shawshank Redemption 1994 BRRip Sub Eng-Arabic-French-Swedish\n🇬🇧 / 🇫🇷'));
        expect(audioMatch(d, 'fr')).toBe(null);
        expect(subsMatch(d, 'fr')).toBe('sure');
        expect(audioMatch(detect(torrentio('Movie 2020 1080p French Eng Subs')), 'fr')).toBe('sure');
    });

    test('pistes réelles : priment sur le titre', () => {
        // Résultat réel de /hlsv2/probe sur « Les evades 1994 - 1080p FR EN » (2026-10-30).
        const d = fromProbe([
            { track: 'video', language: null }, { track: 'audio', language: 'fre' }, { track: 'audio', language: 'eng' },
            { track: 'subtitle', language: 'eng' }, { track: 'subtitle', language: 'fre' },
        ]);
        expect(audioMatch(d, 'fr')).toBe('sure');
        expect(subsMatch(d, 'fr')).toBe('sure');
        expect(audioMatch(d, 'ja')).toBe(null);
        expect(badge(d)).toBe('✓ FR EN · ST FR');
    });

    test('pistes réelles : drapeau 🇫🇷 qui n\'était qu\'un sous-titre', () => {
        const d = fromProbe([{ track: 'audio', language: 'eng' }, { track: 'subtitle', language: 'fre' }]);
        expect(audioMatch(d, 'fr')).toBe(null);
        expect(subsMatch(d, 'fr')).toBe('sure');
    });

    test('pistes réelles sans langue : titre de piste', () => {
        const d = fromProbe([{ track: 'audio', language: null, title: 'VFF AC3 5.1' }, { track: 'audio', language: 'und', title: 'English' }]);
        expect([...d.audio]).toEqual(['fr', 'en']);
    });

    test('anglais', () => {
        expect(audioMatch(detect(FR_EN), 'en')).toBe('sure');
        expect(audioMatch(detect(ENGLISH_ONLY), 'en')).toBe('maybe');
    });
});
