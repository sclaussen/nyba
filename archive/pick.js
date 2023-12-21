'use strict'
process.env.DEBUG = 'schedule';
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


pick(process.argv);


async function pick(args) {

    let leagueData = {
        g4: {
            id: parseInt(args[2]),
        },
        g56: {
            id: parseInt(args[3]),
        },
        g789: {
            id: parseInt(args[4]),
        },
        b45: {
            id: parseInt(args[5]),
        },
        b6: {
            id: parseInt(args[6]),
        },
        b7: {
            id: parseInt(args[7]),
        },
        b89: {
            id: parseInt(args[8]),
        },
    };


    let out = args[9];


    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));


    // Read all N generated scheduled for each of the leagues
    let master = [];
    let schedules = {};
    for (let league of leagues) {
        schedules[league] = YAML.parse(fs.readFileSync(league + '.yaml', 'utf8'));
        leagueData[league].schedule = _.find(schedules[league], { id: leagueData[league].id }).schedule;
        leagueData[league].schedule = _.map(leagueData[league].schedule, o => _.assign({}, o, { order: getOrder(o.league) }));
        master = master.concat(leagueData[league].schedule);
    }

    console.log('Writing ' + out);
    fs.writeFileSync(out, YAML.stringify(_.sortBy(master, [ 'order', 'week' ])), 'utf8');
}

function getOrder(league) {
    if (league === 'g4') {
        return 1;
    }
    if (league === 'g56') {
        return 2;
    }
    if (league === 'g789') {
        return 3;
    }
    if (league === 'b45') {
        return 4;
    }
    if (league === 'b6') {
        return 5;
    }
    if (league === 'b7') {
        return 6;
    }
    if (league === 'b89') {
        return 7;
    }
}
