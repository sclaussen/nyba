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
const weekToDate = require('./lib/util').weekToDate;
const orgFull = require('./lib/util').orgFull;
const teamFull = require('./lib/util').teamFull;
const leagueFull = require('./lib/util').leagueFull;
const exit = require('./lib/exit');


printCorrelation(process.argv);


async function printCorrelation(args) {
    let input = args[2];

    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));

    let master = YAML.parse(fs.readFileSync(input, 'utf8'));
    correlation(master, leagues, info.teams);
}


function correlation(master, leagues, teams) {

    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        for (let gym of _.uniq(_.map(_.filter(master, { week: week }), 'gym'))) {
            let games = _.filter(master, { week: week, gym: gym });
            for (let game of games) {
                let homeTeam = _.find(teams, { name: game.homeTeam });
                let awayTeam = _.find(teams, { name: game.awayTeam });
                // if ((game.league === 'b7' && (game.homeTeam === 'j1' || game.awayTeam === 'j1'))) {

                if ((game.league === 'g4' && (game.homeTeam === 'j1' || game.awayTeam === 'j1')) ||
                    (game.league === 'b6' && (game.homeTeam === 'j2' || game.awayTeam === 'j2'))) {
                // //     // (game.league === 'b6' && (game.homeTeam === 'j2' || game.awayTeam === 'j2')) ||
                // if ((game.league === 'b45' && (game.homeTeam === 'a2' || game.awayTeam === 'a2')) ||
                //     (game.league === 'b6' && (game.homeTeam === 'a1' || game.awayTeam === 'a1'))) {
                    process.stdout.write(('Week ' + game.week.toString()).padEnd(8));
                    process.stdout.write(weekToDate(week).padEnd(10));
                    process.stdout.write(game.league.padEnd(5));
                    process.stdout.write((awayTeam.name + '@' + homeTeam.name).padEnd(8));
                    process.stdout.write(game.location.time.padEnd(10));
                    process.stdout.write(game.location.name.padEnd(30));
                    console.log();
                }
            }
        }
        console.log();
    }
}
