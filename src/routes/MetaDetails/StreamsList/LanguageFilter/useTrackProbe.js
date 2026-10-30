// Copyright (C) 2017-2026 Smart code 203358507

// Pistes réelles des liens Real-Debrid déjà en cache : le serveur de streaming (relayé en /ss/) lit l'en-tête
// du fichier avec ffprobe. Effet de bord, comme une lecture : le torrent s'ajoute à la liste Real-Debrid.
// Les liens non en cache et les torrents P2P ne sont pas sondés (il faudrait télécharger).

const React = require('react');

const STORAGE_KEY = 'stream_tracks';
const MAX_STORED = 1000;
const MAX_PER_CLICK = 15;
const PARALLEL = 3;

const isCachedDebrid = (s) => /\[RD\+\]|⚡/u.test(`${s.name || ''}\n${s.description || ''}`);
const probeable = (s) => typeof s.url === 'string' && /^https?:\/\//.test(s.url) && isCachedDebrid(s);

// Empreinte de l'adresse : la clé Real-Debrid qu'elle contient n'est pas recopiée en clair dans le stockage.
const keyOf = (url) => {
    let h = 2166136261;
    for (let i = 0; i < url.length; i++) {
        h = Math.imul(h ^ url.charCodeAt(i), 16777619);
    }
    return (h >>> 0).toString(36) + url.length.toString(36);
};

const loadStored = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
};

const probe = (url) => fetch(`ss/hlsv2/probe?mediaURL=${encodeURIComponent(url)}`)
    .then((r) => r.ok ? r.json() : Promise.reject(r.status))
    .then((body) => Array.isArray(body.streams) ? body.streams.map(({ track, language, title }) => ({ track, language, title })) : Promise.reject('format'));

const useTrackProbe = () => {
    const [tracks, setTracks] = React.useState(loadStored);
    const [running, setRunning] = React.useState(null); // { done, total } pendant une vérification

    const tracksOf = React.useCallback((stream) => probeable(stream) ? tracks[keyOf(stream.url)] ?? null : null, [tracks]);
    const pending = React.useCallback((streams) => streams.filter((s) => probeable(s) && !tracks[keyOf(s.url)]), [tracks]);

    const verify = React.useCallback((streams) => {
        const queue = pending(streams).slice(0, MAX_PER_CLICK);
        if (queue.length === 0 || running) return;
        let done = 0;
        setRunning({ done, total: queue.length });
        const store = (key, value) => setTracks((current) => {
            const next = { ...current, [key]: value };
            const keys = Object.keys(next);
            keys.slice(0, Math.max(0, keys.length - MAX_STORED)).forEach((k) => delete next[k]);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // stockage plein ou indisponible : le résultat reste en mémoire pour cette session
            }
            return next;
        });
        const worker = async () => {
            while (queue.length > 0) {
                const stream = queue.shift();
                try {
                    store(keyOf(stream.url), await probe(stream.url));
                } catch {
                    // fichier illisible ou lien expiré : on le laisse non vérifié
                }
                done += 1;
                setRunning({ done, total: done + queue.length });
            }
        };
        Promise.all(Array.from({ length: PARALLEL }, worker)).finally(() => setRunning(null));
    }, [pending, running]);

    return { tracksOf, verify, running, pendingCount: (streams) => Math.min(MAX_PER_CLICK, pending(streams).length) };
};

module.exports = { useTrackProbe, probeable };
