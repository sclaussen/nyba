'use strict';


const d = require('debug')('pr');
const YAML = require('yaml');
const stringify = require('json-stringify-safe');


function p(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d(label + ': ' + JSON.stringify(value));
            // d(label + ': ' + stringify(value));
            return;
        }

        if (typeof label === 'object') {
            d(JSON.stringify(label));
            // d(stringify(label));
            return;
        }

        d(label);
    };
}


function p4(d, replacer) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d(label + ': ' + JSON.stringify(value, replacer, 4));
            // d(label + ': ' + stringify(value, null, 4));
            return;
        }

        d(JSON.stringify(label, replacer, 4));
        // d(stringify(label, null, 4));
    };
}


function y(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d(label + ': ' + JSON.stringify(value));
            // d(label + ': ' + stringify(value));
            return;
        }

        d(YAML.stringify(label));
    };
}


function y4(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d(label + ': ' + JSON.stringify(value, null, 4));
            // d(label + ': ' + stringify(value, null, 4));
            return;
        }

        d(YAML.stringify(label, null, 4));
    };
}


function e(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d('Entering: ' + label + ': ' + JSON.stringify(value));
            // d('Entering: ' + label + ': ' + stringify(value));
            return;
        }

        d('Entering: ' + label);
    };
}


function e4(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d('Entering: ' + label + ': ' + JSON.stringify(value, null, 4));
            // d('Entering: ' + label + ': ' + stringify(value, null, 4));
            return;
        }

        d('Entering: ' + label);
    };
}


function ex(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d('Exiting: ' + label + ': ' + JSON.stringify(value));
            // d('Exiting: ' + label + ': ' + stringify(value));
            return;
        }

        d('Exiting: ' + label);
    };
}


function ex4(d) {
    return function(label, value) {

        if (!d.enabled) {
            return;
        }

        if (value) {
            d('Exiting: ' + label + ': ' + JSON.stringify(value, null, 4));
            // d('Exiting: ' + label + ': ' + stringify(value, null, 4));
            return;
        }

        d('Exiting: ' + labele);
    };
}


module.exports.p = p;
module.exports.p4 = p4;
module.exports.y = y;
module.exports.y4 = y4;
module.exports.e = e;
module.exports.e4 = e4;
module.exports.ex = ex;
module.exports.ex4 = ex4;
