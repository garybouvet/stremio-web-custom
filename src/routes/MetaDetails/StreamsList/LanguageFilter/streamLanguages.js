// Copyright (C) 2017-2026 Smart code 203358507

// Langues d'un lien, devinées depuis son texte : les addons n'ont aucun champ « langue ».
// sûr = mot explicite (FRENCH, VFF, VOSTFR, « 🌐 English + French »…) ; incertain = MULTi ou drapeau seul,
// car les drapeaux de Torrentio mélangent audio et sous-titres.

const FLAGS = {
    GB: 'en', US: 'en', FR: 'fr', BE: 'fr', CA: 'fr', ES: 'es', MX: 'es', IT: 'it', DE: 'de', PT: 'pt', BR: 'pt',
    JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh', RU: 'ru', UA: 'uk', PL: 'pl', NL: 'nl', IN: 'hi', TR: 'tr', SA: 'ar',
    SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', CZ: 'cs', HU: 'hu', GR: 'el', IL: 'he', TH: 'th', VN: 'vi',
};
const NAMES = {
    english: 'en', french: 'fr', spanish: 'es', latino: 'es', italian: 'it', german: 'de', portuguese: 'pt',
    japanese: 'ja', korean: 'ko', chinese: 'zh', russian: 'ru', ukrainian: 'uk', polish: 'pl', dutch: 'nl',
    hindi: 'hi', turkish: 'tr', arabic: 'ar', swedish: 'sv', norwegian: 'no', danish: 'da', finnish: 'fi',
    czech: 'cs', hungarian: 'hu', greek: 'el', hebrew: 'he', thai: 'th', vietnamese: 'vi',
};
// « Sub Eng-Arabic-French » : liste de langues après « Sub » = sous-titres, pas audio.
const SUBS_FR = /\b(VOSTFR|VOST|SUBFRENCH|STFR|ST[ ._-]FR|SUB(?:S|TITLES?)?[ ._:-]+(?:[a-z]{2,}[ ._,/-]+){0,6}?(?:FR|FRE|FRENCH)|FRENCH[ ._-]?SUBS?)\b/i;
const AUDIO_FR = /\b(TRUEFRENCH|FRENCH|VFF|VFQ|VFI|VF2|VF|VOF|FRA|FRE|FR)\b/i;
const AUDIO_EN = /\b(ENG|ENGLISH|EN|VO)\b/i;
const SUBS_HINT = /\bsubs?\b|subtitles?|napisy|multi[ ._-]?subs|\bmsubs\b/i;
// « Multi Subs » = plusieurs sous-titres, pas plusieurs pistes audio.
const MULTI = /\bMULTI(?![ ._-]?SUBS?\b)(?:[ ._-]?AUDIO|[ ._-]?LANG)?\b/i;
const FLAG = /([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/gu;

const regionOf = (a, b) => String.fromCharCode(a.codePointAt(0) - 0x1F1E6 + 65, b.codePointAt(0) - 0x1F1E6 + 65);

const detect = ({ name = '', description = '' } = {}) => {
    const text = `${name || ''}\n${description || ''}`;
    const audio = new Set();
    const subs = new Set();
    const flags = new Set();
    if (SUBS_FR.test(text)) subs.add('fr');
    // « VOSTFR » contient « FR » : on l'enlève avant de chercher l'audio français.
    const withoutSubs = text.replace(new RegExp(SUBS_FR.source, 'gi'), ' ');
    if (AUDIO_FR.test(withoutSubs)) audio.add('fr');
    if (AUDIO_EN.test(withoutSubs)) audio.add('en');
    // MediaFusion : « 🌐 English + French »
    const listed = text.match(/🌐\s*([^\n]+)/u);
    if (listed) {
        listed[1].split(/[+,/|]/).map((s) => NAMES[s.trim().toLowerCase()]).filter(Boolean).forEach((l) => audio.add(l));
    }
    for (const [, a, b] of text.matchAll(FLAG)) {
        const lang = FLAGS[regionOf(a, b)];
        if (lang) flags.add(lang);
    }
    return { audio, subs, flags, multi: MULTI.test(text), subsHint: SUBS_HINT.test(text) };
};

// Pistes réelles lues par ffprobe (serveur de streaming, /hlsv2/probe) : langue ISO 639-2, ou titre de piste.
const ISO3 = {
    fre: 'fr', fra: 'fr', eng: 'en', spa: 'es', ita: 'it', ger: 'de', deu: 'de', por: 'pt', jpn: 'ja', kor: 'ko',
    chi: 'zh', zho: 'zh', rus: 'ru', ukr: 'uk', pol: 'pl', dut: 'nl', nld: 'nl', hin: 'hi', tur: 'tr', ara: 'ar',
    swe: 'sv', nor: 'no', nob: 'no', dan: 'da', fin: 'fi', cze: 'cs', ces: 'cs', hun: 'hu', gre: 'el', ell: 'el',
    heb: 'he', tha: 'th', vie: 'vi',
};
const trackLang = ({ language, title }) => {
    if (ISO3[language]) return ISO3[language];
    if (typeof language === 'string' && language.length === 2) return language;
    if (/french|fran[cç]ais|\bvf[fqi2]?\b|truefrench/i.test(title || '')) return 'fr';
    if (/english|anglais/i.test(title || '')) return 'en';
    return null;
};

const fromProbe = (tracks) => {
    const pick = (kind) => new Set(tracks.filter((t) => t.track === kind).map(trackLang).filter(Boolean));
    return { audio: pick('audio'), subs: pick('subtitle'), flags: new Set(), multi: false, subsHint: false, verified: true };
};

// 'sure' | 'maybe' | null pour une langue audio donnée.
const audioMatch = (d, lang) => {
    if (d.audio.has(lang)) return 'sure';
    if (d.verified) return null;
    // Sortie qui annonce des sous-titres : ses drapeaux sont ceux des sous-titres, pas de l'audio.
    if (d.multi || (d.flags.has(lang) && !d.subs.has(lang) && !d.subsHint)) return 'maybe';
    return null;
};

const subsMatch = (d, lang) => {
    if (d.subs.has(lang)) return 'sure';
    if (d.verified) return null;
    if (d.flags.has(lang) && !d.audio.has(lang)) return 'maybe';
    return null;
};

// Étiquette courte affichée sur le lien, pour la langue suivie (fr par défaut).
const badge = (d, lang = 'fr') => {
    if (d.verified) {
        const audio = [...d.audio].map((l) => l.toUpperCase()).join(' ') || '?';
        return `✓ ${audio}${d.subs.has(lang) ? ` · ST ${lang.toUpperCase()}` : ''}`;
    }
    if (d.subs.has(lang) && !d.audio.has(lang)) return lang === 'fr' ? 'VOSTFR' : `ST ${lang.toUpperCase()}`;
    if (d.audio.has(lang)) return lang === 'fr' ? 'VF' : lang.toUpperCase();
    if (d.multi) return 'MULTi';
    if (d.flags.has(lang)) return d.subsHint ? `ST ${lang.toUpperCase()} ?` : `${lang.toUpperCase()} ?`;
    return null;
};

module.exports = { detect, fromProbe, audioMatch, subsMatch, badge };
