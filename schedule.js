'use strict'
process.env.DEBUG = 'schedule';
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


function homeGameNoOpponent(session, team, week) {
    // Update schedule
    session.schedule.push({
        division: team.division,
        week: week,
        homeTeam: team.name,
        qualifiedHomeTeam: team.division + ':' + team.name,
        awayTeam: null,
        qualifiedAwayTeam: null,
        gym: team.name[0]
    });
    session.homeGames++;

    // Update game capacity
    let gameCapacityDivisionWeek = _.find(session.gameCapacity, { division: team.division, week: week });
    gameCapacityDivisionWeek.available--;
    if (gameCapacityDivisionWeek.available === 0) {
        session.gameCapacityFullWeeks[team.division].push(week);
    }

    // Update gym capacity
    let gymCapacityOrganizationWeek = _.find(session.gymCapacity, { organization: team.organization, week: week });
    gymCapacityOrganizationWeek.available--;
    if (gymCapacityOrganizationWeek.available === 0) {
        session.gymCapacityFullWeeks[team.organization].push(week);
    }

    // p('        ' + team.name + ':' + week + ': Scheduled home WITHOUT opponent  Team: ' + team.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.homeWeeks.push(week);
    team.cache.homeWeeksNoOpponent.push(week);
    printCache(session, team, week);
}


function homeGameWithOpponent(session, team, opponent, week) {
    p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled home WITH opponent  Team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
    exit();
    team.cache.scheduledWeeks.push(week);
    team.cache.homeWeeks.push(week);
    team.cache.homeWeeksNoOpponent.push(week);
    cacheAddOpponent(team, opponent);
    // cacheAddOpponent(opponent, team);
    printCache(session, team, week);
    printCache(session, opponent, week);
}


function awayGameNoOpponent(session, team, week) {
    // p('        ' + team.name + ':' + week + ': Scheduled away WITHOUT opponent  Team: ' + team.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.awayWeeks.push(week);
    printCache(session, team, week);
}


function awayGameWithOpponent(session, team, opponent, week) {
    // p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled away WITH opponent  Team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.awayWeeks.push(week);
    _.pull(opponent.cache.homeWeeksNoOpponent, week);
    // cacheAddOpponent(team, opponent);
    cacheAddOpponent(opponent, team);
    printCache(session, team, week);
    printCache(session, opponent, week);
}


// function addOpponent(session, team, opponent, week) {
//     // p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled new opponent for team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
//     opponent.cache.awayWeeks.push(week);
//     opponent.cache.scheduledWeeks.push(week);
//     _.pull(team.cache.homeWeeksNoOpponent, week);
//     cacheAddOpponent(team, opponent);
//     printCache(session, team, week);
//     printCache(session, opponent, week);
// }


// // Scoring system (in time sequence):
// //      Home Away Score
// // t1   O    X    0
// // t2   X    Y    0
// // t3   X    O    X=1 (1 point for home & away)
// // t3   X    O    X=5
// // t4   X    O    X=13
// // t5   O    X    X=13,O=4
// function addOpponent(session, team, opponent) {
//     if (!team.cache.opponents[opponent.name]) {
//         team.cache.opponents[opponent.name] = 0;
//         if (_.get(opponent, `cache.opponents[${team.name}]`, 0) > 0) {
//             scheduleScore += 1;
//             p('            SCORE: Added 1 because first time team is playing opponent that is playing team', scheduleScore);
//         }
//     }

//     team.cache.opponents[opponent.name]++;

//     switch (team.cache.opponents[opponent.name]) {
//     case 0:
//     case 1:
//         break;
//     case 2:
//         scheduleScore += 5;
//         p('            SCORE: Added 4 because team is playing opponent twice', scheduleScore);
//         break;
//     case 3:
//         scheduleScore += 12;
//         p('            SCORE: Added 8 because team is playing opponent twice', scheduleScore);
//         break;
//     default:
//         scheduleScore += 26;
//         p('            SCORE: Added 16 because team is playing opponent twice', scheduleScore);
//         break;
//     }
// }


function printCache(session, team, week) {
    // p('            CACHE');
    // p('            - team', team.qualifiedName);
    // p('            - week', week);
    // p('            - gameCapacity', _.find(gameCapacity, { division: team.division, week: week }));
    // p('            - gymCapacity', _.find(gymCapacity, { organization: team.organization, week: week }));
    // p('            - team.cache.scheduledWeeks', team.cache.scheduledWeeks);
    // p('            - team.cache.homeWeeks', team.cache.homeWeeks);
    // p('            - team.cache.homeWeeksNoOpponent', team.cache.homeWeeksNoOpponent);
    // p('            - team.cache.awayWeeks', team.cache.awayWeeks);
    // p('            - team.cache.opponents', team.cache.opponents);
    // p('            - score', scheduleScore);
}


module.exports.homeGameNoOpponent = homeGameNoOpponent;
module.exports.homeGameWithOpponent = homeGameWithOpponent;
module.exports.awayGameNoOpponent = awayGameNoOpponent;
module.exports.awayGameWithOpponent = awayGameWithOpponent;
