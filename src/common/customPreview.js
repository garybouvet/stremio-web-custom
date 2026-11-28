// Copyright (C) 2017-2026 Smart code 203358507

// Fiche d'un titre donnée par le moteur local (api/preview), partagée par Découvrir, la fiche et le choix du lien.
// Résumé et bandes-annonces dans la langue de l'interface de Stremio. Sans moteur ou sans réponse, Stremio garde ses données.

const React = require('react');
const { useCustomTexts } = require('./customTexts');

const MAX_KEPT = 200;
const kept = new Map();

// Lien du lecteur comme le fabrique stremio-core : flux en JSON, compressé (zlib), en base64.
const playerHref = async (stream) => {
    const zipped = new Blob([JSON.stringify(stream)]).stream().pipeThrough(new CompressionStream('deflate'));
    const bytes = new Uint8Array(await new Response(zipped).arrayBuffer());
    return `#/player/${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`;
};

const load = async (type, id, lang) => {
    const response = await fetch(`api/preview?${new URLSearchParams({ type, id, lang })}`, { headers: { 'X-Stremio-Custom': '1' } });
    if (!response.ok) throw new Error(response.status);
    const body = await response.json();
    const trailers = await Promise.all((body.trailers || []).map(async (t) => ({ ...t, href: await playerHref({ ytId: t.key }) })));
    return { ...body, lang, trailers, trailerHref: trailers[0]?.href ?? null };
};

const getPreview = (type, id, lang) => {
    const key = `${type}:${id}:${lang}`;
    if (!kept.has(key)) {
        if (kept.size >= MAX_KEPT) kept.clear();
        kept.set(key, load(type, id, lang).catch(() => {
            kept.delete(key);
            return null;
        }));
    }
    return kept.get(key);
};

const useCustomPreview = (type, id, delay = 0) => {
    const { lang } = useCustomTexts();
    const [preview, setPreview] = React.useState(null);
    React.useEffect(() => {
        let current = true;
        setPreview(null);
        if (!id || !['movie', 'series'].includes(type)) return;
        const timer = setTimeout(() => getPreview(type, id, lang).then((body) => current && setPreview(body)), delay);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    }, [type, id, delay, lang]);
    return preview;
};

// Bande-annonce dans la langue de Stremio si le moteur l'a trouvée, sinon celle de Stremio, sinon une autre du moteur.
const trailerOf = (preview, own) => preview?.trailers?.find((t) => t.lang === preview.lang)?.href ?? own ?? preview?.trailerHref ?? null;

// Toutes les langues trouvées (FR, VOSTFR, EN…), pour les pastilles à côté du bouton.
const trailerChoices = (preview) => preview?.trailers ?? [];

module.exports = { useCustomPreview, trailerOf, trailerChoices };
