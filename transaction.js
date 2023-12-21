'use strict'
// process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const _ = require('lodash');

const p = require('./lib/pr').p(d);
const e = require('./lib/pr').e(d);
const p4 = require('./lib/pr').p4(d);
const y = require('./lib/pr').y(d);
const y4 = require('./lib/pr').y4(d);
const exit = require('./lib/exit');


var sessionState;


function commit(session) {
    sessionState = _.cloneDeep(session);
}


function rollback() {
    return _.cloneDeep(sessionState);
}


module.exports.commit = commit;
module.exports.rollback = rollback;
