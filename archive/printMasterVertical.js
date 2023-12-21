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
const center = require('./lib/util').center;
const left = require('./lib/util').left;
const exit = require('./lib/exit');


printMasterVertical(process.argv);


async function printMasterVertical(args) {
    let input = args[2];

    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));

    let master = YAML.parse(fs.readFileSync(input, 'utf8'));

    masterVertical(master, leagues, info.teams);
}


function masterVertical(master, leagues, teams) {

    // Header line 1
    process.stdout.write(''.padEnd(10) + '\t');
    for (let league of leagues) {
        let schedule = _.filter(master, { league: league });
        for (let team of _.map(_.filter(teams, { league: league }), 'name')) {
            process.stdout.write(teamFull(_.find(teams, { name: team })).padEnd(30) + '\t');
        }
    }
    console.log();
    process.stdout.write(''.padEnd(10) + '\t');
    for (let league of leagues) {
        let schedule = _.filter(master, { league: league });
        for (let team of _.map(_.filter(teams, { league: league }), 'name')) {
            process.stdout.write(leagueFull(league).padEnd(30) + '\t');
        }
    }
    console.log();
    console.log();


    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        process.stdout.write(left('Week ' + week.toString(), 10) + '\t');
        for (let league of leagues) {
            let schedule = _.filter(master, { league: league });
            for (let team of _.map(_.filter(teams, { league: league }), 'name')) {
                let games = _.filter(schedule, o => o.week ===  week && (o.homeTeam === team || o.awayTeam === team));
                if (games.length === 0) {
                    process.stdout.write(''.padEnd(30) + '\t');
                    continue;
                }
                if (games.length > 1) {
                    console.error('Error: More than one game in a week found!');
                    process.exit(1);
                }
                let game = games[0];
                process.stdout.write(game.location.time + '\t');
            }
        }
        console.log();

        process.stdout.write(left(weekToDate(week).toString(), 10) + '\t');
        for (let league of leagues) {
            let schedule = _.filter(master, { league: league });
            for (let team of _.map(_.filter(teams, { league: league }), 'name')) {
                let games = _.filter(schedule, o => o.week ===  week && (o.homeTeam === team || o.awayTeam === team));
                if (games.length === 0) {
                    process.stdout.write('bye'.padEnd(30) + '\t');
                    continue;
                }
                if (games.length > 1) {
                    console.error('Error: More than one game in a week found!');
                    process.exit(1);
                }
                let game = games[0];
                if (game.homeTeam === team) {
                    process.stdout.write((' vs. ' + teamFull(_.find(teams, { name: game.awayTeam })) + ' (Home)').padEnd(30) + '\t');
                } else {
                    process.stdout.write((' @ ' + teamFull(_.find(teams, { name: game.homeTeam })) + ' (Away)').padEnd(30) + '\t');
                }
            }
        }
        console.log();


        process.stdout.write(''.padEnd(10) + '\t');
        for (let league of leagues) {
            let schedule = _.filter(master, { league: league });
            for (let team of _.map(_.filter(teams, { league: league }), 'name')) {
                let games = _.filter(schedule, o => o.week ===  week && (o.homeTeam === team || o.awayTeam === team));
                if (games.length === 0) {
                    process.stdout.write(''.padEnd(30) + '\t');
                    continue;
                }
                if (games.length > 1) {
                    console.error('Error: More than one game in a week found!');
                    process.exit(1);
                }
                let game = games[0];
                process.stdout.write(('=hyperlink("' + game.location.map + '", "' + game.location.name + '")').padEnd(30) + '\t');
            }
        }


        console.log();
        console.log();
    }
}
