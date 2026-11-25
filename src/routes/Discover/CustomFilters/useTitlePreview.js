// Copyright (C) 2017-2026 Smart code 203358507

// Complète l'aperçu de Découvrir : résumé français, casting, bande-annonce, notes des autres sites, plateformes.
// Sans moteur ou sans réponse, l'aperçu reste celui de Stremio.

const React = require('react');
const PropTypes = require('prop-types');
const { SCORE_NAMES } = require('./labels');
const styles = require('./styles');

const DELAY = 150; // le temps de passer sur une affiche sans s'y arrêter
const ORDER = Object.keys(SCORE_NAMES);

// Lien du lecteur comme le fabrique stremio-core : flux en JSON, compressé (zlib), en base64.
const playerHref = async (stream) => {
    const zipped = new Blob([JSON.stringify(stream)]).stream().pipeThrough(new CompressionStream('deflate'));
    const bytes = new Uint8Array(await new Response(zipped).arrayBuffer());
    return `#/player/${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`;
};

const people = (names, category) => (names || []).map((name) => ({ name, category, url: `stremio:///search?search=${encodeURIComponent(name)}` }));

const Scores = ({ ratings, places }) => {
    const shown = ORDER.filter((s) => ratings[s]);
    return shown.length + places.length === 0 ? null : (
        <div className={styles['scores']}>
            {shown.map((s) => (
                <span key={s} className={styles['score']}>
                    {SCORE_NAMES[s]}
                    <strong>{ratings[s].toLocaleString('fr', { maximumFractionDigits: 1 })}</strong>
                </span>
            ))}
            {places.slice(0, 4).map((p) => <span key={p} className={styles['score']}><strong>{p}</strong></span>)}
        </div>
    );
};

Scores.propTypes = {
    ratings: PropTypes.objectOf(PropTypes.number),
    places: PropTypes.arrayOf(PropTypes.string),
};

const useTitlePreview = (item) => {
    const [preview, setPreview] = React.useState(null);
    const id = item?.id ?? null;
    const type = item?.type ?? null;

    React.useEffect(() => {
        setPreview(null);
        if (id === null || !['movie', 'series'].includes(type)) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`api/preview?${new URLSearchParams({ type, id })}`, { headers: { 'X-Stremio-Custom': '1' }, signal: controller.signal });
                const body = response.ok ? await response.json() : null;
                const trailerHref = body?.trailer ? await playerHref({ ytId: body.trailer }) : null;
                if (!controller.signal.aborted && body !== null) setPreview({ ...body, trailerHref });
            } catch {
                // moteur ou TMDB injoignable : l'aperçu garde ce que le catalogue donne
            }
        }, DELAY);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [id, type]);

    return React.useMemo(() => {
        if (item === null || preview === null) return {};
        const links = item.links || [];
        const missing = (category, names) => links.some((l) => l?.category === category) ? [] : people(names, category);
        return {
            description: preview.description,
            trailerHref: preview.trailerHref,
            links: links.concat(missing('Cast', preview.cast), missing('Directors', preview.directors)),
            metadata: <Scores ratings={preview.ratings} places={preview.places} />,
        };
    }, [item, preview]);
};

module.exports = { useTitlePreview };
