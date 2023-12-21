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

const getGameCapacity = require('./gameCapacity');
const fixedHomeGames = require('./fixedHomeGames');
const flexibleHomeGames = require('./flexibleHomeGames');
const flexibleAwayGames = require('./flexibleAwayGames');
const print = require('./lib/print');


nyba(process.argv);


async function nyba(args) {
    let session = {
        teams: YAML.parse(fs.readFileSync('./config/teams.yaml', 'utf8')),
        pairs: YAML.parse(fs.readFileSync('./config/pairs.yaml', 'utf8')),
        gymCapacity: YAML.parse(fs.readFileSync('./config/gymCapacity.yaml', 'utf8')),
        gymSchedule: YAML.parse(fs.readFileSync('./config/gymSchedule.yaml', 'utf8')),
        schedule: [],
        gameCapacityFullWeeks: {},
        gymCapacityFullWeeks: {},
        homeGames: 0,
    }
    session.gameCapacity = getGameCapacity(session);
    // print.gameCapacity(session);

    homeCacheInit(session);

    // Scheduled FIXED HOME games
    fixedHomeGames(session);
    // print.gameCapacity(session);
    // p('Scheduled Home Games', cache.scheduledHomeGames);
    // fs.writeFileSync('./config/gameCapacity.yaml', YAML.stringify(session.gameCapacity), 'utf8');

    // Scheduled FLEXIBLE HOME games
    session = flexibleHomeGames(session);
    fs.writeFileSync('./config/schedule.yaml', YAML.stringify(session.schedule), 'utf8');
    // fs.writeFileSync('./config/session.yaml', YAML.stringify(session), 'utf8');
    print.gameCapacity(session);
    print.gymCapacity(session);

    // let count = 0;
    // for (let team of session.teams) {
    //     count += team.cache.homeWeeks.length;
    //     p(team.cache.homeWeeks.length);
    // }
    // p('count', count);
    exit();
    // p('Scheduled Home Games', cache.homeWeeks);
    // fs.writeFileSync('./config/schedule.yaml', YAML.stringify(cache.schedule), 'utf8');
    // fs.writeFileSync('./config/gameCapacity.yaml', YAML.stringify(gameCapacity), 'utf8');

    awayCacheInit(session);
    fs.writeFileSync('./config/teams-post.yaml', YAML.stringify(teams), 'utf8');

    // Scheduled FLEXIBLE AWAY games
    flexibleAwayGames(session);
}


function homeCacheInit(session) {

    for (let division of _.uniq(_.map(session.gameCapacity, 'division'))) {
        session.gameCapacityFullWeeks[division] = [];
    }

    for (let organization of _.uniq(_.map(session.gymCapacity, 'organization'))) {
        session.gymCapacityFullWeeks[organization] = [];
    }

    // Reset team cache
    for (let team of session.teams) {
        // team.opponents = _.filter(teams, o => o.name !== team.name && o.name[0] !== team.name[0]);
        team.cache = {
            viableHomeWeeks: _.difference([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], team.byeWeeks, team.noHomeGymWeeks),
            scheduledWeeks: [],
            homeWeeks: [],
            awayWeeks: [],
            homeWeeksNoOpponent: [],
            opponents: {},
        }
    }

    // Reset weekly game capacity (by division/week)
    for (let gameCapacityDivisionWeek of session.gameCapacity) {
        gameCapacityDivisionWeek.available = gameCapacityDivisionWeek.maximum;
    }

    // Reset weekly gym capacity (by organization/week)
    for (let gymCapacityOrganizationWeek of session.gymCapacity) {
        gymCapacityOrganizationWeek.available = gymCapacityOrganizationWeek.maximum;
    }
}


function awayCacheInit(session) {
    for (let team of session.teams) {
        // team.opponents = _.filter(teams, o => o.name !== team.name && o.name[0] !== team.name[0]);
        team.cache.viableAwayWeeks = _.difference([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], team.byeWeeks, team.cache.scheduledWeeks);
        team.cache.scheduledWeeks = team.cache.scheduledWeeks.sort();
        team.cache.homeWeeks = team.cache.homeWeeks.sort();
        team.cache.homeWeeksNoOpponent = team.cache.homeWeeksNoOpponent.sort();
    }
}


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
