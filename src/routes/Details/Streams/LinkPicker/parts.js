// Copyright (C) 2017-2026 Smart code 203358507

// Petits morceaux du choix du lien : étiquettes d'un lien, message quand rien n'est prêt, renvoi vers l'appli.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const styles = require('./LinkPicker.less');

const TEXTS = { wrong: 'Autre titre ?', wrongHelp: 'Le nom du fichier ne ressemble pas à ce titre', open: 'Ouvrir dans Stremio' };

const qualityName = (q) => q === 2160 ? '4K' : `${q}p`;
const sizeName = (gb) => gb >= 1 ? `${gb.toLocaleString('fr', { maximumFractionDigits: 1 })} Go` : `${Math.round(gb * 1024)} Mo`;

const Badges = ({ link }) => (
    <div className={styles['badges']}>
        {link.badge ? <span className={classnames(styles['badge'], styles['language'], { [styles['verified']]: link.d.verified })}>{link.badge}</span> : null}
        {link.quality ? <span className={styles['badge']}>{qualityName(link.quality)}</span> : null}
        {link.hdr ? <span className={styles['badge']}>{link.hdr}</span> : null}
        {link.size !== null ? <span className={styles['size']}>{sizeName(link.size)}</span> : null}
        {link.wrong ? <span className={classnames(styles['badge'], styles['warning'])} title={TEXTS.wrongHelp}>{TEXTS.wrong}</span> : null}
    </div>
);

Badges.propTypes = {
    link: PropTypes.object,
};

const RELAX = {
    maybe: (n) => `Voir ${n} MULTi ou incertain${n > 1 ? 's' : ''}`,
    sizes: (n) => `Voir ${n} d’une autre qualité ou taille`,
    languages: (n) => `Voir ${n} dans une autre langue`,
    later: (n) => `Voir ${n} à télécharger d’abord`,
};

const EmptyLinks = ({ languageName, hidden, relax }) => (
    <div className={styles['empty']}>
        <p>{languageName ? `Aucun lien prêt à lire en ${languageName}.` : 'Aucun lien prêt à lire.'}</p>
        {Object.keys(RELAX).filter((key) => hidden[key] > 0).map((key) => (
            <Button key={key} className={styles['action']} onClick={() => relax(key)}>{RELAX[key](hidden[key])}</Button>
        ))}
    </div>
);

EmptyLinks.propTypes = {
    languageName: PropTypes.string,
    hidden: PropTypes.objectOf(PropTypes.number),
    relax: PropTypes.func,
};

// Le navigateur ne décode pas toujours le son (AC3, DTS) : dans l'interface hébergée, on propose l'appli.
const OpenInApp = () => (
    <Button className={styles['action']} title={'Ouvre cette fiche dans l’appli Stremio (lecteur complet)'} href={window.location.hash.replace(/^#\//, 'stremio:///')}>
        {TEXTS.open}
    </Button>
);

module.exports = { Badges, EmptyLinks, OpenInApp };
