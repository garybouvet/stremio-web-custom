// Copyright (C) 2017-2026 Smart code 203358507

// Barre du choix du lien, au-dessus de la liste : langues, qualité, taille, prêts à lire.
// Textes dans la langue de Stremio : common/customTexts.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { default: MultiselectMenu } = require('stremio/components/MultiselectMenu');
const { useCustomTexts } = require('stremio/common/customTexts');
const { OpenInApp } = require('./parts');
const styles = require('./LinkPicker.less');

const QUALITIES = [['2160', '4K'], ['1080', '1080p'], ['720', '720p']].map(([value, label]) => ({ value, label }));
const SIZES = ['5', '10', '20', '40'];

const Menu = ({ label, any, options, value, onSelect }) => {
    const L = useCustomTexts().T.links;
    const selected = options.find((o) => o.value === value);
    return (
        <MultiselectMenu
            className={styles['menu']}
            portal={true}
            title={selected ? L.menuValue(label, selected.label) : label}
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

const LinkPicker = ({ filter, set, audioOptions, subsOptions, shown, total, verify, verifiable, verifying, local, twinHref }) => {
    const L = useCustomTexts().T.links;
    const sizes = SIZES.map((value) => ({ value, label: L.sizeAtMost(value) }));
    return (
        <div className={styles['link-picker']}>
            <div className={styles['menus']}>
                <Menu label={L.audio} any={L.anyAudio} options={audioOptions} value={filter.audio} onSelect={(v) => set('audio', v)} />
                <Menu label={L.subs} any={L.anySubs} options={subsOptions} value={filter.subs} onSelect={(v) => set('subs', v)} />
                <Menu label={L.quality} any={L.anyQuality} options={QUALITIES} value={filter.quality} onSelect={(v) => set('quality', v)} />
                <Menu label={L.size} any={L.anySize} options={sizes} value={filter.maxSize} onSelect={(v) => set('maxSize', v)} />
            </div>
            <div className={styles['switches']}>
                <Switch on={filter.readyOnly} title={L.readyHelp} onClick={() => set('readyOnly', !filter.readyOnly)}>{L.ready}</Switch>
                {filter.audio || filter.subs ?
                    <Switch on={filter.includeMaybe} title={L.maybeHelp} onClick={() => set('includeMaybe', !filter.includeMaybe)}>{L.maybe}</Switch>
                    :
                    null
                }
                {verifying || verifiable > 0 ?
                    <Button className={styles['switch']} title={L.verifyHelp} disabled={!!verifying} onClick={verify}>
                        {verifying ? L.verifying(verifying.done, verifying.total) : L.verify(verifiable)}
                    </Button>
                    :
                    null
                }
                {local ? null : <OpenInApp />}
                {twinHref ? <Button className={styles['switch']} title={L.twinHelp} href={twinHref}>{L.twin}</Button> : null}
                <span className={styles['count']}>{L.count(shown, total)}</span>
            </div>
        </div>
    );
};

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
