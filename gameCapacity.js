'use strict'
// process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const p = require('./lib/pr').p(d);
const e = require('./lib/pr').e(d);
const p4 = require('./lib/pr').p4(d);
const y = require('./lib/pr').y(d);
const y4 = require('./lib/pr').y4(d);

const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const YAML = require('yaml');


function getGameCapacity(session) {
    let gameCapacity = [];
    for (let division of _.uniq(_.map(session.teams, 'division'))) {
        let divisionTeams = _.filter(session.teams, { division: division });
        for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {

            let teamsPlayingInWeek = _.chain(divisionTeams)
                .filter(divisionTeam => !_.includes(divisionTeam.byeWeeks, week))
                .map(divisionTeam => ({ name: divisionTeam.name, organization: divisionTeam.organization }))
                .value();

            let gameCapacityForLeagueAndWeek = getWeeklyGameCapacityForDivisionAndWeek(teamsPlayingInWeek);

            gameCapacity.push({
                division: division,
                week: week,
                maximum: gameCapacityForLeagueAndWeek,
                available: gameCapacityForLeagueAndWeek
            });
        }
    }

    return gameCapacity;
}


function getWeeklyGameCapacityForDivisionAndWeek(teamsPlayingInWeek) {
    let maxCapacity = 0;
    while (teamsPlayingInWeek.length > 1) {
        let largestGroup = getGroup(teamsPlayingInWeek);
        let secondLargestGroup = getGroup(_.difference(teamsPlayingInWeek, largestGroup));
        let team1 = largestGroup[0];
        let team2 = secondLargestGroup[0];
        teamsPlayingInWeek = _.difference(teamsPlayingInWeek, [team1 ], [ team2 ]);
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


module.exports = getGameCapacity;
