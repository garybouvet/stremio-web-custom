// Copyright (C) 2017-2026 Smart code 203358507

// Textes ajoutés à Stremio dans la langue de son interface : français ou anglais, l'anglais pour les autres langues.
// Les noms de pays et de langues ne sont pas ici : Intl.DisplayNames les donne dans toutes les langues.

const React = require('react');
const { useTranslation } = require('react-i18next');
const interfaceLanguages = require('../interfaceLanguages.json');
const fr = require('./fr');
const en = require('./en');

const DICTIONARIES = { fr, en };

// Langue de l'interface (« eng », « fr-FR »…) en code à deux lettres.
const twoLetters = (code) => {
    const known = interfaceLanguages.find((l) => l.codes.includes(code));
    const tag = known ? known.codes[0] : code;
    return typeof tag === 'string' && /^[a-z]{2}(-|$)/i.test(tag) ? tag.slice(0, 2).toLowerCase() : 'en';
};

const textsFor = (lang) => DICTIONARIES[lang] || en;

// { lang, T } : se met à jour quand on change la langue dans les réglages de Stremio.
const useCustomTexts = () => {
    const { i18n } = useTranslation();
    const lang = twoLetters(i18n.language);
    return React.useMemo(() => ({ lang, T: textsFor(lang) }), [lang]);
};

module.exports = { twoLetters, textsFor, useCustomTexts };
