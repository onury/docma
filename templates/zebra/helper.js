'use strict';

/**
 *  Helper module for Zebra Template.
 *  @author Onur Yıldırım <onur@cutepilot.com>
 *  @license MIT
 *  @since Docma 2.0.0
 */

module.exports = (template, modules) => {

    const { _, utils } = modules;
    const opts = template.options;
    const typeOf = utils.type;

    // HELPER HELPERS :P

    /**
     *  Sets the given option to the new-structure options if it's set in
     *  the old/provided. If doesn't exist, it's already set on the new via
     *  defaults.
     *  @private
     *
     *  @param {String} oldProp - Property/option name to be checked on the
     *  old-structure options.
     *  @param {String|Array} oldType - Expected type(s) of `prop` on the
     *  old-structure options.
     *  @param {Object} target - Target object of the new-structure template
     *  options which the value will be set on.
     *  @param {String} [rename] - New property/option name to be set on the
     *  new-structure options.
     */
    function setOpt(oldProp, oldType, target, rename) {
        const types = utils.ensureArray(oldType);
        if (oldProp in opts && types.indexOf(typeOf(opts[oldProp])) >= 0) {
            target[rename || oldProp] = opts[oldProp];
        }
    }

    const helper = {
        /**
         *  If a string is directly passed to `template.options.logo`, we'll set
         *  both dark and light logos to the same value.
         */
        setDarkLightLogos() {
            // if a string passed to `logo`, we'll set both dark and light logo to
            // this value.
            const logo = opts.logo;
            if (typeof logo === 'string') {
                opts.logo = {
                    dark: logo,
                    light: logo
                };
            }
        },
        /**
         *  If a string is directly passed to `template.options.title`, we'll set
         *  we'll set `title.label` to this and set `title.href` to '#'.
         */
        setTitle() {
            const title = opts.title;
            if (typeof title === 'string') {
                opts.title = {
                    label: title,
                    href: '#'
                };
            }
        },
        configNavMenu() {
            const navbar = template.options.navbar;
            navbar.menu = (navbar.menu || []).map(topItem => {
                if (!topItem.items || topItem.items.length === 0) return topItem;
                topItem.chevron = true;
                return _.defaultsDeep(topItem, {
                    chevron: true
                });
                // if we need to set defaults for subitems
                // topItem.items = topItem.items.map(item => {
                //     return _.defaultsDeep(item, {
                //         // prop: value
                //     });
                // });
            });
        },
        /**
         *  Checks whether the current template options (provided by the
         *  end-user) has old-structure (as in Default Template v1.x).
         */
        isOldStructureOptions: opts && (
            'navItems' in opts
            || 'collapsed' in opts
            || 'outline' in opts
            || 'search' in opts
            || ('navbar' in opts && typeof opts.navbar === 'boolean')
            || ('sidebar' in opts && typeof opts.sidebar === 'boolean')
        ),
        /**
         *  Normally we wouldn't need this, simply setting
         *  `template.defaultOptions` to some object would be enough since Docma
         *  already uses this to deeply set the defaults for end-user provided
         *  options. But almost the whole structure of Zebra options is changed.
         *  Old notation is deprecated with Docma v2.0.0; not obselete yet - so
         *  we'll need to support it for a while.
         *
         *  This method converts the current template options to the
         *  new-structure (as in Zebra Template v2.0.0).
         */
        convertOptionsToNewStructure() {
            if (!helper.isOldStructureOptions) return;

            // ---------------------------------------
            // Support For Old Structure Zebra Options
            // ---------------------------------------

            const newOpts = _.cloneDeep(template.defaultOptions);

            // .title remains the same but set from provided opts.
            setOpt('title', 'string', newOpts);

            // SIDEBAR OPTS
            // .sidebar is changed to .sidebar.enabled
            setOpt('sidebar', 'boolean', newOpts.sidebar, 'enabled');
            // .outline is changed to .sidebar.outline
            setOpt('outline', 'string', newOpts.sidebar);
            // .collapsed is changed to .sidebar.collapsed
            setOpt('collapsed', 'boolean', newOpts.sidebar);
            // .search is changed to .sidebar.search
            setOpt('search', 'boolean', newOpts.sidebar);
            // .toolbar is changed to .sidebar.toolbar
            setOpt('toolbar', 'boolean', newOpts.sidebar);
            // .badges is changed to .sidebar.badges
            setOpt('badges', ['boolean', 'string'], newOpts.sidebar);
            // .animations is changed to .sidebar.animations (and .navbar.animations)
            setOpt('animations', 'boolean', newOpts.sidebar);

            // SYMBOLS OPTS
            // .symbolMeta is changed to .symbols.meta
            setOpt('symbolMeta', 'boolean', newOpts.symbols, 'meta');

            // NAVBAR OPTS
            // .navbar is changed to .navbar.enabled
            setOpt('navbar', 'boolean', newOpts.navbar, 'enabled');
            // .navItems is changed to .navbar.menu
            setOpt('navItems', 'array', newOpts.navbar, 'menu');
            // .animations is changed to .navbar.animations (and .sidebar.animations)
            setOpt('animations', 'boolean', newOpts.navbar);

            // now we can re-set the options with the new-structure
            template.options = newOpts;
        }
    };

    return helper;
};
