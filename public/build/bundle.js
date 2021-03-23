
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/FootballPitch.svelte generated by Svelte v3.35.0 */

    const file$1 = "src/FootballPitch.svelte";

    function create_fragment$1(ctx) {
    	let g;
    	let rect0;
    	let rect0_width_value;
    	let rect0_height_value;
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let circle0;
    	let circle0_cx_value;
    	let circle0_cy_value;
    	let circle0_r_value;
    	let circle1;
    	let circle1_cx_value;
    	let circle1_cy_value;
    	let circle1_r_value;
    	let circle2;
    	let circle2_cx_value;
    	let circle2_cy_value;
    	let circle2_r_value;
    	let rect1;
    	let rect1_y_value;
    	let rect1_width_value;
    	let rect1_height_value;
    	let rect2;
    	let rect2_y_value;
    	let rect2_width_value;
    	let rect2_height_value;
    	let rect3;
    	let rect3_y_value;
    	let rect3_height_value;
    	let circle3;
    	let circle3_cx_value;
    	let circle3_cy_value;
    	let circle3_r_value;
    	let circle4;
    	let circle4_cx_value;
    	let circle4_cy_value;
    	let circle4_r_value;
    	let rect4;
    	let rect4_x_value;
    	let rect4_y_value;
    	let rect4_width_value;
    	let rect4_height_value;
    	let rect5;
    	let rect5_x_value;
    	let rect5_y_value;
    	let rect5_width_value;
    	let rect5_height_value;
    	let rect6;
    	let rect6_x_value;
    	let rect6_y_value;
    	let rect6_height_value;
    	let circle5;
    	let circle5_cx_value;
    	let circle5_cy_value;
    	let circle5_r_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			rect0 = svg_element("rect");
    			line = svg_element("line");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			circle3 = svg_element("circle");
    			circle4 = svg_element("circle");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			rect6 = svg_element("rect");
    			circle5 = svg_element("circle");
    			attr_dev(rect0, "x", "0");
    			attr_dev(rect0, "y", "0");
    			attr_dev(rect0, "width", rect0_width_value = 120 * /*scale*/ ctx[0]);
    			attr_dev(rect0, "height", rect0_height_value = 90 * /*scale*/ ctx[0]);
    			attr_dev(rect0, "class", "svelte-x4a9uo");
    			add_location(rect0, file$1, 26, 4, 431);
    			attr_dev(line, "x1", line_x__value = 60 * /*scale*/ ctx[0]);
    			attr_dev(line, "y1", "0");
    			attr_dev(line, "x2", line_x__value_1 = 60 * /*scale*/ ctx[0]);
    			attr_dev(line, "y2", line_y__value = 90 * /*scale*/ ctx[0]);
    			attr_dev(line, "class", "svelte-x4a9uo");
    			add_location(line, file$1, 27, 4, 488);
    			attr_dev(circle0, "cx", circle0_cx_value = 60 * /*scale*/ ctx[0]);
    			attr_dev(circle0, "cy", circle0_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle0, "r", circle0_r_value = 9.15 * /*scale*/ ctx[0]);
    			attr_dev(circle0, "class", "svelte-x4a9uo");
    			add_location(circle0, file$1, 28, 4, 548);
    			attr_dev(circle1, "class", "spot svelte-x4a9uo");
    			attr_dev(circle1, "cx", circle1_cx_value = 60 * /*scale*/ ctx[0]);
    			attr_dev(circle1, "cy", circle1_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle1, "r", circle1_r_value = 0.5 * /*scale*/ ctx[0]);
    			add_location(circle1, file$1, 29, 4, 606);
    			attr_dev(circle2, "cx", circle2_cx_value = 11 * /*scale*/ ctx[0]);
    			attr_dev(circle2, "cy", circle2_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle2, "r", circle2_r_value = 9.15 * /*scale*/ ctx[0]);
    			attr_dev(circle2, "class", "svelte-x4a9uo");
    			add_location(circle2, file$1, 31, 4, 677);
    			attr_dev(rect1, "x", "0");
    			attr_dev(rect1, "y", rect1_y_value = 24.85 * /*scale*/ ctx[0]);
    			attr_dev(rect1, "width", rect1_width_value = 16.5 * /*scale*/ ctx[0]);
    			attr_dev(rect1, "height", rect1_height_value = 40.3 * /*scale*/ ctx[0]);
    			attr_dev(rect1, "class", "svelte-x4a9uo");
    			add_location(rect1, file$1, 32, 4, 735);
    			attr_dev(rect2, "x", "0");
    			attr_dev(rect2, "y", rect2_y_value = 35.85 * /*scale*/ ctx[0]);
    			attr_dev(rect2, "width", rect2_width_value = 5.5 * /*scale*/ ctx[0]);
    			attr_dev(rect2, "height", rect2_height_value = 18.3 * /*scale*/ ctx[0]);
    			attr_dev(rect2, "class", "svelte-x4a9uo");
    			add_location(rect2, file$1, 33, 4, 807);
    			attr_dev(rect3, "class", "goal svelte-x4a9uo");
    			attr_dev(rect3, "x", "0");
    			attr_dev(rect3, "y", rect3_y_value = 41.35 * /*scale*/ ctx[0]);
    			attr_dev(rect3, "width", 3);
    			attr_dev(rect3, "height", rect3_height_value = 7.3 * /*scale*/ ctx[0]);
    			add_location(rect3, file$1, 34, 4, 878);
    			attr_dev(circle3, "class", "spot svelte-x4a9uo");
    			attr_dev(circle3, "cx", circle3_cx_value = 11 * /*scale*/ ctx[0]);
    			attr_dev(circle3, "cy", circle3_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle3, "r", circle3_r_value = 0.5 * /*scale*/ ctx[0]);
    			add_location(circle3, file$1, 35, 4, 953);
    			attr_dev(circle4, "cx", circle4_cx_value = (120 - 11) * /*scale*/ ctx[0]);
    			attr_dev(circle4, "cy", circle4_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle4, "r", circle4_r_value = 9.15 * /*scale*/ ctx[0]);
    			attr_dev(circle4, "class", "svelte-x4a9uo");
    			add_location(circle4, file$1, 37, 4, 1024);
    			attr_dev(rect4, "x", rect4_x_value = (120 - 16.5) * /*scale*/ ctx[0]);
    			attr_dev(rect4, "y", rect4_y_value = 24.85 * /*scale*/ ctx[0]);
    			attr_dev(rect4, "width", rect4_width_value = 16.5 * /*scale*/ ctx[0]);
    			attr_dev(rect4, "height", rect4_height_value = 40.3 * /*scale*/ ctx[0]);
    			attr_dev(rect4, "class", "svelte-x4a9uo");
    			add_location(rect4, file$1, 38, 4, 1088);
    			attr_dev(rect5, "x", rect5_x_value = (120 - 5.5) * /*scale*/ ctx[0]);
    			attr_dev(rect5, "y", rect5_y_value = 35.85 * /*scale*/ ctx[0]);
    			attr_dev(rect5, "width", rect5_width_value = 5.5 * /*scale*/ ctx[0]);
    			attr_dev(rect5, "height", rect5_height_value = 18.3 * /*scale*/ ctx[0]);
    			attr_dev(rect5, "class", "svelte-x4a9uo");
    			add_location(rect5, file$1, 39, 4, 1177);
    			attr_dev(rect6, "class", "goal svelte-x4a9uo");
    			attr_dev(rect6, "x", rect6_x_value = 120 * /*scale*/ ctx[0] - 3);
    			attr_dev(rect6, "y", rect6_y_value = 41.35 * /*scale*/ ctx[0]);
    			attr_dev(rect6, "width", 3);
    			attr_dev(rect6, "height", rect6_height_value = 7.3 * /*scale*/ ctx[0]);
    			add_location(rect6, file$1, 40, 4, 1264);
    			attr_dev(circle5, "class", "spot svelte-x4a9uo");
    			attr_dev(circle5, "cx", circle5_cx_value = (120 - 11) * /*scale*/ ctx[0]);
    			attr_dev(circle5, "cy", circle5_cy_value = 45 * /*scale*/ ctx[0]);
    			attr_dev(circle5, "r", circle5_r_value = 0.5 * /*scale*/ ctx[0]);
    			add_location(circle5, file$1, 41, 4, 1351);
    			attr_dev(g, "id", "pitch");
    			add_location(g, file$1, 25, 0, 412);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, rect0);
    			append_dev(g, line);
    			append_dev(g, circle0);
    			append_dev(g, circle1);
    			append_dev(g, circle2);
    			append_dev(g, rect1);
    			append_dev(g, rect2);
    			append_dev(g, rect3);
    			append_dev(g, circle3);
    			append_dev(g, circle4);
    			append_dev(g, rect4);
    			append_dev(g, rect5);
    			append_dev(g, rect6);
    			append_dev(g, circle5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scale*/ 1 && rect0_width_value !== (rect0_width_value = 120 * /*scale*/ ctx[0])) {
    				attr_dev(rect0, "width", rect0_width_value);
    			}

    			if (dirty & /*scale*/ 1 && rect0_height_value !== (rect0_height_value = 90 * /*scale*/ ctx[0])) {
    				attr_dev(rect0, "height", rect0_height_value);
    			}

    			if (dirty & /*scale*/ 1 && line_x__value !== (line_x__value = 60 * /*scale*/ ctx[0])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*scale*/ 1 && line_x__value_1 !== (line_x__value_1 = 60 * /*scale*/ ctx[0])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*scale*/ 1 && line_y__value !== (line_y__value = 90 * /*scale*/ ctx[0])) {
    				attr_dev(line, "y2", line_y__value);
    			}

    			if (dirty & /*scale*/ 1 && circle0_cx_value !== (circle0_cx_value = 60 * /*scale*/ ctx[0])) {
    				attr_dev(circle0, "cx", circle0_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle0_cy_value !== (circle0_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle0, "cy", circle0_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle0_r_value !== (circle0_r_value = 9.15 * /*scale*/ ctx[0])) {
    				attr_dev(circle0, "r", circle0_r_value);
    			}

    			if (dirty & /*scale*/ 1 && circle1_cx_value !== (circle1_cx_value = 60 * /*scale*/ ctx[0])) {
    				attr_dev(circle1, "cx", circle1_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle1_cy_value !== (circle1_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle1, "cy", circle1_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle1_r_value !== (circle1_r_value = 0.5 * /*scale*/ ctx[0])) {
    				attr_dev(circle1, "r", circle1_r_value);
    			}

    			if (dirty & /*scale*/ 1 && circle2_cx_value !== (circle2_cx_value = 11 * /*scale*/ ctx[0])) {
    				attr_dev(circle2, "cx", circle2_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle2_cy_value !== (circle2_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle2, "cy", circle2_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle2_r_value !== (circle2_r_value = 9.15 * /*scale*/ ctx[0])) {
    				attr_dev(circle2, "r", circle2_r_value);
    			}

    			if (dirty & /*scale*/ 1 && rect1_y_value !== (rect1_y_value = 24.85 * /*scale*/ ctx[0])) {
    				attr_dev(rect1, "y", rect1_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect1_width_value !== (rect1_width_value = 16.5 * /*scale*/ ctx[0])) {
    				attr_dev(rect1, "width", rect1_width_value);
    			}

    			if (dirty & /*scale*/ 1 && rect1_height_value !== (rect1_height_value = 40.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect1, "height", rect1_height_value);
    			}

    			if (dirty & /*scale*/ 1 && rect2_y_value !== (rect2_y_value = 35.85 * /*scale*/ ctx[0])) {
    				attr_dev(rect2, "y", rect2_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect2_width_value !== (rect2_width_value = 5.5 * /*scale*/ ctx[0])) {
    				attr_dev(rect2, "width", rect2_width_value);
    			}

    			if (dirty & /*scale*/ 1 && rect2_height_value !== (rect2_height_value = 18.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect2, "height", rect2_height_value);
    			}

    			if (dirty & /*scale*/ 1 && rect3_y_value !== (rect3_y_value = 41.35 * /*scale*/ ctx[0])) {
    				attr_dev(rect3, "y", rect3_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect3_height_value !== (rect3_height_value = 7.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect3, "height", rect3_height_value);
    			}

    			if (dirty & /*scale*/ 1 && circle3_cx_value !== (circle3_cx_value = 11 * /*scale*/ ctx[0])) {
    				attr_dev(circle3, "cx", circle3_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle3_cy_value !== (circle3_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle3, "cy", circle3_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle3_r_value !== (circle3_r_value = 0.5 * /*scale*/ ctx[0])) {
    				attr_dev(circle3, "r", circle3_r_value);
    			}

    			if (dirty & /*scale*/ 1 && circle4_cx_value !== (circle4_cx_value = (120 - 11) * /*scale*/ ctx[0])) {
    				attr_dev(circle4, "cx", circle4_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle4_cy_value !== (circle4_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle4, "cy", circle4_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle4_r_value !== (circle4_r_value = 9.15 * /*scale*/ ctx[0])) {
    				attr_dev(circle4, "r", circle4_r_value);
    			}

    			if (dirty & /*scale*/ 1 && rect4_x_value !== (rect4_x_value = (120 - 16.5) * /*scale*/ ctx[0])) {
    				attr_dev(rect4, "x", rect4_x_value);
    			}

    			if (dirty & /*scale*/ 1 && rect4_y_value !== (rect4_y_value = 24.85 * /*scale*/ ctx[0])) {
    				attr_dev(rect4, "y", rect4_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect4_width_value !== (rect4_width_value = 16.5 * /*scale*/ ctx[0])) {
    				attr_dev(rect4, "width", rect4_width_value);
    			}

    			if (dirty & /*scale*/ 1 && rect4_height_value !== (rect4_height_value = 40.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect4, "height", rect4_height_value);
    			}

    			if (dirty & /*scale*/ 1 && rect5_x_value !== (rect5_x_value = (120 - 5.5) * /*scale*/ ctx[0])) {
    				attr_dev(rect5, "x", rect5_x_value);
    			}

    			if (dirty & /*scale*/ 1 && rect5_y_value !== (rect5_y_value = 35.85 * /*scale*/ ctx[0])) {
    				attr_dev(rect5, "y", rect5_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect5_width_value !== (rect5_width_value = 5.5 * /*scale*/ ctx[0])) {
    				attr_dev(rect5, "width", rect5_width_value);
    			}

    			if (dirty & /*scale*/ 1 && rect5_height_value !== (rect5_height_value = 18.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect5, "height", rect5_height_value);
    			}

    			if (dirty & /*scale*/ 1 && rect6_x_value !== (rect6_x_value = 120 * /*scale*/ ctx[0] - 3)) {
    				attr_dev(rect6, "x", rect6_x_value);
    			}

    			if (dirty & /*scale*/ 1 && rect6_y_value !== (rect6_y_value = 41.35 * /*scale*/ ctx[0])) {
    				attr_dev(rect6, "y", rect6_y_value);
    			}

    			if (dirty & /*scale*/ 1 && rect6_height_value !== (rect6_height_value = 7.3 * /*scale*/ ctx[0])) {
    				attr_dev(rect6, "height", rect6_height_value);
    			}

    			if (dirty & /*scale*/ 1 && circle5_cx_value !== (circle5_cx_value = (120 - 11) * /*scale*/ ctx[0])) {
    				attr_dev(circle5, "cx", circle5_cx_value);
    			}

    			if (dirty & /*scale*/ 1 && circle5_cy_value !== (circle5_cy_value = 45 * /*scale*/ ctx[0])) {
    				attr_dev(circle5, "cy", circle5_cy_value);
    			}

    			if (dirty & /*scale*/ 1 && circle5_r_value !== (circle5_r_value = 0.5 * /*scale*/ ctx[0])) {
    				attr_dev(circle5, "r", circle5_r_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FootballPitch", slots, []);
    	let { scale = 1 } = $$props;
    	const writable_props = ["scale"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FootballPitch> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    	};

    	$$self.$capture_state = () => ({ scale });

    	$$self.$inject_state = $$props => {
    		if ("scale" in $$props) $$invalidate(0, scale = $$props.scale);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [scale];
    }

    class FootballPitch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { scale: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FootballPitch",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get scale() {
    		throw new Error("<FootballPitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<FootballPitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (68:2) {#each datapoints as datapoint}
    function create_each_block_1(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let line;
    	let title;
    	let t_value = JSON.stringify(/*datapoint*/ ctx[9]) + "";
    	let t;
    	let line_x__value;
    	let line_y__value;
    	let line_x__value_1;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			line = svg_element("line");
    			title = svg_element("title");
    			t = text(t_value);
    			attr_dev(circle, "cx", circle_cx_value = /*datapoint*/ ctx[9].positions[0].x * 1.2 * /*scale*/ ctx[4]);
    			attr_dev(circle, "cy", circle_cy_value = /*datapoint*/ ctx[9].positions[0].y * 0.9 * /*scale*/ ctx[4]);
    			attr_dev(circle, "r", "2");
    			attr_dev(circle, "class", "svelte-nhxbau");
    			toggle_class(circle, "inrange", Math.abs(/*datapoint*/ ctx[9].eventSec - /*slider_value*/ ctx[2]) < 25);
    			toggle_class(circle, "team_1", /*datapoint*/ ctx[9].teamId == /*teams*/ ctx[3][0]);
    			add_location(circle, file, 68, 3, 1666);
    			add_location(title, file, 75, 4, 2176);
    			attr_dev(line, "x1", line_x__value = /*datapoint*/ ctx[9].positions[0].x * 1.2 * /*scale*/ ctx[4]);
    			attr_dev(line, "y1", line_y__value = /*datapoint*/ ctx[9].positions[0].y * 0.9 * /*scale*/ ctx[4]);
    			attr_dev(line, "x2", line_x__value_1 = /*datapoint*/ ctx[9].positions[1].x * 1.2 * /*scale*/ ctx[4]);
    			attr_dev(line, "y2", line_y__value_1 = /*datapoint*/ ctx[9].positions[1].y * 0.9 * /*scale*/ ctx[4]);
    			attr_dev(line, "class", "svelte-nhxbau");
    			toggle_class(line, "inrange", Math.abs(/*datapoint*/ ctx[9].eventSec - /*slider_value*/ ctx[2]) < 25);
    			toggle_class(line, "team_1", /*datapoint*/ ctx[9].teamId == /*teams*/ ctx[3][0]);
    			add_location(line, file, 71, 3, 1883);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    			insert_dev(target, line, anchor);
    			append_dev(line, title);
    			append_dev(title, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*datapoints*/ 1 && circle_cx_value !== (circle_cx_value = /*datapoint*/ ctx[9].positions[0].x * 1.2 * /*scale*/ ctx[4])) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*datapoints*/ 1 && circle_cy_value !== (circle_cy_value = /*datapoint*/ ctx[9].positions[0].y * 0.9 * /*scale*/ ctx[4])) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*Math, datapoints, slider_value*/ 5) {
    				toggle_class(circle, "inrange", Math.abs(/*datapoint*/ ctx[9].eventSec - /*slider_value*/ ctx[2]) < 25);
    			}

    			if (dirty & /*datapoints, teams*/ 9) {
    				toggle_class(circle, "team_1", /*datapoint*/ ctx[9].teamId == /*teams*/ ctx[3][0]);
    			}

    			if (dirty & /*datapoints*/ 1 && t_value !== (t_value = JSON.stringify(/*datapoint*/ ctx[9]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*datapoints*/ 1 && line_x__value !== (line_x__value = /*datapoint*/ ctx[9].positions[0].x * 1.2 * /*scale*/ ctx[4])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*datapoints*/ 1 && line_y__value !== (line_y__value = /*datapoint*/ ctx[9].positions[0].y * 0.9 * /*scale*/ ctx[4])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*datapoints*/ 1 && line_x__value_1 !== (line_x__value_1 = /*datapoint*/ ctx[9].positions[1].x * 1.2 * /*scale*/ ctx[4])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*datapoints*/ 1 && line_y__value_1 !== (line_y__value_1 = /*datapoint*/ ctx[9].positions[1].y * 0.9 * /*scale*/ ctx[4])) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*Math, datapoints, slider_value*/ 5) {
    				toggle_class(line, "inrange", Math.abs(/*datapoint*/ ctx[9].eventSec - /*slider_value*/ ctx[2]) < 25);
    			}

    			if (dirty & /*datapoints, teams*/ 9) {
    				toggle_class(line, "team_1", /*datapoint*/ ctx[9].teamId == /*teams*/ ctx[3][0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(68:2) {#each datapoints as datapoint}",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#each minuteBins as minuteBin, idx}
    function create_each_block(ctx) {
    	let line;
    	let title;
    	let t;
    	let line_y__value;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			title = svg_element("title");
    			t = text(/*idx*/ ctx[8]);
    			add_location(title, file, 84, 4, 2441);
    			attr_dev(line, "x1", 10 + /*idx*/ ctx[8] * 6);
    			attr_dev(line, "y1", "680");
    			attr_dev(line, "x2", 10 + /*idx*/ ctx[8] * 6);
    			attr_dev(line, "y2", line_y__value = 680 - /*minuteBin*/ ctx[6]);
    			attr_dev(line, "class", "histogram svelte-nhxbau");
    			toggle_class(line, "inrange", /*idx*/ ctx[8] == Math.floor(/*slider_value*/ ctx[2] / 60));
    			add_location(line, file, 81, 3, 2293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    			append_dev(line, title);
    			append_dev(title, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*minuteBins*/ 2 && line_y__value !== (line_y__value = 680 - /*minuteBin*/ ctx[6])) {
    				attr_dev(line, "y2", line_y__value);
    			}

    			if (dirty & /*Math, slider_value*/ 4) {
    				toggle_class(line, "inrange", /*idx*/ ctx[8] == Math.floor(/*slider_value*/ ctx[2] / 60));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(81:2) {#each minuteBins as minuteBin, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let t1_value = Math.floor(/*slider_value*/ ctx[2] / 60) + "";
    	let t1;
    	let t2;
    	let div;
    	let input;
    	let t3;
    	let svg;
    	let footballpitch;
    	let g0;
    	let g1;
    	let current;
    	let mounted;
    	let dispose;

    	footballpitch = new FootballPitch({
    			props: { scale: /*scale*/ ctx[4] },
    			$$inline: true
    		});

    	let each_value_1 = /*datapoints*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*minuteBins*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = text("Minute: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div = element("div");
    			input = element("input");
    			t3 = space();
    			svg = svg_element("svg");
    			create_component(footballpitch.$$.fragment);
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "3000");
    			add_location(input, file, 62, 5, 1494);
    			add_location(div, file, 62, 0, 1489);
    			add_location(g0, file, 66, 1, 1625);
    			add_location(g1, file, 79, 1, 2247);
    			attr_dev(svg, "width", "850");
    			attr_dev(svg, "height", "700");
    			add_location(svg, file, 64, 0, 1565);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*slider_value*/ ctx[2]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, svg, anchor);
    			mount_component(footballpitch, svg, null);
    			append_dev(svg, g0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g0, null);
    			}

    			append_dev(svg, g1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*slider_value*/ 4) && t1_value !== (t1_value = Math.floor(/*slider_value*/ ctx[2] / 60) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*slider_value*/ 4) {
    				set_input_value(input, /*slider_value*/ ctx[2]);
    			}

    			if (dirty & /*datapoints, scale, Math, slider_value, teams, JSON*/ 29) {
    				each_value_1 = /*datapoints*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*minuteBins, Math, slider_value*/ 6) {
    				each_value = /*minuteBins*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footballpitch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footballpitch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(svg);
    			destroy_component(footballpitch);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let teams;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let datapoints = [];
    	fetch("http://localhost:5000/assets/events_European_Championship.json").then(res => res.json()).then(data => data.filter(d => d.matchId == 1694390)).then(data => data.filter(d => d.positions.length == 2)).then(data => data.filter(d => d.positions[0].x > 0 & d.positions[0].x < 100 & d.positions[0].y > 0 & d.positions[0].y < 100 & d.positions[1].x > 0 & d.positions[1].x < 100 & d.positions[1].y > 0 & d.positions[1].y < 100)).then(data => data.filter(d => d.matchPeriod == "1H")).then(data => $$invalidate(0, datapoints = data));
    	let minuteBins = new Array(50).fill(0);
    	let scale = 7;
    	let slider_value = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		slider_value = to_number(this.value);
    		$$invalidate(2, slider_value);
    	}

    	$$self.$capture_state = () => ({
    		FootballPitch,
    		datapoints,
    		minuteBins,
    		scale,
    		slider_value,
    		teams
    	});

    	$$self.$inject_state = $$props => {
    		if ("datapoints" in $$props) $$invalidate(0, datapoints = $$props.datapoints);
    		if ("minuteBins" in $$props) $$invalidate(1, minuteBins = $$props.minuteBins);
    		if ("scale" in $$props) $$invalidate(4, scale = $$props.scale);
    		if ("slider_value" in $$props) $$invalidate(2, slider_value = $$props.slider_value);
    		if ("teams" in $$props) $$invalidate(3, teams = $$props.teams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*datapoints*/ 1) {
    			// .then(data => datapoints = data.slice(1,10000))
    			console.log(datapoints);
    		}

    		if ($$self.$$.dirty & /*datapoints*/ 1) {
    			$$invalidate(3, teams = [...new Set(datapoints.slice(1, 100).map(d => d.teamId))]);
    		}

    		if ($$self.$$.dirty & /*datapoints, minuteBins*/ 3) {
    			datapoints.forEach(d => {
    				let minute = Math.floor(d.eventSec / 60);
    				$$invalidate(1, minuteBins[minute] += 1, minuteBins);
    			});
    		}

    		if ($$self.$$.dirty & /*minuteBins*/ 2) {
    			console.log(minuteBins);
    		}
    	};

    	return [datapoints, minuteBins, slider_value, teams, scale, input_change_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
