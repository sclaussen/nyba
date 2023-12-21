'use strict'
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


var info;

var league;
var teams;
var gameCapacity;
var schedule = [];

var outerLoop;
var innerLoop;

var tolerance = 50;
var scheduleScore = 0;
var fullWeeks = [];
var idealSchedules = [];
var hashes = [];
var duplicateScheduleCount = 0;
var idealScheduleCount = 0;
var validScheduleCount = 0;
var possibleOpponentNames = {};
var startTime;
var out;


scheduleGames(process.argv);


async function scheduleGames(args) {

    info = YAML.parse(fs.readFileSync('./info.yaml', 'utf8'));
    info.gameCapacity = getGameCapacity(info);

    switch (args.length) {
    case 3:
        league = args[2];
        outerLoop = 1000;
        innerLoop = 1000;
        break;
    case 5:
        league = args[2];
        outerLoop = parseInt(args[3]);
        innerLoop = parseInt(args[4]);
        break;
    case 6:
        league = args[2];
        outerLoop = parseInt(args[3]);
        innerLoop = parseInt(args[4]);
        tolerance = parseInt(args[5]);
        break;
    case 7:
        league = args[2];
        outerLoop = parseInt(args[3]);
        innerLoop = parseInt(args[4]);
        tolerance = parseInt(args[5]);
        out = args[6];
        break;
    }

    generateSchedules(league);
}


function replacer(key, value) {
    if (key === 'opponents') {
        console.log('key');
        return _.map(opponents, 'name');
        // return undefined;
    }
    return value;
}


function generateSchedules(l) {
    startTime = moment();
    league = l;
    teams = _.filter(info.teams, { league: league });
    gameCapacity = _.filter(info.gameCapacity, { league: league });


    // Precompute a couple items
    for (let team of teams) {
        team.opponents = _.filter(teams, o => o.name !== team.name && o.name[0] !== team.name[0]);
        team.viableHomeWeeks = _.difference([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], team.byeWeeks, team.noHomeGymWeeks);
        team.viableAwayWeeks = _.difference([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], team.byeWeeks);
    }

    let totalScheduleCount = 0;
    idealScheduleCount = 0;
    validScheduleCount = 0;
    for (let i = 0; i < outerLoop; i++) {
        p('Starting: ' + i);
        if (i % (outerLoop / 10) === 0) {
            console.log(league + ': ' + Math.floor(i / outerLoop * 100) + '% Ideal: ' + idealScheduleCount.toLocaleString() + ' ' + elapsedTime());
        }


        // This might be the nth try at the schedule, so:
        // 1. Re-init the schedule to empty
        // 2. Reset the available games per week to the default max
        schedule = [];
        fullWeeks = [];
        scheduleScore = 0;
        for (let week of gameCapacity) {
            week.gamesAvailable = week.maximumGames;
        }
        for (let team of teams) {
            team.cache = {
                scheduledWeeks: [],
                scheduledWeeksAway: [],
                scheduledWeeksHomeWithoutOpponent: [],
                scheduledOpponents: {},
            }
        }


        // Scheduled FIXED HOME GAMES
        for (let team of _.filter(teams, o => o.fixedHomeGameWeeks.length > 0)) {
            for (let week of team.fixedHomeGameWeeks) {
                scheduleFixedHomeGame(team, week);
            }
        }


        // Scheduled FIXED AWAY GAMES
        for (let team of _.filter(teams, o => o.fixedAwayGameWeeks.length > 0)) {
            for (let week of team.fixedAwayGameWeeks) {
                scheduleFixedAwayGame(team, week);
            }
        }


        // Scheduled REMAINING FLEXIBLE HOME GAMES
        let failure = false;
        for (let team of _.shuffle(teams)) {
            if (scheduleFlexibleHomeGames(team)) {
                continue;
            }
            failure = true;
            break;
        }
        if (failure) {
            totalScheduleCount++;
            continue;
        }


        // Debugging code to verify everything's working
        for (let team of teams) {
            y4(team.name + ': ' + _.filter(schedule, { homeTeam: team.name }).length + ' ' + _.filter(schedule, { awayTeam: team.name }).length);
        }
        // y4(_.sortBy(schedule, 'week'));

        // // p4(schedule);
        // for (let team of teams) {
        //     team.opponents = null;
        // }
        // p4(teams);
        // exit();

        // Scheduled REMAINING FLEXIBLE AWAY GAMES
        let savedSchedule = _.cloneDeep(schedule);
        let savedTeams = _.cloneDeep(teams);
        let savedScheduleScore = scheduleScore;
        for (let j = 0; j < innerLoop; j++) {
            totalScheduleCount++;

            let failure = false;
            for (let team of _.shuffle(teams)) {
                if (scheduleFlexibleAwayTeamOpponents(team)) {
                    continue;
                }
                failure = true;
                break;
            }

            if (!failure) {
                validScheduleCount++;
                if (scheduleScore <= tolerance) {
                    let hash = getHash(schedule);
                    if (!_.includes(hashes, hash)) {
                        idealScheduleCount++;
                        hashes.push(hash);
                        idealSchedules.push({
                            id: idealScheduleCount,
                            score: scheduleScore,
                            hash: hash,
                            schedule: schedule
                        });
                    } else {
                        duplicateScheduleCount++;
                    }
                }

                // printMatrix(league, schedule, teams);
                // exit();
            }

            // Compensation, roll back to the schedule before we
            // started scheduling the remaining flexible away games
            // and try again
            schedule = _.cloneDeep(savedSchedule);
            teams = _.cloneDeep(savedTeams);
            scheduleScore = savedScheduleScore;
        }
    }

    console.log(league + ': 100% Ideal: ' + idealScheduleCount.toLocaleString() + ' ' + elapsedTime());
    console.log(league + ': Duplicates: ' + duplicateScheduleCount);
    console.log(league + ': Good: ' + validScheduleCount);
    console.log(league + ': Ideal: ' + idealScheduleCount);
    if (outerLoop >= 1 && idealScheduleCount > 0) {
        const timestamp = moment().format('ddhhmmss');
        let idealSchedules50 = _.take(_.sortBy(idealSchedules, [ 'score', 'week' ]), 50);
        for (let i in idealSchedules50) {
            let idealSchedule = idealSchedules50[i];
            idealSchedule.id = parseInt(i) + 1;
        }
        if (!out) {
            out = league + '-' + timestamp + '.yaml';
        }
        console.log(league + ': Generated: ' + out);
        fs.writeFileSync(out, YAML.stringify(idealSchedules50), 'utf8');
    }
}


function scheduleFixedHomeGame(team, week) {
    y('Fixed Home Game', 'Team: ' + team.name + '  Week: ' + week);

    if (_.find(gameCapacity, { week: week }).gamesAvailable === 0) {
        p('    week is out of game capacity');
        exit();
    }

    schedule.push({
        league: league,
        week: week,
        homeTeam: team.name,
        awayTeam: null,
        gym: team.name[0]
    });
    _.find(gameCapacity, { week: week }).gamesAvailable--;

    // Cache update
    cacheScheduleHomeGameNoOpponent(team, week);
}


// Assume the state is:
// Team to be scheduled is X
// The week has a game capacity of 5 total games that may be scheduled
// Here is what has already been scheduled at this point:
// 1. Team a @ b
// 3. Team TBD @ c
// 2. Team d @ TBD
// 4. Available
// 5. Available
//
// As a result, we want a 33% chance that one of these four schedules are the result:
// 3. Team d @ X (replacing Team d @ TBD)
// 4. Team TBD @ X (replacing Available)
// 5. Team TBD @ X (replacing Available)
function scheduleFixedAwayGame(team, week) {
    y('Fixed Away Game', 'Team: ' + team.name + '  Week: ' + week);

    // Generate all the potential options
    let options = [];
    // Add the options for all games for the week where there is a home team but not yet an away team
    for (let game of _.filter(schedule, o => o.week === week && o.awayTeam === null)) {
        options.push({ homeTeam: game.homeTeam });
    }
    // Add an option for each additional game capacity available during the week
    for (let i = _.find(gameCapacity, { week: week }).gamesAvailable; i > 0; i--) {
        options.push({ homeTeam: null });
    }

    if (options.length === 0) {
        p('    week is out of game capacity');
        exit();
    }

    // Randomly pick an option and schedule
    let option = _.sample(options);
    if (option.homeTeam === null) {

        // Scheduling away game w/out home opponent
        schedule.push({
            league: league,
            week: week,
            homeTeam: null,
            awayTeam: team.name,
        });
        _.find(gameCapacity, { week: week }).gamesAvailable--;

        // Cache update
        cacheScheduleAwayGameNoOpponent(team, week);

    } else {

        // Updating existing home game - adding the team as the away team
        let game = _.find(schedule, { week: week, homeTeam: option.homeTeam });
        game.awayTeam = team.name;

        // Cache update
        let opponent = _.find(teams, { name: game.homeTeam });
        cacheScheduleAwayGameWithOpponent(team, opponent, week);
    }
}


function scheduleFlexibleHomeGames(team) {
    p('Flexible Home Games', 'Team: ' + team.name);

    for (let game = 1; game <= (4 - team.fixedHomeGameWeeks.length); game++) {
        p('    Game', game);

        let viableHomeWeeks = _.shuffle(_.difference(team.viableHomeWeeks, team.cache.scheduledWeeks, fullWeeks));
        p('        viableHomeWeeks', viableHomeWeeks);

        let gameScheduled = false;
        for (let week of viableHomeWeeks) {

            let options = [];

            // Get the week's games with an opponent and no HOME team
            for (let game of _.filter(schedule, { week: week, homeTeam: null })) {
                options.push({ week: week, awayTeam: game.awayTeam });
            }

            // Get the remaining game capacity for the week
            for (let i = _.find(gameCapacity, { week: week }).gamesAvailable; i > 0; i--) {
                options.push({ week: week, awayTeam: null });
            }

            if (options.length === 0) {
                p('        ' + week, 'week is full');
                fullWeeks.push(week);
                continue;
            }

            gameScheduled = true;
            let option = _.sample(options);
            if (option.awayTeam === null) {

                // New home game without an opponent
                schedule.push({
                    league: league,
                    week: option.week,
                    homeTeam: team.name,
                    awayTeam: null,
                    gym: team.name[0]
                });
                _.find(gameCapacity, { week: option.week }).gamesAvailable--;

                // Cache update
                cacheScheduleHomeGameNoOpponent(team, week);

            } else {

                // New home game with an opponent
                let game = _.find(schedule, { week: option.week, awayTeam: option.awayTeam });
                game.homeTeam = team.name;
                game.gym = team.name[0];

                // Cache update
                let opponent = _.find(teams, { name: game.awayTeam });
                cacheScheduleHomeGameWithOpponent(team, opponent, week);
            }
            break;
        }

        if (!gameScheduled) {
            p('        No viable weeks available');
            return false;
        }
    }

    return true;
}


function scheduleFlexibleAwayTeamOpponents(team) {
    p('Flexible Away Games', 'Team: ' + team.name);

    // for (let team of teams) {
    //     team.opponents = null;
    // }
    // p4(teams);
    // exit();


    // Iterate through all the home games that do not have an opponent
    let scheduledWeeksHomeWithoutOpponent = _.shuffle(team.cache.scheduledWeeksHomeWithoutOpponent);
    p('    scheduledWeeksHomeWithoutOpponent', scheduledWeeksHomeWithoutOpponent);
    for (let week of scheduledWeeksHomeWithoutOpponent) {
        p('    ' + team.name + ' week', week);

        // Get the ideal opponent
        let opponent = getIdealOpponent(team, week);
        if (!opponent) {
            p('        NO OPPONENT FOUND');
            return false;
        }

        let game = _.find(schedule, { week: week, homeTeam: team.name });
        game.awayTeam = opponent.name;

        // Cache update
        cacheScheduleAddOpponent(team, opponent, week);
    }

    return true;
}


function getIdealOpponent(team, week) {

    let opponents = [];
    p('        opponents', _.map(team.opponents, 'name'));
    for (let opponent of team.opponents) {

        // Verify the potential away opponent does not have 4 away games already
        if (opponent.cache.scheduledWeeksAway.length === 4) {
            p('        ' + opponent.name + ' has 4 away games already');
            continue;
        }

        // Skip the team if they are already playing a game during the week
        if (_.includes(opponent.cache.scheduledWeeks, week)) {
            p('        ' + opponent.name, 'playing');
            continue;
        }

        // Skip the team the week is not viable due to byes
        if (!_.includes(opponent.viableAwayWeeks, week)) {
            p('        ' + opponent.name, 'bye');
            continue;
        }

        // Determine the number of times the home team hosts the away team, and, vice versa
        let homeAwayGameCount = parseInt(_.get(team, `cache.scheduledOpponents[${opponent.name}]`, 0));
        let awayHomeGameCount = parseInt(_.get(opponent, `cache.scheduledOpponents[${team.name}]`, 0));
        if (homeAwayGameCount > 2 || awayHomeGameCount > 2 || (homeAwayGameCount + awayHomeGameCount >= 3)) {
            p('        ' + opponent.name, 'played ' + homeAwayGameCount + '(H)/' + awayHomeGameCount + '(A) times.');
            continue;
        }

        // TODO: Uncomment if we need to enable intra organization play
        // let sameOrgPenalty = 0;
        // if (team[0] === opponent[0]) {
        //     sameOrgPenalty += 1;
        // }

        // Away team is valid, but the number of home/away games
        // already between the home team and the away team will help
        // prioritize whether this is the right match, plus whether
        // the game is intra org.
        opponents.push({
            opponent: opponent.name,
            golfPriority: homeAwayGameCount + awayHomeGameCount
        });
    }

    if (opponents.length === 0) {
        return null;
    }

    let orderedOpponents = _.orderBy(opponents, [ 'golfPriority' ], [ 'asc' ]);
    // p4('        ordered/remaining', orderedOpponents);
    let orderedOpponentsMap = _.map(orderedOpponents, 'opponent');
    p('        ordered/remaining', orderedOpponentsMap);

    let opponent = _.find(teams, { name: orderedOpponentsMap[0] });
    return opponent;
}


function printCache(team) {
    p('            CACHE');
    p('            - team', team.name);
    p('            - team.cache.scheduledWeeks', team.cache.scheduledWeeks);
    p('            - team.cache.scheduledWeeksHomeWithoutOpponent', team.cache.scheduledWeeksHomeWithoutOpponent);
    p('            - team.cache.scheduledWeeksAway', team.cache.scheduledWeeksAway);
    p('            - team.cache.scheduledOpponents', team.cache.scheduledOpponents);
    p('            - score', scheduleScore);
}

function cacheScheduleHomeGameNoOpponent(team, week) {
    p('        ' + team.name + ':' + week + ': Scheduled home WITHOUT opponent  Team: ' + team.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.scheduledWeeksHomeWithoutOpponent.push(week);
    printCache(team);
}

function cacheScheduleHomeGameWithOpponent(team, opponent, week) {
    p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled home WITH opponent  Team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.scheduledWeeksHomeWithoutOpponent.push(week);
    cacheAddOpponent(team, opponent);
    // cacheAddOpponent(opponent, team);
    printCache(team);
    printCache(opponent);
}

function cacheScheduleAwayGameNoOpponent(team, week) {
    p('        ' + team.name + ':' + week + ': Scheduled away WITHOUT opponent  Team: ' + team.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.scheduledWeeksAway.push(week);
    printCache(team);
}

function cacheScheduleAwayGameWithOpponent(team, opponent, week) {
    p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled away WITH opponent  Team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
    team.cache.scheduledWeeks.push(week);
    team.cache.scheduledWeeksAway.push(week);
    _.pull(opponent.cache.scheduledWeeksHomeWithoutOpponent, week);
    // cacheAddOpponent(team, opponent);
    cacheAddOpponent(opponent, team);
    printCache(team);
    printCache(opponent);
}


function cacheScheduleAddOpponent(team, opponent, week) {
    p('        ' + team.name + ':' + opponent.name + ':' + week + ': Scheduled new opponent for team: ' + team.name + '  Opponent: ' + opponent.name + '  Week: ' + week);
    opponent.cache.scheduledWeeksAway.push(week);
    opponent.cache.scheduledWeeks.push(week);
    _.pull(team.cache.scheduledWeeksHomeWithoutOpponent, week);
    cacheAddOpponent(team, opponent);
    printCache(team);
    printCache(opponent);
}


// Scoring system (in time sequence):
//      Home Away Score
// t1   O    X    0
// t2   X    Y    0
// t3   X    O    X=1 (1 point for home & away)
// t3   X    O    X=5
// t4   X    O    X=13
// t5   O    X    X=13,O=4
function cacheAddOpponent(team, opponent) {
    if (!team.cache.scheduledOpponents[opponent.name]) {
        team.cache.scheduledOpponents[opponent.name] = 0;
        if (_.get(opponent, `cache.scheduledOpponents[${team.name}]`, 0) > 0) {
            scheduleScore += 1;
            p('            SCORE: Added 1 because first time team is playing opponent that is playing team', scheduleScore);
        }
    }

    team.cache.scheduledOpponents[opponent.name]++;

    switch (team.cache.scheduledOpponents[opponent.name]) {
    case 0:
    case 1:
        break;
    case 2:
        scheduleScore += 5;
        p('            SCORE: Added 4 because team is playing opponent twice', scheduleScore);
        break;
    case 3:
        scheduleScore += 12;
        p('            SCORE: Added 8 because team is playing opponent twice', scheduleScore);
        break;
    default:
        scheduleScore += 26;
        p('            SCORE: Added 16 because team is playing opponent twice', scheduleScore);
        break;
    }
}


function printSchedule() {
    // p4(schedule);

    process.stdout.write(''.padEnd(5) + '\t');
    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        process.stdout.write(week.toString().padEnd(7) + '\t');
    }
    console.log();


    for (let team of _.map(teams, 'name')) {

        // Line 1
        process.stdout.write(team.padEnd(5) + '\t');
        for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
            let game = _.find(schedule, o => o.week === week && (o.homeTeam === team || o.awayTeam === team));
            if (!game) {
                process.stdout.write('bye'.padEnd(7) + '\t');
                continue;
            }

            if (game.homeTeam === team) {
                process.stdout.write((_.find(teams, { name: game.awayTeam }).name).padEnd(7) + '\t');
            } else {
                process.stdout.write((_.find(teams, { name: game.homeTeam }).name + ' (A)').padEnd(7) + '\t');
            }
        }
        console.log();
    }
}


function printMatrix(league, schedule, teams) {
    printSchedule();

    for (let team of teams) {
        y4(team.name + ': ' + _.filter(schedule, { homeTeam: team.name }).length + ' ' + _.filter(schedule, { awayTeam: team.name }).length);
    }


    let teamNames = _.map(teams, 'name');

    console.log();
    console.log('Score: ' + scheduleScore);
    console.log('League: ' + league);

    process.stdout.write(''.padEnd(5));
    for (let team of teamNames) {
        process.stdout.write(team.padEnd(5));
    }
    console.log();

    for (let team of teamNames) {
        process.stdout.write(team.padEnd(5));
        for (let awayTeam of teamNames) {
            // p(awayTeam);
            if (team === awayTeam) {
                process.stdout.write('-'.padEnd(5));
                continue;
            }
            let count = _.filter(schedule, { homeTeam: team, awayTeam: awayTeam }).length;
            if (count === 0) {
                process.stdout.write(''.toString().padEnd(5));
            } else {
                process.stdout.write(count.toString().padEnd(5));
            }
        }
        console.log();
    }
}


function elapsedTime() {
    const endDate = moment(); // current time
    const duration = moment.duration(endDate.diff(startTime));
    const minutes = Math.floor(duration.asMinutes() * 10) / 10;
    return 'Elapsed: ' + minutes;
}


function getHash(jsonData) {
    const jsonString = JSON.stringify(jsonData);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
}
