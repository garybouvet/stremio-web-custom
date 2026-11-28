// Copyright (C) 2017-2026 Smart code 203358507

// Petits morceaux du choix du lien : étiquettes d'un lien, message quand rien n'est prêt, renvoi vers l'appli.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { useCustomTexts } = require('stremio/common/customTexts');
const styles = require('./LinkPicker.less');

const qualityName = (q) => q === 2160 ? '4K' : `${q}p`;
const sizeName = (gb, lang, L) => gb >= 1 ? `${gb.toLocaleString(lang, { maximumFractionDigits: 1 })} ${L.gb}` : `${Math.round(gb * 1024)} ${L.mb}`;

const Badges = ({ link }) => {
    const { lang, T } = useCustomTexts();
    return (
        <div className={styles['badges']}>
            {link.badge ? <span className={classnames(styles['badge'], styles['language'], { [styles['verified']]: link.d.verified })}>{link.badge}</span> : null}
            {link.quality ? <span className={styles['badge']}>{qualityName(link.quality)}</span> : null}
            {link.hdr ? <span className={styles['badge']}>{link.hdr}</span> : null}
            {link.size !== null ? <span className={styles['size']}>{sizeName(link.size, lang, T.links)}</span> : null}
            {link.wrong ? <span className={classnames(styles['badge'], styles['warning'])} title={T.links.wrongHelp}>{T.links.wrong}</span> : null}
        </div>
    );
};

Badges.propTypes = {
    link: PropTypes.object,
};

const RELAX_ORDER = ['maybe', 'sizes', 'languages', 'later'];

const EmptyLinks = ({ languageName, hidden, relax }) => {
    const L = useCustomTexts().T.links;
    return (
        <div className={styles['empty']}>
            <p>{L.noneReady(languageName)}</p>
            {RELAX_ORDER.filter((key) => hidden[key] > 0).map((key) => (
                <Button key={key} className={styles['action']} onClick={() => relax(key)}>{L.relax[key](hidden[key])}</Button>
            ))}
        </div>
    );
};

EmptyLinks.propTypes = {
    languageName: PropTypes.string,
    hidden: PropTypes.objectOf(PropTypes.number),
    relax: PropTypes.func,
};

// Le navigateur ne décode pas toujours le son (AC3, DTS) : dans l'interface hébergée, on propose l'appli.
const OpenInApp = () => {
    const L = useCustomTexts().T.links;
    return (
        <Button className={styles['action']} title={L.openHelp} href={window.location.hash.replace(/^#\//, 'stremio:///')}>
            {L.open}
        </Button>
    );
};

module.exports = { Badges, EmptyLinks, OpenInApp };
