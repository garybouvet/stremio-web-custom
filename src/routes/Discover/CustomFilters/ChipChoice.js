// Copyright (C) 2017-2026 Smart code 203358507

// Choix multiples (pays, langues, plateformes) : deux menus, « Inclure » et « Exclure », puis une pastille par choix.
// Un clic sur une pastille passe d'inclus à exclu ; la croix l'enlève.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: MultiselectMenu } = require('stremio/components/MultiselectMenu');
const { useLabels } = require('./labels');
const styles = require('./styles');

const ChipChoice = ({ label, options, value, onChange }) => {
    const { TEXTS } = useLabels();
    if (options.length === 0) return null;
    const names = Object.fromEntries(options.map((o) => [o.value, o.label]));
    const free = options.filter((o) => !value[o.value]);
    const put = (state) => (code) => code && onChange({ ...value, [code]: state });
    const remove = (code) => {
        const next = { ...value };
        delete next[code];
        onChange(next);
    };
    return (
        <div className={classnames(styles['field'], styles['wide'])} role={'group'} aria-label={label}>
            <div className={styles['label']}>{label}</div>
            <div className={styles['pair']}>
                <MultiselectMenu className={styles['menu']} portal={true} title={TEXTS.include} options={free} value={''} onSelect={put('in')} />
                <MultiselectMenu className={styles['menu']} portal={true} title={TEXTS.exclude} options={free} value={''} onSelect={put('out')} />
            </div>
            {Object.keys(value).length > 0 ?
                <div className={styles['chips']}>
                    {Object.keys(value).map((code) => (
                        <span key={code} className={classnames(styles['chip'], styles[value[code]])}>
                            <Button className={styles['chip-label']} title={TEXTS.switchState} onClick={() => onChange({ ...value, [code]: value[code] === 'in' ? 'out' : 'in' })}>
                                {`${value[code] === 'in' ? '' : TEXTS.without}${names[code] ?? code}`}
                            </Button>
                            <Button className={styles['chip-remove']} aria-label={`${TEXTS.remove} ${names[code] ?? code}`} onClick={() => remove(code)}>
                                <Icon className={styles['icon']} name={'close'} />
                            </Button>
                        </span>
                    ))}
                </div>
                :
                null
            }
        </div>
    );
};

ChipChoice.propTypes = {
    label: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
    value: PropTypes.objectOf(PropTypes.string),
    onChange: PropTypes.func,
};

module.exports = ChipChoice;
