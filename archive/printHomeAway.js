'use strict'
// process.env.DEBUG = 'schedule';
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
const weekToDate = require('./lib/util').weekToDate;
const orgFull = require('./lib/util').orgFull;
const teamFull = require('./lib/util').teamFull;
const leagueFull = require('./lib/util').leagueFull;
const exit = require('./lib/exit');


printHomeAway(process.argv);


async function printHomeAway(args) {
    let input = args[2];

    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));

    let master = YAML.parse(fs.readFileSync(input, 'utf8'));

    for (let league of leagues) {
        homeAway(league, _.filter(master, { league: league }), info.teams);
    }
}


function homeAway(league, schedule, teams) {
    let teamNames = _.map(_.filter(teams, { league: league }), 'name');

    console.log();
    process.stdout.write(leagueFull(league).padEnd(23) + '\t');
    for (let team of teamNames) {
        process.stdout.write(teamFull(_.find(teams, { name: team }), team).padEnd(12) + '\t');
    }
    console.log();

    for (let team of teamNames) {
        process.stdout.write(teamFull(_.find(teams, { name: team }), team).padEnd(23) + '\t');
        for (let awayTeam of teamNames) {
            p(awayTeam);
            if (team === awayTeam) {
                process.stdout.write('-'.padEnd(12) + '\t');
                continue;
            }
            let count = _.filter(schedule, { league: league, homeTeam: team, awayTeam: awayTeam }).length;
            if (count === 0) {
                process.stdout.write(''.toString().padEnd(12) + '\t');
            } else {
                process.stdout.write(count.toString().padEnd(12) + '\t');
            }
        }
        console.log();
    }
}
