'use strict'
// process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const p = require('./lib/pr').p(d);
const e = require('./lib/pr').e(d);
const p4 = require('./lib/pr').p4(d);
const y = require('./lib/pr').y(d);
const y4 = require('./lib/pr').y4(d);
const exit = require('./lib/exit');

const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const YAML = require('yaml');

const schedule = require('./schedule');


function fixedHomeGames(session) {
    let teamsWithFixedHomeGameWeeks = _.filter(session.teams, o => o.fixedHomeGameWeeks.length > 0);
    for (let team of teamsWithFixedHomeGameWeeks) {
        for (let week of team.fixedHomeGameWeeks) {
            fixedHomeGame(session, team, week);
        }
    }
}


function fixedHomeGame(session, team, week) {
    y('Fixed Home Game', 'Team: ' + team.qualifiedName + '  Week: ' + week);

    let gameCapacityDivisionWeek = _.find(session.gameCapacity, { division: team.division, week: week });
    if (gameCapacityDivisionWeek.available === 0) {
        console.error('ERROR: No game capacity for division ' + team.division + ' on week ' + week + '.');
        exit();
    }

    let gymCapacityOrganizationWeek = _.find(session.gymCapacity, { organization: team.organization, week: week });
    if (gymCapacityOrganizationWeek.available === 0) {
        console.error('ERROR: No gym capacity for organization ' + team.organization + ' on week ' + week + '.');
        exit();
    }

    schedule.homeGameNoOpponent(session, team, week);
}


module.exports = fixedHomeGames;
