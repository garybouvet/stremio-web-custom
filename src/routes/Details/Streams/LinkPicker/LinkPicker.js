// Copyright (C) 2017-2026 Smart code 203358507

// Barre du choix du lien, au-dessus de la liste : langues, qualité, taille, prêts à lire.
// Interface volontairement en français seul : textes écrits ici plutôt que dans stremio-translations.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { default: MultiselectMenu } = require('stremio/components/MultiselectMenu');
const { OpenInApp } = require('./parts');
const styles = require('./LinkPicker.less');

const QUALITIES = [['2160', '4K'], ['1080', '1080p'], ['720', '720p']].map(([value, label]) => ({ value, label }));
const SIZES = ['5', '10', '20', '40'].map((value) => ({ value, label: `${value} Go au plus` }));
const TEXTS = {
    ready: 'Prêts à lire', maybe: 'MULTi et incertains', twin: 'Autre numéro IMDb',
    twinHelp: 'Ce titre existe aussi sous un autre numéro IMDb ; les sources y ont parfois d’autres liens',
};
const VERIFY_HELP = 'Lit les vraies pistes audio et sous-titres des liens Real-Debrid en cache affichés (15 au plus). Comme une lecture, chaque torrent vérifié s’ajoute à ta liste Real-Debrid.';

const Menu = ({ label, any, options, value, onSelect }) => {
    const selected = options.find((o) => o.value === value);
    return (
        <MultiselectMenu
            className={styles['menu']}
            portal={true}
            title={selected ? `${label} : ${selected.label}` : label}
            options={[{ value: '', label: any }, ...options]}
            value={value}
            onSelect={onSelect}
        />
    );
};

Menu.propTypes = {
    label: PropTypes.string,
    any: PropTypes.string,
    options: PropTypes.array,
    value: PropTypes.string,
    onSelect: PropTypes.func,
};

const Switch = ({ on, title, onClick, children }) => (
    <Button className={classnames(styles['switch'], { [styles['on']]: on })} role={'switch'} aria-checked={on} title={title} onClick={onClick}>
        {children}
    </Button>
);

Switch.propTypes = {
    on: PropTypes.bool,
    title: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
};

const LinkPicker = ({ filter, set, audioOptions, subsOptions, shown, total, verify, verifiable, verifying, local, twinHref }) => (
    <div className={styles['link-picker']}>
        <div className={styles['menus']}>
            <Menu label={'Audio'} any={'Toutes les langues'} options={audioOptions} value={filter.audio} onSelect={(v) => set('audio', v)} />
            <Menu label={'Sous-titres'} any={'Tous les sous-titres'} options={subsOptions} value={filter.subs} onSelect={(v) => set('subs', v)} />
            <Menu label={'Qualité'} any={'Toutes les qualités'} options={QUALITIES} value={filter.quality} onSelect={(v) => set('quality', v)} />
            <Menu label={'Taille'} any={'Toutes les tailles'} options={SIZES} value={filter.maxSize} onSelect={(v) => set('maxSize', v)} />
        </div>
        <div className={styles['switches']}>
            <Switch on={filter.readyOnly} title={'Cache les liens à télécharger d’abord (⏳, [RD download])'} onClick={() => set('readyOnly', !filter.readyOnly)}>{TEXTS.ready}</Switch>
            {filter.audio || filter.subs ?
                <Switch on={filter.includeMaybe} title={'MULTi peut contenir la langue ; les drapeaux mélangent audio et sous-titres'} onClick={() => set('includeMaybe', !filter.includeMaybe)}>{TEXTS.maybe}</Switch>
                :
                null
            }
            {verifying || verifiable > 0 ?
                <Button className={styles['switch']} title={VERIFY_HELP} disabled={!!verifying} onClick={verify}>
                    {verifying ? `Vérification ${verifying.done} / ${verifying.total}…` : `Vérifier les pistes (${verifiable})`}
                </Button>
                :
                null
            }
            {local ? null : <OpenInApp />}
            {twinHref ? <Button className={styles['switch']} title={TEXTS.twinHelp} href={twinHref}>{TEXTS.twin}</Button> : null}
            <span className={styles['count']}>{`${shown} / ${total} liens`}</span>
        </div>
    </div>
);

LinkPicker.propTypes = {
    filter: PropTypes.object,
    set: PropTypes.func,
    audioOptions: PropTypes.array,
    subsOptions: PropTypes.array,
    shown: PropTypes.number,
    total: PropTypes.number,
    verify: PropTypes.func,
    verifiable: PropTypes.number,
    verifying: PropTypes.shape({ done: PropTypes.number, total: PropTypes.number }),
    local: PropTypes.bool,
    twinHref: PropTypes.string,
};

module.exports = LinkPicker;
