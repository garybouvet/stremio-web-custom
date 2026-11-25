// Copyright (C) 2017-2026 Smart code 203358507

// Fiche d'un titre donnée par le moteur local (api/preview), partagée par Découvrir, la fiche et le choix du lien.
// Sans moteur ou sans réponse, Stremio garde ses propres données.

const React = require('react');

const MAX_KEPT = 200;
const kept = new Map();

// Lien du lecteur comme le fabrique stremio-core : flux en JSON, compressé (zlib), en base64.
const playerHref = async (stream) => {
    const zipped = new Blob([JSON.stringify(stream)]).stream().pipeThrough(new CompressionStream('deflate'));
    const bytes = new Uint8Array(await new Response(zipped).arrayBuffer());
    return `#/player/${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`;
};

const load = async (type, id) => {
    const response = await fetch(`api/preview?${new URLSearchParams({ type, id })}`, { headers: { 'X-Stremio-Custom': '1' } });
    if (!response.ok) throw new Error(response.status);
    const body = await response.json();
    return { ...body, trailerHref: body.trailer ? await playerHref({ ytId: body.trailer }) : null };
};

const getPreview = (type, id) => {
    const key = `${type}:${id}`;
    if (!kept.has(key)) {
        if (kept.size >= MAX_KEPT) kept.clear();
        kept.set(key, load(type, id).catch(() => {
            kept.delete(key);
            return null;
        }));
    }
    return kept.get(key);
};

const useCustomPreview = (type, id, delay = 0) => {
    const [preview, setPreview] = React.useState(null);
    React.useEffect(() => {
        let current = true;
        setPreview(null);
        if (!id || !['movie', 'series'].includes(type)) return;
        const timer = setTimeout(() => getPreview(type, id).then((body) => current && setPreview(body)), delay);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    }, [type, id, delay]);
    return preview;
};

// Bande-annonce en français si elle existe, sinon celle de Stremio, sinon celle du moteur dans une autre langue.
const trailerOf = (preview, own) => preview?.trailerLang === 'fr' ? preview.trailerHref : own ?? preview?.trailerHref ?? null;

module.exports = { useCustomPreview, trailerOf };
