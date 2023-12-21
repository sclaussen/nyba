'use strict'
const d = require('debug')('s2');

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


var info;
var schedule = [];
var teams;
var weeks;
var league;
var outerLoop;
var innerLoop;
var validSchedules = [];
var validScheduleCount = 0;


scheduleGames(process.argv);


// DEBUG=s2 node s2 g4:j2 b6:j1
// DEBUG=s2 node s2 b45:a2 b6:a1
async function scheduleGames(args) {
    let league1 = _.split(args[2], ':')[0];
    let team1 = _.split(args[2], ':')[1];
    let league2 = _.split(args[3], ':')[0];
    let team2 = _.split(args[3], ':')[1];
    p('league1', league1);
    p('team1', team1);
    p('league2', league2);
    p('team2', team2);

    let schedules1 = YAML.parse(fs.readFileSync(league1 + '.yaml', 'utf8'));
    let countMax1 = _.max(_.map(schedules1, 'count'));

    let schedules2 = YAML.parse(fs.readFileSync(league2 + '.yaml', 'utf8'));
    let countMax2 = _.max(_.map(schedules2, 'count'));

    for (let count1 = 1; count1 <= countMax1; count1++) {
        let schedule1 = _.filter(schedules1, { count: count1 });

        let homeWeeks1 = _.sortBy(_.map(_.filter(schedule1, { homeTeam: team1 }), 'week'));
        let homeWeeks1String = homeWeeks1.join('');

        let awayWeekGames1 = _.filter(schedule1, { awayTeam: team1 });
        let awayWeeks1 = _.sortBy(_.map(awayWeekGames1, 'week'));
        let awayWeeks1String = awayWeeks1.join('');

        for (let count2 = 1; count2 <= countMax2; count2++) {
            let schedule2 = _.filter(schedules2, { count: count2 });

            let homeWeeks2 = _.sortBy(_.map(_.filter(schedule2, { homeTeam: team2 }), 'week'));
            let homeWeeks2String = homeWeeks2.join('');

            let awayWeekGames2 = _.filter(schedule2, { awayTeam: team2 });
            let awayWeeks2 = _.sortBy(_.map(awayWeekGames2, 'week'));
            let awayWeeks2String = awayWeeks2.join('');

            if (homeWeeks1String === homeWeeks2String) {
                // p('Same homeWeeks',  homeWeeks1String);
                // p('  awayWeeks1', awayWeeks1);
                // p('  awayWeeks2', awayWeeks2);
                let intersectingWeeks = _.intersection(awayWeeks1, awayWeeks2);
                // p('  x weeks', intersectingWeeks);

                let countSame = 0;
                switch (intersectingWeeks.length) {
                case 2:
                case 3:
                case 4:
                    for (let week of intersectingWeeks) {
                        let awayWeekGame1 = _.find(awayWeekGames1, { week: week });
                        let awayWeekGame2 = _.find(awayWeekGames2, { week: week });
                        if (awayWeekGame1.homeTeam === awayWeekGame2.homeTeam) {
                            countSame++;
                        }
                    }
                }
                if (countSame > 1) {
                    console.log(count1 + ',' + count2);
                }
            }
        }
    }
}
