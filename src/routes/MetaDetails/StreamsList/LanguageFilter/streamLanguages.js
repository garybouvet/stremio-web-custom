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
const SUBS_FR = /\b(VOSTFR|VOST|SUBFRENCH|STFR|ST[ ._-]FR|SUBS?[ ._:-]*(FR|FRE|FRENCH)|FRENCH[ ._-]?SUBS?)\b/i;
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

// 'sure' | 'maybe' | null pour une langue audio donnée.
const audioMatch = (d, lang) => {
    if (d.audio.has(lang)) return 'sure';
    // Sortie qui annonce des sous-titres : ses drapeaux sont ceux des sous-titres, pas de l'audio.
    if (d.multi || (d.flags.has(lang) && !d.subs.has(lang) && !d.subsHint)) return 'maybe';
    return null;
};

const subsMatch = (d, lang) => {
    if (d.subs.has(lang)) return 'sure';
    if (d.flags.has(lang) && !d.audio.has(lang)) return 'maybe';
    return null;
};

// Étiquette courte affichée sur le lien, pour la langue suivie (fr par défaut).
const badge = (d, lang = 'fr') => {
    if (d.subs.has(lang) && !d.audio.has(lang)) return lang === 'fr' ? 'VOSTFR' : `ST ${lang.toUpperCase()}`;
    if (d.audio.has(lang)) return lang === 'fr' ? 'VF' : lang.toUpperCase();
    if (d.multi) return 'MULTi';
    if (d.flags.has(lang)) return d.subsHint ? `ST ${lang.toUpperCase()} ?` : `${lang.toUpperCase()} ?`;
    return null;
};

module.exports = { detect, audioMatch, subsMatch, badge };
