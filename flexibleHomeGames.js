'use strict'
// process.env.DEBUG = 'schedule';
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

const commit = require('./transaction').commit;
const rollback = require('./transaction').rollback;
const schedule = require('./schedule');


function flexibleHomeGames(session) {
    commit(session);
    let attempts = 1;
    while (true) {
        schedulePairs(session);
        if (flexibleHomeGamesAttempt(session) === true) {
            break;
        }
        session = rollback();
        attempts++;

        if (attempts % 10000 === 0) {
            p('attempts', attempts);
        }
    }
    p('attempts', attempts);
    p('homeGames', session.homeGames);
    return session;
}


function schedulePairs(session) {
    for (let homeGame = 1; homeGame <= 4; homeGame++) {
        for (let pair of session.pairs) {
            let team1 = _.find(session.teams, { qualifiedName: pair.team1 });
            let team2 = _.find(session.teams, { qualifiedName: pair.team2 });
            if (!scheduleFlexibleHomeGamesForPair(session, team1, team2)) {
                return false;
            }
            pair.homeGames++;
        }
    }
}


function flexibleHomeGamesAttempt(session) {
    let organization = getOrganizationToSchedule(session);
    while (organization) {


        // let pair = getPair(session, organization);
        // if (pair) {
        //     let team1 = _.find(session.teams, { qualifiedName: pair.team1 });
        //     let team2 = _.find(session.teams, { qualifiedName: pair.team2 });
        //     if (!scheduleFlexibleHomeGamesForPair(session, team1, team2)) {
        //         return false;
        //     }
        //     pair.homeGames++;
        //     organization = getOrganizationToSchedule(session);
        //     continue;
        // }


        // Get a random team from the organization from the set that still has home games to schedule
        let team = _.sample(_.filter(session.teams, o => o.organization === organization && o.cache.homeWeeks.length < 4));
        if (!scheduleFlexibleHomeGame(session, team)) {
            return false;
        }

        organization = getOrganizationToSchedule(session);
    }

    return true;
}


function scheduleFlexibleHomeGame(session, team) {
    // p('Flexible Home Game', 'Team: ' + team.qualifiedName);

    // The set of net viable home weeks is:
    // - All league weeks (eg 1 through 10), minus
    // - the team's configured bye weeks, minus
    // - the team's configured no home game weeks, minus
    // - the team's already scheduled weeks, minus
    // - any division weeks where the number of games is already maxed out, minus
    // - any organization weeks where there is no more gym availability
    let netViableHomeWeeks = _.difference(team.cache.viableHomeWeeks, team.cache.scheduledWeeks, session.gameCapacityFullWeeks[team.division], session.gymCapacityFullWeeks[team.organization]);
    // p('    gameCapacityFullWeeks[' + team.division + ']', cache.gameCapacityFullWeeks[team.division]);
    // p('    netViableHomeWeeks', netViableHomeWeeks);

    if (netViableHomeWeeks.length === 0) {
        // p('        No viable weeks available');
        return false;
    }

    let week = _.sample(netViableHomeWeeks)
    schedule.homeGameNoOpponent(session, team, week);
    return true;
}


function getOrganizationToSchedule(session) {
    let orgsWithHomeGamesToSchedule = [];

    let teamsGroupedByOrganization = _.groupBy(session.teams, team => team.organization);
    for (let organization of _.keys(teamsGroupedByOrganization)) {

        let organizationRemainingHomeGamesToSchedule = 0;
        for (let team of _.filter(teamsGroupedByOrganization[organization], o => o.cache.homeWeeks.length < 4)) {
            organizationRemainingHomeGamesToSchedule += (4 - team.cache.homeWeeks.length);
        }

        let organizationRemainingGymCapacity = 0;
        for (let week of _.filter(session.gymCapacity, { organization: organization })) {
            organizationRemainingGymCapacity += week.available;
        }

        if (organizationRemainingHomeGamesToSchedule > 0) {
            orgsWithHomeGamesToSchedule.push({
                organization: organization,
                games: organizationRemainingHomeGamesToSchedule,
                gyms: organizationRemainingGymCapacity,
                pct: 1 - (organizationRemainingHomeGamesToSchedule / organizationRemainingGymCapacity)
            });
        }
    }

    if (orgsWithHomeGamesToSchedule.length === 0) {
        return null;
    }

    let sortedCapacity = _.sortBy(orgsWithHomeGamesToSchedule, [ 'pct' ]);
    let organization = sortedCapacity[0].organization;
    return organization;
}


function scheduleFlexibleHomeGamesForPair(session, team1, team2) {
    // p('Flexible Home Games for Pair', 'Team1: ' + team1.qualifiedName + '  Team2: ' + team2.qualifiedName);

    // The set of net viable home weeks is:
    // - All league weeks (eg 1 through 10), minus
    // - the team's configured bye weeks, minus
    // - the team's configured no home game weeks, minus
    // - the team's already scheduled weeks, minus
    // - any division weeks where the number of games is already maxed out, minus
    // - any organization weeks where there is no more gym availability
    let team1NetViableHomeWeeks = _.difference(team1.cache.viableHomeWeeks, team1.cache.scheduledWeeks, session.gameCapacityFullWeeks[team1.division], session.gymCapacityFullWeeks[team1.organization]);
    // p('    team1NetViableHomeWeeks', team1NetViableHomeWeeks);

    let team2NetViableHomeWeeks = _.difference(team2.cache.viableHomeWeeks, team2.cache.scheduledWeeks, session.gameCapacityFullWeeks[team1.division], session.gymCapacityFullWeeks[team2.organization]);
    // p('    team2NetViableHomeWeeks', team2NetViableHomeWeeks);

    let pairViableWeeks = _.intersection(team1NetViableHomeWeeks, team2NetViableHomeWeeks);
    if (pairViableWeeks.length === 0) {
        // p('        No viable weeks available');
        return false;
    }

    let week = _.sample(pairViableWeeks)
    schedule.homeGameNoOpponent(session, team1, week);
    schedule.homeGameNoOpponent(session, team2, week);
    return true;
}


function getPair(session, organization) {
    let organizationPairs = _.filter(session.pairs, o => o.organization === organization && o.homeGames < 4);
    if (organizationPairs.length > 0) {
        return _.sample(organizationPairs);
    }
    return null;
}


module.exports = flexibleHomeGames;
