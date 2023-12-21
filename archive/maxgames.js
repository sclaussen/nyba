'use strict'
process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const moment = require('moment')

const YAML = require('yaml');

const p = require('./lib/pr').p(d);
const e = require('./lib/pr').e(d);
const p4 = require('./lib/pr').p4(d);
const y = require('./lib/pr').y(d);
const y4 = require('./lib/pr').y4(d);
const exit = require('./lib/exit');


maxGames(process.argv);


async function maxGames(args) {
    let info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    getGameCapacity(info);
}

functiong getGameCapacity(info) {
    let leagues = _.uniq(_.map(info.teams, 'league'));

    let gameCapacity = [];
    for (let league of leagues) {
        let teams = _.filter(info.teams, { league: league });
        for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
            let eligibleTeams = [];
            for (let team of teams) {
                if (_.includes(team.byeWeeks, week)) {
                    continue;
                }
                eligibleTeams.push({ name: team.name, organization: team.organization });
            }

            let gameCapacityForLeagueAndWeek = getGameCapacityForLeagueAndWeek(eligibleTeams);
            gameCapacity.push({
                league: league,
                week: week,
                maximumGames: gameCapacityForLeagueAndWeek,
                availableGames: gameCapacityForLeagueAndWeek
            });
        }
    }

    return gameCapacity;
    // fs.writeFileSync('gameCapacity.yaml', YAML.stringify({ gameCapacity: gameCapacity }), 'utf8');
}


function getGameCapacityForLeagueAndWeek(eligibleTeams) {
    let maxCapacity = 0;
    while (eligibleTeams.length > 1) {
        let largestGroup = getGroup(eligibleTeams);
        let secondLargestGroup = getGroup(_.difference(eligibleTeams, largestGroup));
        let team1 = largestGroup[0];
        let team2 = secondLargestGroup[0];
        eligibleTeams = _.difference(eligibleTeams, [team1 ], [ team2 ]);
        maxCapacity++;
    }
    return maxCapacity;
}


function getGroup(collection) {
    const grouped = _.groupBy(collection, 'organization');
    const counts = _.mapValues(grouped, (value, key) => value.length);
    const maxCount = _.max(_.values(counts));
    const maxGroups = _.pickBy(counts, count => count === maxCount);
    const maxKeys = Object.keys(maxGroups);
    const selectedKey = maxKeys[0];
    const subset = grouped[selectedKey];
    return subset;
}
