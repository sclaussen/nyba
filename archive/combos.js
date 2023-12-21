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


var yaoWeeksWithIncreasedCapacity = [];


combos(process.argv);


async function combos(args) {

    // Command line parameter for max combination size
    let comboBase = parseInt(args[2]);
    let comboMax = parseInt(args[3]);
    let threshold = parseInt(args[4]);
    let out = args[5] || 'combos.out';

    // Read the info metadata
    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    let leagues = _.uniq(_.map(info.teams, 'league'));

    // Read all N generated scheduled for each of the leagues
    let schedules = {};
    for (let league of leagues) {
        schedules[league] = YAML.parse(fs.readFileSync(league + '.yaml', 'utf8'));
    }

    // Analyze each combination to see if it fits in the gym capacity
    let combinations = [];
    for (let combination of generateCombinations(comboBase, comboMax)) {
        yaoWeeksWithIncreasedCapacity = [];
        let violations = analyzeCombination(leagues, schedules, info.gymCapacity, combination);
        if (violations <= threshold) {
            let s = '';
            s += violations + ' ';
            s += combination[0] + ' '; // g4
            s += combination[1] + ' '; // g56
            s += combination[2] + ' '; // g789
            s += combination[3] + ' '; // b45
            s += combination[4] + ' '; // b6
            s += combination[5] + ' '; // b7
            s += combination[6] + '\n'; // b89
            if (violations < 2) {
                console.log(s);
            }
            fs.appendFileSync(out, s, 'utf8');
        }

        for (let gym of info.gymCapacity) {
            gym.available = gym.maximum;
        }
    }
}


function adjustYaoGymCapacity(gymCapacity, week) {
    // If 4 weeks have already been adjusted, no change
    if (yaoWeeksWithIncreasedCapacity.length === 4) {
        // p('Capacity already maxed for week', week);
        return;
    }

    // If this week was already adjusted to 5, no change
    if (_.includes(yaoWeeksWithIncreasedCapacity, week)) {
        // p('Capacity already adjusted for week', week);
        return;
    }

    // p('Adjusting capacity for week', week);
    let gym = _.find(gymCapacity, { week: week, gym: 'y' });
    gym.available++;
    yaoWeeksWithIncreasedCapacity.push(week);
}


function analyzeCombination(leagues, schedules, gymCapacity, combination) {
    let violations = 0;
    for (let league of leagues) {

        let id;
        switch (league) {
        case 'g4':
            id = combination[0];
            break;
        case 'g56':
            id = combination[1];
            break;
        case 'g789':
            id = combination[2];
            break;
        case 'b45':
            id = combination[3];
            break;
        case 'b6':
            id = combination[4];
            break;
        case 'b7':
            id = combination[5];
            break;
        case 'b89':
            id = combination[6];
            break;
        }

        let schedule = _.find(schedules[league], { id: id }).schedule;
        for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
            for (let game of _.filter(schedule, { week: week })) {
                game.gym = game.homeTeam[0];
                if (game.gym === 'y') {
                    adjustYaoGymCapacity(gymCapacity, week);
                }
                let gym = _.find(gymCapacity, { week: week, gym: game.gym });
                if (gym.available <= 0) {
                    violations++
                }
                gym.available -= 1;
            }
        }
    }
    return violations;
}


function generateCombinations(comboBase, comboMax) {
    let combinations = [];
    let g4Base = comboBase;
    let g4Max = comboMax;
    if (comboMax > 17) {
        g4Base = 1;
        g4Max = 9;
    }
    for (let g4 = g4Base; g4 <= g4Max; g4++) {
        for (let g56 = comboBase; g56 <= comboMax; g56++) {
            for (let g789 = comboBase; g789 <= comboMax; g789++) {
                for (let b45 = comboBase; b45 <= comboMax; b45++) {
                    for (let b6 = comboBase; b6 <= comboMax; b6++) {
                        for (let b7 = comboBase; b7 <= comboMax; b7++) {
                            for (let b89 = comboBase; b89 <= comboMax; b89++) {
                                combinations.push([ g4, g56, g789, b45, b6, b7, b89 ]);
                            }
                        }
                    }
                }
            }
        }
    }
    return combinations;
}


function printGymCapacity(gymCapacity) {
    process.stdout.write(''.padEnd(10));
    for (let org of _.keys(orgs)) {
        process.stdout.write(org.padEnd(10));
    }
    console.log();
    process.stdout.write(''.padEnd(10));
    for (let org of [ 'm/a', 'm/a', 'm/a', 'm/a', 'm/a' ]) {
        process.stdout.write(org.padEnd(10));
    }
    console.log();

    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        process.stdout.write(''.padEnd(10));
        for (let gymName of _.uniq(_.map(gymCapacity, 'gym'))) {
            let gym = _.find(gymCapacity, { gym: gymName, week: week });
            let s = gym.maximum.toString() + '/' + gym.available.toString();
            process.stdout.write(s.padEnd(10));
        }
        console.log();
    }
}
