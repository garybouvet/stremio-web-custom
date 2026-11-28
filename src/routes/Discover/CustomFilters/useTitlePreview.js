// Copyright (C) 2017-2026 Smart code 203358507

// Complète l'aperçu de Découvrir : résumé dans la langue de Stremio, casting, bande-annonce, notes des autres sites, plateformes.
// Sans moteur ou sans réponse, l'aperçu reste celui de Stremio.

const React = require('react');
const PropTypes = require('prop-types');
const { useCustomPreview, trailerOf } = require('stremio/common/customPreview');
const { useLabels } = require('./labels');
const styles = require('./styles');

const DELAY = 150; // le temps de passer sur une affiche sans s'y arrêter
const ORDER = ['tmdb', 'tomatoes', 'popcorn', 'metacritic', 'metacriticuser', 'trakt', 'letterboxd'];

const people = (names, category) => (names || []).map((name) => ({ name, category, url: `stremio:///search?search=${encodeURIComponent(name)}` }));

const Scores = ({ ratings, places }) => {
    const { SCORE_NAMES, lang } = useLabels();
    const shown = ORDER.filter((s) => ratings[s]);
    return shown.length + places.length === 0 ? null : (
        <div className={styles['scores']}>
            {shown.map((s) => (
                <span key={s} className={styles['score']}>
                    {SCORE_NAMES[s]}
                    <strong>{ratings[s].toLocaleString(lang, { maximumFractionDigits: 1 })}</strong>
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
    const preview = useCustomPreview(item?.type, item?.id, DELAY);

    return React.useMemo(() => {
        if (!item) return {};
        const own = item.trailerStreams?.[0]?.deepLinks.player ?? null;
        if (preview === null) return { trailerHref: own };
        const links = item.links || [];
        const missing = (category, names) => links.some((l) => l?.category === category) ? [] : people(names, category);
        return {
            description: preview.description,
            trailerHref: trailerOf(preview, own),
            links: links.concat(missing('Cast', preview.cast), missing('Directors', preview.directors)),
            metadata: <Scores ratings={preview.ratings} places={preview.places} />,
        };
    }, [item, preview]);
};

module.exports = { useTitlePreview };
