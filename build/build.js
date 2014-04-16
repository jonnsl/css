
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(this|Array|Date|Object|Math|JSON)\\b/g;\n\
\n\
/**\n\
 * Return immediate identifiers parsed from `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String|Function} map function or prefix\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str, fn){\n\
  var p = unique(props(str));\n\
  if (fn && 'string' == typeof fn) fn = prefixed(fn);\n\
  if (fn) return map(str, p, fn);\n\
  return p;\n\
};\n\
\n\
/**\n\
 * Return immediate identifiers in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function props(str) {\n\
  return str\n\
    .replace(/\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\//g, '')\n\
    .replace(globals, '')\n\
    .match(/[$a-zA-Z_]\\w*/g)\n\
    || [];\n\
}\n\
\n\
/**\n\
 * Return `str` with `props` mapped with `fn`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Array} props\n\
 * @param {Function} fn\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function map(str, props, fn) {\n\
  var re = /\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\/|[a-zA-Z_]\\w*/g;\n\
  return str.replace(re, function(_){\n\
    if ('(' == _[_.length - 1]) return fn(_);\n\
    if (!~props.indexOf(_)) return _;\n\
    return fn(_);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return unique array.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function unique(arr) {\n\
  var ret = [];\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (~ret.indexOf(arr[i])) continue;\n\
    ret.push(arr[i]);\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Map with prefix `str`.\n\
 */\n\
\n\
function prefixed(str) {\n\
  return function(_){\n\
    return str + _;\n\
  };\n\
}\n\
//@ sourceURL=component-props/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var expr = require('props');\n\
\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\" or \"age > 18 && age < 36\"\n\
  return new Function('_', 'return ' + get(str));\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
\n\
/**\n\
 * Built the getter function. Supports getter style functions\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function get(str) {\n\
  var props = expr(str);\n\
  if (!props.length) return '_.' + str;\n\
\n\
  var val;\n\
  for(var i = 0, prop; prop = props[i]; i++) {\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
    str = str.replace(new RegExp(prop, 'g'), val);\n\
  }\n\
\n\
  return str;\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type = require('type');\n\
var toFunction = require('to-function');\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`\n\
 * in optional context `ctx`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} [ctx]\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn, ctx){\n\
  fn = toFunction(fn);\n\
  ctx = ctx || this;\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn, ctx);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn, ctx);\n\
      return object(obj, fn, ctx);\n\
    case 'string':\n\
      return string(obj, fn, ctx);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn, ctx) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn.call(ctx, key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("visionmedia-debug/index.js", Function("exports, require, module",
"if ('undefined' == typeof window) {\n\
  module.exports = require('./lib/debug');\n\
} else {\n\
  module.exports = require('./debug');\n\
}\n\
//@ sourceURL=visionmedia-debug/index.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
module.exports = debug;\n\
\n\
/**\n\
 * Create a debugger with the given `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Type}\n\
 * @api public\n\
 */\n\
\n\
function debug(name) {\n\
  if (!debug.enabled(name)) return function(){};\n\
\n\
  return function(fmt){\n\
    fmt = coerce(fmt);\n\
\n\
    var curr = new Date;\n\
    var ms = curr - (debug[name] || curr);\n\
    debug[name] = curr;\n\
\n\
    fmt = name\n\
      + ' '\n\
      + fmt\n\
      + ' +' + debug.humanize(ms);\n\
\n\
    // This hackery is required for IE8\n\
    // where `console.log` doesn't have 'apply'\n\
    window.console\n\
      && console.log\n\
      && Function.prototype.apply.call(console.log, console, arguments);\n\
  }\n\
}\n\
\n\
/**\n\
 * The currently active debug mode names.\n\
 */\n\
\n\
debug.names = [];\n\
debug.skips = [];\n\
\n\
/**\n\
 * Enables a debug mode by name. This can include modes\n\
 * separated by a colon and wildcards.\n\
 *\n\
 * @param {String} name\n\
 * @api public\n\
 */\n\
\n\
debug.enable = function(name) {\n\
  try {\n\
    localStorage.debug = name;\n\
  } catch(e){}\n\
\n\
  var split = (name || '').split(/[\\s,]+/)\n\
    , len = split.length;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    name = split[i].replace('*', '.*?');\n\
    if (name[0] === '-') {\n\
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));\n\
    }\n\
    else {\n\
      debug.names.push(new RegExp('^' + name + '$'));\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Disable debug output.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
debug.disable = function(){\n\
  debug.enable('');\n\
};\n\
\n\
/**\n\
 * Humanize the given `ms`.\n\
 *\n\
 * @param {Number} m\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
debug.humanize = function(ms) {\n\
  var sec = 1000\n\
    , min = 60 * 1000\n\
    , hour = 60 * min;\n\
\n\
  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';\n\
  if (ms >= min) return (ms / min).toFixed(1) + 'm';\n\
  if (ms >= sec) return (ms / sec | 0) + 's';\n\
  return ms + 'ms';\n\
};\n\
\n\
/**\n\
 * Returns true if the given mode name is enabled, false otherwise.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
debug.enabled = function(name) {\n\
  for (var i = 0, len = debug.skips.length; i < len; i++) {\n\
    if (debug.skips[i].test(name)) {\n\
      return false;\n\
    }\n\
  }\n\
  for (var i = 0, len = debug.names.length; i < len; i++) {\n\
    if (debug.names[i].test(name)) {\n\
      return true;\n\
    }\n\
  }\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Coerce `val`.\n\
 */\n\
\n\
function coerce(val) {\n\
  if (val instanceof Error) return val.stack || val.message;\n\
  return val;\n\
}\n\
\n\
// persist\n\
\n\
try {\n\
  if (window.localStorage) debug.enable(localStorage.debug);\n\
} catch(e){}\n\
//@ sourceURL=visionmedia-debug/debug.js"
));
require.register("ianstormtaylor-to-no-case/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `toNoCase`.\n\
 */\n\
\n\
module.exports = toNoCase;\n\
\n\
\n\
/**\n\
 * Test whether a string is camel-case.\n\
 */\n\
\n\
var hasSpace = /\\s/;\n\
var hasCamel = /[a-z][A-Z]/;\n\
var hasSeparator = /[\\W_]/;\n\
\n\
\n\
/**\n\
 * Remove any starting case from a `string`, like camel or snake, but keep\n\
 * spaces and punctuation that may be important otherwise.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function toNoCase (string) {\n\
  if (hasSpace.test(string)) return string.toLowerCase();\n\
\n\
  if (hasSeparator.test(string)) string = unseparate(string);\n\
  if (hasCamel.test(string)) string = uncamelize(string);\n\
  return string.toLowerCase();\n\
}\n\
\n\
\n\
/**\n\
 * Separator splitter.\n\
 */\n\
\n\
var separatorSplitter = /[\\W_]+(.|$)/g;\n\
\n\
\n\
/**\n\
 * Un-separate a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function unseparate (string) {\n\
  return string.replace(separatorSplitter, function (m, next) {\n\
    return next ? ' ' + next : '';\n\
  });\n\
}\n\
\n\
\n\
/**\n\
 * Camelcase splitter.\n\
 */\n\
\n\
var camelSplitter = /(.)([A-Z]+)/g;\n\
\n\
\n\
/**\n\
 * Un-camelcase a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function uncamelize (string) {\n\
  return string.replace(camelSplitter, function (m, previous, uppers) {\n\
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-no-case/index.js"
));
require.register("ianstormtaylor-to-space-case/index.js", Function("exports, require, module",
"\n\
var clean = require('to-no-case');\n\
\n\
\n\
/**\n\
 * Expose `toSpaceCase`.\n\
 */\n\
\n\
module.exports = toSpaceCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to space case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toSpaceCase (string) {\n\
  return clean(string).replace(/[\\W_]+(.|$)/g, function (matches, match) {\n\
    return match ? ' ' + match : '';\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-space-case/index.js"
));
require.register("ianstormtaylor-to-camel-case/index.js", Function("exports, require, module",
"\n\
var toSpace = require('to-space-case');\n\
\n\
\n\
/**\n\
 * Expose `toCamelCase`.\n\
 */\n\
\n\
module.exports = toCamelCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to camel case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toCamelCase (string) {\n\
  return toSpace(string).replace(/\\s(\\w)/g, function (matches, letter) {\n\
    return letter.toUpperCase();\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-camel-case/index.js"
));
require.register("component-within-document/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Check if `el` is within the document.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
module.exports = function(el) {\n\
  var node = el;\n\
  while (node = node.parentNode) {\n\
    if (node == document) return true;\n\
  }\n\
  return false;\n\
};//@ sourceURL=component-within-document/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
  \n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-stack/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `stack()`.\n\
 */\n\
\n\
module.exports = stack;\n\
\n\
/**\n\
 * Return the stack.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
function stack() {\n\
  var orig = Error.prepareStackTrace;\n\
  Error.prepareStackTrace = function(_, stack){ return stack; };\n\
  var err = new Error;\n\
  Error.captureStackTrace(err, arguments.callee);\n\
  var stack = err.stack;\n\
  Error.prepareStackTrace = orig;\n\
  return stack;\n\
}//@ sourceURL=component-stack/index.js"
));
require.register("jkroso-type/index.js", Function("exports, require, module",
"\n\
var toString = {}.toString\n\
var DomNode = typeof window != 'undefined'\n\
  ? window.Node\n\
  : Function\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = exports = function(x){\n\
  var type = typeof x\n\
  if (type != 'object') return type\n\
  type = types[toString.call(x)]\n\
  if (type) return type\n\
  if (x instanceof DomNode) switch (x.nodeType) {\n\
    case 1:  return 'element'\n\
    case 3:  return 'text-node'\n\
    case 9:  return 'document'\n\
    case 11: return 'document-fragment'\n\
    default: return 'dom-node'\n\
  }\n\
}\n\
\n\
var types = exports.types = {\n\
  '[object Function]': 'function',\n\
  '[object Date]': 'date',\n\
  '[object RegExp]': 'regexp',\n\
  '[object Arguments]': 'arguments',\n\
  '[object Array]': 'array',\n\
  '[object String]': 'string',\n\
  '[object Null]': 'null',\n\
  '[object Undefined]': 'undefined',\n\
  '[object Number]': 'number',\n\
  '[object Boolean]': 'boolean',\n\
  '[object Object]': 'object',\n\
  '[object Text]': 'text-node',\n\
  '[object Uint8Array]': 'bit-array',\n\
  '[object Uint16Array]': 'bit-array',\n\
  '[object Uint32Array]': 'bit-array',\n\
  '[object Uint8ClampedArray]': 'bit-array',\n\
  '[object Error]': 'error',\n\
  '[object FormData]': 'form-data',\n\
  '[object File]': 'file',\n\
  '[object Blob]': 'blob'\n\
}\n\
//@ sourceURL=jkroso-type/index.js"
));
require.register("jkroso-equals/index.js", Function("exports, require, module",
"\n\
var type = require('type')\n\
\n\
/**\n\
 * expose equals\n\
 */\n\
\n\
module.exports = equals\n\
equals.compare = compare\n\
\n\
/**\n\
 * assert all values are equal\n\
 *\n\
 * @param {Any} [...]\n\
 * @return {Boolean}\n\
 */\n\
\n\
 function equals(){\n\
  var i = arguments.length - 1\n\
  while (i > 0) {\n\
    if (!compare(arguments[i], arguments[--i])) return false\n\
  }\n\
  return true\n\
}\n\
\n\
// (any, any, [array]) -> boolean\n\
function compare(a, b, memos){\n\
  // All identical values are equivalent\n\
  if (a === b) return true\n\
  var fnA = types[type(a)]\n\
  var fnB = types[type(b)]\n\
  return fnA && fnA === fnB\n\
    ? fnA(a, b, memos)\n\
    : false\n\
}\n\
\n\
var types = {}\n\
\n\
// (Number) -> boolean\n\
types.number = function(a){\n\
  // NaN check\n\
  return a !== a\n\
}\n\
\n\
// (function, function, array) -> boolean\n\
types['function'] = function(a, b, memos){\n\
  return a.toString() === b.toString()\n\
    // Functions can act as objects\n\
    && types.object(a, b, memos)\n\
    && compare(a.prototype, b.prototype)\n\
}\n\
\n\
// (date, date) -> boolean\n\
types.date = function(a, b){\n\
  return +a === +b\n\
}\n\
\n\
// (regexp, regexp) -> boolean\n\
types.regexp = function(a, b){\n\
  return a.toString() === b.toString()\n\
}\n\
\n\
// (DOMElement, DOMElement) -> boolean\n\
types.element = function(a, b){\n\
  return a.outerHTML === b.outerHTML\n\
}\n\
\n\
// (textnode, textnode) -> boolean\n\
types.textnode = function(a, b){\n\
  return a.textContent === b.textContent\n\
}\n\
\n\
// decorate `fn` to prevent it re-checking objects\n\
// (function) -> function\n\
function memoGaurd(fn){\n\
  return function(a, b, memos){\n\
    if (!memos) return fn(a, b, [])\n\
    var i = memos.length, memo\n\
    while (memo = memos[--i]) {\n\
      if (memo[0] === a && memo[1] === b) return true\n\
    }\n\
    return fn(a, b, memos)\n\
  }\n\
}\n\
\n\
types['arguments'] =\n\
types.array = memoGaurd(compareArrays)\n\
\n\
// (array, array, array) -> boolean\n\
function compareArrays(a, b, memos){\n\
  var i = a.length\n\
  if (i !== b.length) return false\n\
  memos.push([a, b])\n\
  while (i--) {\n\
    if (!compare(a[i], b[i], memos)) return false\n\
  }\n\
  return true\n\
}\n\
\n\
types.object = memoGaurd(compareObjects)\n\
\n\
// (object, object, array) -> boolean\n\
function compareObjects(a, b, memos) {\n\
  var ka = getEnumerableProperties(a)\n\
  var kb = getEnumerableProperties(b)\n\
  var i = ka.length\n\
\n\
  // same number of properties\n\
  if (i !== kb.length) return false\n\
\n\
  // although not necessarily the same order\n\
  ka.sort()\n\
  kb.sort()\n\
\n\
  // cheap key test\n\
  while (i--) if (ka[i] !== kb[i]) return false\n\
\n\
  // remember\n\
  memos.push([a, b])\n\
\n\
  // iterate again this time doing a thorough check\n\
  i = ka.length\n\
  while (i--) {\n\
    var key = ka[i]\n\
    if (!compare(a[key], b[key], memos)) return false\n\
  }\n\
\n\
  return true\n\
}\n\
\n\
// (object) -> array\n\
function getEnumerableProperties (object) {\n\
  var result = []\n\
  for (var k in object) if (k !== 'constructor') {\n\
    result.push(k)\n\
  }\n\
  return result\n\
}\n\
//@ sourceURL=jkroso-equals/index.js"
));
require.register("component-assert/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var stack = require('stack');\n\
var equals = require('equals');\n\
\n\
/**\n\
 * Assert `expr` with optional failure `msg`.\n\
 *\n\
 * @param {Mixed} expr\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
module.exports = exports = function (expr, msg) {\n\
  if (expr) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is weak equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.equal = function (actual, expected, msg) {\n\
  if (actual == expected) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is not weak equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.notEqual = function (actual, expected, msg) {\n\
  if (actual != expected) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is deep equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.deepEqual = function (actual, expected, msg) {\n\
  if (equals(actual, expected)) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is not deep equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.notDeepEqual = function (actual, expected, msg) {\n\
  if (!equals(actual, expected)) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is strict equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.strictEqual = function (actual, expected, msg) {\n\
  if (actual === expected) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `actual` is not strict equal to `expected`.\n\
 *\n\
 * @param {Mixed} actual\n\
 * @param {Mixed} expected\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.notStrictEqual = function (actual, expected, msg) {\n\
  if (actual !== expected) return;\n\
  throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `block` throws an `error`.\n\
 *\n\
 * @param {Function} block\n\
 * @param {Function} [error]\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.throws = function (block, error, msg) {\n\
  var err;\n\
  try {\n\
    block();\n\
  } catch (e) {\n\
    err = e;\n\
  }\n\
  if (!err) throw new Error(msg || message());\n\
  if (error && !(err instanceof error)) throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Assert `block` doesn't throw an `error`.\n\
 *\n\
 * @param {Function} block\n\
 * @param {Function} [error]\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
exports.doesNotThrow = function (block, error, msg) {\n\
  var err;\n\
  try {\n\
    block();\n\
  } catch (e) {\n\
    err = e;\n\
  }\n\
  if (error && (err instanceof error)) throw new Error(msg || message());\n\
  if (err) throw new Error(msg || message());\n\
};\n\
\n\
/**\n\
 * Create a message from the call stack.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function message() {\n\
  if (!Error.captureStackTrace) return 'assertion failed';\n\
  var callsite = stack()[2];\n\
  var fn = callsite.getFunctionName();\n\
  var file = callsite.getFileName();\n\
  var line = callsite.getLineNumber() - 1;\n\
  var col = callsite.getColumnNumber() - 1;\n\
  var src = getScript(file);\n\
  line = src.split('\\n\
')[line].slice(col);\n\
  var m = line.match(/assert\\((.*)\\)/);\n\
  return m && m[1].trim();\n\
}\n\
\n\
/**\n\
 * Load contents of `script`.\n\
 *\n\
 * @param {String} script\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function getScript(script) {\n\
  var xhr = new XMLHttpRequest;\n\
  xhr.open('GET', script, false);\n\
  xhr.send(null);\n\
  return xhr.responseText;\n\
}\n\
//@ sourceURL=component-assert/index.js"
));
require.register("component-load-styles/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module exports.\n\
 */\n\
\n\
module.exports = loadStyles;\n\
\n\
/**\n\
 * Injects the CSS into the <head> DOM node.\n\
 *\n\
 * @param {String} css CSS string to add to the <style> tag.\n\
 * @param {Document} doc document instance to use.\n\
 */\n\
\n\
function loadStyles(css, doc) {\n\
  // default to the global `document` object\n\
  if (!doc) doc = document;\n\
\n\
  var head = doc.head || doc.getElementsByTagName('head')[0];\n\
  if (!head) throw new Error('could not find <head> DOM node');\n\
\n\
  var style = doc.createElement('style');\n\
  style.type = 'text/css';\n\
  if (style.styleSheet) {  // IE\n\
    style.styleSheet.cssText = css;\n\
  } else {                 // the world\n\
    style.appendChild(doc.createTextNode(css));\n\
  }\n\
  head.appendChild(style);\n\
\n\
  return style;\n\
}\n\
//@ sourceURL=component-load-styles/index.js"
));
require.register("css/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css');\n\
var set = require('./lib/style');\n\
var get = require('./lib/css');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * Get and set css values\n\
 *\n\
 * @param {Element} el\n\
 * @param {String|Object} prop\n\
 * @param {Mixed} val\n\
 * @return {Element} el\n\
 * @api public\n\
 */\n\
\n\
function css(el, prop, val) {\n\
  if (!el) return;\n\
\n\
  if (undefined !== val) {\n\
    var obj = {};\n\
    obj[prop] = val;\n\
    debug('setting styles %j', obj);\n\
    return setStyles(el, obj);\n\
  }\n\
\n\
  if ('object' == typeof prop) {\n\
    debug('setting styles %j', prop);\n\
    return setStyles(el, prop);\n\
  }\n\
\n\
  debug('getting %s', prop);\n\
  return get(el, prop);\n\
}\n\
\n\
/**\n\
 * Set the styles on an element\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} props\n\
 * @return {Element} el\n\
 */\n\
\n\
function setStyles(el, props) {\n\
  for (var prop in props) {\n\
    set(el, prop, props[prop]);\n\
  }\n\
\n\
  return el;\n\
}\n\
//@ sourceURL=css/index.js"
));
require.register("css/lib/css.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:css');\n\
var camelcase = require('to-camel-case');\n\
var computed = require('./computed');\n\
var property = require('./prop');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * CSS Normal Transforms\n\
 */\n\
\n\
var cssNormalTransform = {\n\
  letterSpacing: 0,\n\
  fontWeight: 400\n\
};\n\
\n\
/**\n\
 * Get a CSS value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Array} styles\n\
 * @return {String}\n\
 */\n\
\n\
function css(el, prop, extra, styles) {\n\
  var hooks = require('./hooks');\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var val;\n\
\n\
  prop = property(prop, style);\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a hook was provided get the computed value from there\n\
  if (hook && hook.get) {\n\
    debug('get hook provided. use that');\n\
    val = hook.get(el, true, extra);\n\
  }\n\
\n\
  // Otherwise, if a way to get the computed value exists, use that\n\
  if (undefined == val) {\n\
    debug('fetch the computed value of %s', prop);\n\
    val = computed(el, prop);\n\
  }\n\
\n\
  if ('normal' == val && cssNormalTransform[prop]) {\n\
    val = cssNormalTransform[prop];\n\
    debug('normal => %s', val);\n\
  }\n\
\n\
  // Return, converting to number if forced or a qualifier was provided and val looks numeric\n\
  if ('' == extra || extra) {\n\
    debug('converting value: %s into a number', val);\n\
    var num = parseFloat(val);\n\
    return true === extra || isNumeric(num) ? num || 0 : val;\n\
  }\n\
\n\
  return val;\n\
}\n\
\n\
/**\n\
 * Is Numeric\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Boolean}\n\
 */\n\
\n\
function isNumeric(obj) {\n\
  return !isNan(parseFloat(obj)) && isFinite(obj);\n\
}\n\
//@ sourceURL=css/lib/css.js"
));
require.register("css/lib/prop.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:prop');\n\
var camelcase = require('to-camel-case');\n\
var vendor = require('./vendor');\n\
\n\
/**\n\
 * Export `prop`\n\
 */\n\
\n\
module.exports = prop;\n\
\n\
/**\n\
 * Normalize Properties\n\
 */\n\
\n\
var cssProps = {\n\
  'float': 'cssFloat' in document.documentElement.style ? 'cssFloat' : 'styleFloat'\n\
};\n\
\n\
/**\n\
 * Get the vendor prefixed property\n\
 *\n\
 * @param {String} prop\n\
 * @param {String} style\n\
 * @return {String} prop\n\
 * @api private\n\
 */\n\
\n\
function prop(prop, style) {\n\
  prop = cssProps[prop] || (cssProps[prop] = vendor(prop, style));\n\
  debug('transform property: %s => %s', prop, style);\n\
  return prop;\n\
}\n\
//@ sourceURL=css/lib/prop.js"
));
require.register("css/lib/swap.js", Function("exports, require, module",
"/**\n\
 * Export `swap`\n\
 */\n\
\n\
module.exports = swap;\n\
\n\
/**\n\
 * Initialize `swap`\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} options\n\
 * @param {Function} fn\n\
 * @param {Array} args\n\
 * @return {Mixed}\n\
 */\n\
\n\
function swap(el, options, fn, args) {\n\
  // Remember the old values, and insert the new ones\n\
  for (var key in options) {\n\
    old[key] = el.style[key];\n\
    el.style[key] = options[key];\n\
  }\n\
\n\
  ret = fn.apply(el, args || []);\n\
\n\
  // Revert the old values\n\
  for (key in options) {\n\
    el.style[key] = old[key];\n\
  }\n\
\n\
  return ret;\n\
}\n\
//@ sourceURL=css/lib/swap.js"
));
require.register("css/lib/style.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:style');\n\
var camelcase = require('to-camel-case');\n\
var support = require('./support');\n\
var property = require('./prop');\n\
var hooks = require('./hooks');\n\
\n\
/**\n\
 * Expose `style`\n\
 */\n\
\n\
module.exports = style;\n\
\n\
/**\n\
 * Possibly-unitless properties\n\
 *\n\
 * Don't automatically add 'px' to these properties\n\
 */\n\
\n\
var cssNumber = {\n\
  \"columnCount\": true,\n\
  \"fillOpacity\": true,\n\
  \"fontWeight\": true,\n\
  \"lineHeight\": true,\n\
  \"opacity\": true,\n\
  \"order\": true,\n\
  \"orphans\": true,\n\
  \"widows\": true,\n\
  \"zIndex\": true,\n\
  \"zoom\": true\n\
};\n\
\n\
/**\n\
 * Set a css value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} val\n\
 * @param {Mixed} extra\n\
 */\n\
\n\
function style(el, prop, val, extra) {\n\
  // Don't set styles on text and comment nodes\n\
  if (!el || el.nodeType === 3 || el.nodeType === 8 || !el.style ) return;\n\
\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var type = typeof val;\n\
\n\
  if (!val) return get(el, prop, orig, extra);\n\
\n\
  prop = property(prop, style);\n\
\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a number was passed in, add 'px' to the (except for certain CSS properties)\n\
  if ('number' == type && !cssNumber[orig]) {\n\
    debug('adding \"px\" to end of number');\n\
    val += 'px';\n\
  }\n\
\n\
  // Fixes jQuery #8908, it can be done more correctly by specifying setters in cssHooks,\n\
  // but it would mean to define eight (for every problematic property) identical functions\n\
  if (!support.clearCloneStyle && '' === val && 0 === prop.indexOf('background')) {\n\
    debug('set property (%s) value to \"inherit\"', prop);\n\
    style[prop] = 'inherit';\n\
  }\n\
\n\
  // If a hook was provided, use that value, otherwise just set the specified value\n\
  if (!hook || !hook.set || undefined !== (val = hook.set(el, val, extra))) {\n\
    // Support: Chrome, Safari\n\
    // Setting style to blank string required to delete \"style: x !important;\"\n\
    debug('set hook defined. setting property (%s) to %s', prop, val);\n\
    style[prop] = '';\n\
    style[prop] = val;\n\
  }\n\
\n\
}\n\
\n\
/**\n\
 * Get the style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {String} orig\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function get(el, prop, orig, extra) {\n\
  var style = el.style;\n\
  var hook = hooks[prop] || hooks[orig];\n\
  var ret;\n\
\n\
  if (hook && hook.get && undefined !== (ret = hook.get(el, false, extra))) {\n\
    debug('get hook defined, returning: %s', ret);\n\
    return ret;\n\
  }\n\
\n\
  ret = style[prop];\n\
  debug('getting %s', ret);\n\
  return ret;\n\
}\n\
//@ sourceURL=css/lib/style.js"
));
require.register("css/lib/hooks.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var each = require('each');\n\
var css = require('./css');\n\
var cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' };\n\
var pnum = (/[+-]?(?:\\d*\\.|)\\d+(?:[eE][+-]?\\d+|)/).source;\n\
var rnumnonpx = new RegExp( '^(' + pnum + ')(?!px)[a-z%]+$', 'i');\n\
var rnumsplit = new RegExp( '^(' + pnum + ')(.*)$', 'i');\n\
var rdisplayswap = /^(none|table(?!-c[ea]).+)/;\n\
var styles = require('./styles');\n\
var support = require('./support');\n\
var swap = require('./swap');\n\
var computed = require('./computed');\n\
var cssExpand = [ \"Top\", \"Right\", \"Bottom\", \"Left\" ];\n\
\n\
/**\n\
 * Height & Width\n\
 */\n\
\n\
each(['width', 'height'], function(name) {\n\
  exports[name] = {};\n\
\n\
  exports[name].get = function(el, compute, extra) {\n\
    if (!compute) return;\n\
    // certain elements can have dimension info if we invisibly show them\n\
    // however, it must have a current display style that would benefit from this\n\
    return 0 == el.offsetWidth && rdisplayswap.test(css(el, 'display'))\n\
      ? swap(el, cssShow, function() { return getWidthOrHeight(el, name, extra); })\n\
      : getWidthOrHeight(el, name, extra);\n\
  }\n\
\n\
  exports[name].set = function(el, val, extra) {\n\
    var styles = extra && styles(el);\n\
    return setPositiveNumber(el, val, extra\n\
      ? augmentWidthOrHeight(el, name, extra, 'border-box' == css(el, 'boxSizing', false, styles), styles)\n\
      : 0\n\
    );\n\
  };\n\
\n\
});\n\
\n\
/**\n\
 * Opacity\n\
 */\n\
\n\
exports.opacity = {};\n\
exports.opacity.get = function(el, compute) {\n\
  if (!compute) return;\n\
  var ret = computed(el, 'opacity');\n\
  return '' == ret ? '1' : ret;\n\
}\n\
\n\
/**\n\
 * Utility: Set Positive Number\n\
 *\n\
 * @param {Element} el\n\
 * @param {Mixed} val\n\
 * @param {Number} subtract\n\
 * @return {Number}\n\
 */\n\
\n\
function setPositiveNumber(el, val, subtract) {\n\
  var matches = rnumsplit.exec(val);\n\
  return matches ?\n\
    // Guard against undefined 'subtract', e.g., when used as in cssHooks\n\
    Math.max(0, matches[1]) + (matches[2] || 'px') :\n\
    val;\n\
}\n\
\n\
/**\n\
 * Utility: Get the width or height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function getWidthOrHeight(el, prop, extra) {\n\
  // Start with offset property, which is equivalent to the border-box value\n\
  var valueIsBorderBox = true;\n\
  var val = prop === 'width' ? el.offsetWidth : el.offsetHeight;\n\
  var styles = computed(el);\n\
  var isBorderBox = support.boxSizing && css(el, 'boxSizing') === 'border-box';\n\
\n\
  // some non-html elements return undefined for offsetWidth, so check for null/undefined\n\
  // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285\n\
  // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668\n\
  if (val <= 0 || val == null) {\n\
    // Fall back to computed then uncomputed css if necessary\n\
    val = computed(el, prop, styles);\n\
\n\
    if (val < 0 || val == null) {\n\
      val = el.style[prop];\n\
    }\n\
\n\
    // Computed unit is not pixels. Stop here and return.\n\
    if (rnumnonpx.test(val)) {\n\
      return val;\n\
    }\n\
\n\
    // we need the check for style in case a browser which returns unreliable values\n\
    // for getComputedStyle silently falls back to the reliable el.style\n\
    valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === el.style[prop]);\n\
\n\
    // Normalize ', auto, and prepare for extra\n\
    val = parseFloat(val) || 0;\n\
  }\n\
\n\
  // use the active box-sizing model to add/subtract irrelevant styles\n\
  extra = extra || (isBorderBox ? 'border' : 'content');\n\
  val += augmentWidthOrHeight(el, prop, extra, valueIsBorderBox, styles);\n\
  return val + 'px';\n\
}\n\
\n\
/**\n\
 * Utility: Augment the width or the height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Boolean} isBorderBox\n\
 * @param {Array} styles\n\
 */\n\
\n\
function augmentWidthOrHeight(el, prop, extra, isBorderBox, styles) {\n\
  // If we already have the right measurement, avoid augmentation,\n\
  // Otherwise initialize for horizontal or vertical properties\n\
  var i = extra === (isBorderBox ? 'border' : 'content') ? 4 : 'width' == prop ? 1 : 0;\n\
  var val = 0;\n\
\n\
  for (; i < 4; i += 2) {\n\
    // both box models exclude margin, so add it if we want it\n\
    if (extra === 'margin') {\n\
      val += css(el, extra + cssExpand[i], true, styles);\n\
    }\n\
\n\
    if (isBorderBox) {\n\
      // border-box includes padding, so remove it if we want content\n\
      if (extra === 'content') {\n\
        val -= css(el, 'padding' + cssExpand[i], true, styles);\n\
      }\n\
\n\
      // at this point, extra isn't border nor margin, so remove border\n\
      if (extra !== 'margin') {\n\
        val -= css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    } else {\n\
      // at this point, extra isn't content, so add padding\n\
      val += css(el, 'padding' + cssExpand[i], true, styles);\n\
\n\
      // at this point, extra isn't content nor padding, so add border\n\
      if (extra !== 'padding') {\n\
        val += css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    }\n\
  }\n\
\n\
  return val;\n\
}\n\
//@ sourceURL=css/lib/hooks.js"
));
require.register("css/lib/styles.js", Function("exports, require, module",
"/**\n\
 * Expose `styles`\n\
 */\n\
\n\
module.exports = styles;\n\
\n\
/**\n\
 * Get all the styles\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 */\n\
\n\
function styles(el) {\n\
  if (window.getComputedStyle) {\n\
    return el.ownerDocument.defaultView.getComputedStyle(el, null);\n\
  } else {\n\
    return el.currentStyle;\n\
  }\n\
}\n\
//@ sourceURL=css/lib/styles.js"
));
require.register("css/lib/vendor.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var prefixes = ['Webkit', 'O', 'Moz', 'ms'];\n\
\n\
/**\n\
 * Expose `vendor`\n\
 */\n\
\n\
module.exports = vendor;\n\
\n\
/**\n\
 * Get the vendor prefix for a given property\n\
 *\n\
 * @param {String} prop\n\
 * @param {Object} style\n\
 * @return {String}\n\
 */\n\
\n\
function vendor(prop, style) {\n\
  // shortcut for names that are not vendor prefixed\n\
  if (style[prop]) return prop;\n\
\n\
  // check for vendor prefixed names\n\
  var capName = prop[0].toUpperCase() + prop.slice(1);\n\
  var original = prop;\n\
  var i = prefixes.length;\n\
\n\
  while (i--) {\n\
    prop = prefixes[i] + capName;\n\
    if (prop in style) return prop;\n\
  }\n\
\n\
  return original;\n\
}\n\
//@ sourceURL=css/lib/vendor.js"
));
require.register("css/lib/support.js", Function("exports, require, module",
"/**\n\
 * Support values\n\
 */\n\
\n\
var reliableMarginRight;\n\
var boxSizingReliableVal;\n\
var pixelPositionVal;\n\
var clearCloneStyle;\n\
\n\
/**\n\
 * Container setup\n\
 */\n\
\n\
var docElem = document.documentElement;\n\
var container = document.createElement('div');\n\
var div = document.createElement('div');\n\
\n\
/**\n\
 * Clear clone style\n\
 */\n\
\n\
div.style.backgroundClip = 'content-box';\n\
div.cloneNode(true).style.backgroundClip = '';\n\
exports.clearCloneStyle = div.style.backgroundClip === 'content-box';\n\
\n\
container.style.cssText = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px';\n\
container.appendChild(div);\n\
\n\
/**\n\
 * Pixel position\n\
 *\n\
 * Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084\n\
 * getComputedStyle returns percent when specified for top/left/bottom/right\n\
 * rather than make the css module depend on the offset module, we just check for it here\n\
 */\n\
\n\
exports.pixelPosition = function() {\n\
  if (undefined == pixelPositionVal) computePixelPositionAndBoxSizingReliable();\n\
  return pixelPositionVal;\n\
}\n\
\n\
/**\n\
 * Reliable box sizing\n\
 */\n\
\n\
exports.boxSizingReliable = function() {\n\
  if (undefined == boxSizingReliableVal) computePixelPositionAndBoxSizingReliable();\n\
  return boxSizingReliableVal;\n\
}\n\
\n\
/**\n\
 * Reliable margin right\n\
 *\n\
 * Support: Android 2.3\n\
 * Check if div with explicit width and no margin-right incorrectly\n\
 * gets computed margin-right based on width of container. (#3333)\n\
 * WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right\n\
 * This support function is only executed once so no memoizing is needed.\n\
 *\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.reliableMarginRight = function() {\n\
  var ret;\n\
  var marginDiv = div.appendChild(document.createElement(\"div\" ));\n\
\n\
  marginDiv.style.cssText = div.style.cssText = divReset;\n\
  marginDiv.style.marginRight = marginDiv.style.width = \"0\";\n\
  div.style.width = \"1px\";\n\
  docElem.appendChild(container);\n\
\n\
  ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);\n\
\n\
  docElem.removeChild(container);\n\
\n\
  // Clean up the div for other support tests.\n\
  div.innerHTML = \"\";\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Executing both pixelPosition & boxSizingReliable tests require only one layout\n\
 * so they're executed at the same time to save the second computation.\n\
 */\n\
\n\
function computePixelPositionAndBoxSizingReliable() {\n\
  // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).\n\
  div.style.cssText = \"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;\" +\n\
    \"box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;\" +\n\
    \"position:absolute;top:1%\";\n\
  docElem.appendChild(container);\n\
\n\
  var divStyle = window.getComputedStyle(div, null);\n\
  pixelPositionVal = divStyle.top !== \"1%\";\n\
  boxSizingReliableVal = divStyle.width === \"4px\";\n\
\n\
  docElem.removeChild(container);\n\
}\n\
\n\
\n\
//@ sourceURL=css/lib/support.js"
));
require.register("css/lib/computed.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:computed');\n\
var withinDocument = require('within-document');\n\
var styles = require('./styles');\n\
\n\
/**\n\
 * Expose `computed`\n\
 */\n\
\n\
module.exports = computed;\n\
\n\
/**\n\
 * Get the computed style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Array} precomputed (optional)\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function computed(el, prop, precomputed) {\n\
  var computed = precomputed || styles(el);\n\
  var ret;\n\
  \n\
  if (!computed) return;\n\
\n\
  if (computed.getPropertyValue) {\n\
    ret = computed.getPropertyValue(prop) || computed[prop];\n\
  } else {\n\
    ret = computed[prop];\n\
  }\n\
\n\
  if ('' === ret && !withinDocument(el)) {\n\
    debug('element not within document, try finding from style attribute');\n\
    var style = require('./style');\n\
    ret = style(el, prop);\n\
  }\n\
\n\
  debug('computed value of %s: %s', prop, ret);\n\
\n\
  // Support: IE\n\
  // IE returns zIndex value as an integer.\n\
  return undefined === ret ? ret : ret + '';\n\
}\n\
//@ sourceURL=css/lib/computed.js"
));


















require.alias("component-each/index.js", "css/deps/each/index.js");
require.alias("component-each/index.js", "each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("visionmedia-debug/index.js", "css/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "css/deps/debug/debug.js");
require.alias("visionmedia-debug/index.js", "debug/index.js");

require.alias("ianstormtaylor-to-camel-case/index.js", "css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-camel-case/index.js", "to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "css/deps/within-document/index.js");
require.alias("component-within-document/index.js", "within-document/index.js");

require.alias("component-domify/index.js", "css/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("component-assert/index.js", "css/deps/assert/index.js");
require.alias("component-assert/index.js", "assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("jkroso-equals/index.js", "component-assert/deps/equals/index.js");
require.alias("jkroso-type/index.js", "jkroso-equals/deps/type/index.js");

require.alias("component-load-styles/index.js", "css/deps/load-styles/index.js");
require.alias("component-load-styles/index.js", "css/deps/load-styles/index.js");
require.alias("component-load-styles/index.js", "load-styles/index.js");
require.alias("component-load-styles/index.js", "component-load-styles/index.js");
require.alias("css/index.js", "css/index.js");