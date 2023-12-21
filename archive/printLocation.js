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
const center = require('./lib/util').center;
const left = require('./lib/util').left;
const exit = require('./lib/exit');


printByLocation(process.argv);


async function printByLocation(args) {
    let input = args[2];

    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));

    let master = YAML.parse(fs.readFileSync(input, 'utf8'));
    generateLocation(master, leagues, info.teams);
}


function generateLocation(master, leagues, teams) {

    process.stdout.write('Date'.padEnd(8) + '\t');
    process.stdout.write('Week'.padEnd(7) + '\t');
    process.stdout.write('Organization'.padEnd(30) + '\t');
    process.stdout.write('Location'.padEnd(30) + '\t');
    process.stdout.write('Time'.padEnd(8) + '\t');
    process.stdout.write('Away Team'.padEnd(8) + '\t');
    process.stdout.write('Home Team'.padEnd(8) + '\t');
    process.stdout.write('League'.padEnd(2) + '\t');
    console.log();
    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        let gyms = _.filter(master, { week: week });

        for (let gym of _.uniq(_.map(_.filter(master, { week: week }), 'gym'))) {
            let games = _.orderBy(_.filter(master, { week: week, gym: gym }), [ 'location.name' ], [ 'asc' ]);
            for (let game of games) {
                let homeTeam = _.find(teams, { name: game.homeTeam });
                let awayTeam = _.find(teams, { name: game.awayTeam });
                process.stdout.write(weekToDate(week).padEnd(8) + '\t');
                process.stdout.write('Week ' + game.week.toString().padEnd(7) + '\t');
                process.stdout.write(orgFull(game.gym) + '\t');
                process.stdout.write(('=hyperlink("' + game.location.map + '", "' + game.location.name + '")').padEnd(30) + '\t');
                process.stdout.write(game.location.time.padEnd(7) + '\t' );
                process.stdout.write(teamFull(awayTeam, game.awayTeam).padEnd(8) + '\t');
                process.stdout.write('@' + teamFull(homeTeam, game.homeTeam).padEnd(8) + '\t');
                process.stdout.write(leagueFull(game.league).padEnd(20) + '\t');
                console.log();
            }
        }
    }
}
