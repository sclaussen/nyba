'use strict'
process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const YAML = require('yaml');

const p = require('./lib/pr').p(d);
const e = require('./lib/pr').e(d);
const p4 = require('./lib/pr').p4(d);
const y = require('./lib/pr').y(d);
const y4 = require('./lib/pr').y4(d);
const exit = require('./lib/exit');

const commit = require('./transaction').commit;
const rollback = require('./transaction').rollback;


function scheduleFlexibleAwayGames(session) {
    let divisions = _.uniq(_.map(session.teams, 'division'));
    for (let division of session.divisions) {
        scheduleFlexibleAwayGamesForDivision(session, _.filter(teams, { division: division }), pairs, _.filter(gameCapacity, { division: division }), gymCapacity);
    }
}


function scheduleFlexibleAwayGamesForDivision(session, teams, pairs, gameCapacity, gymCapacity) {
    p4(teams);
    p4(gameCapacity);
}


module.exports = scheduleFlexibleAwayGames;
