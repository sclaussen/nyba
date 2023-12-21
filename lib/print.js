'use strict'
// process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const p = require('./pr').p(d);
const e = require('./pr').e(d);
const p4 = require('./pr').p4(d);
const y = require('./pr').y(d);
const y4 = require('./pr').y4(d);

const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const YAML = require('yaml');


function gameCapacity(session) {
    console.log();
    let divisions = _.uniq(_.map(session.gameCapacity, 'division'));
    process.stdout.write('week'.padEnd(5) + '\t');
    for (let division of divisions) {
        process.stdout.write(division.padEnd(5) + '\t');
    }
    console.log();

    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        process.stdout.write(week.toString().padEnd(4) + '\t');
        for (let division of divisions) {
            let gameCapacity = _.find(session.gameCapacity, { division: division, week: week });
            process.stdout.write(gameCapacity.available.toString().padEnd(4) + '\t');
            // process.stdout.write(gameCapacity.available.toString().padEnd(4) + '/' + gameCapacity.maximum.toString().padEnd(4) + '\t');
        }
        console.log();
    }
}


function gymCapacity(session) {
    console.log();
    let organizations = _.uniq(_.map(session.gymCapacity, 'organization'));
    process.stdout.write('week'.padEnd(5) + '\t');
    for (let organization of organizations) {
        process.stdout.write(organization.padEnd(5) + '\t');
    }
    console.log();

    for (let week of [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]) {
        process.stdout.write(week.toString().padEnd(4) + '\t');
        for (let organization of organizations) {
            let gymCapacity = _.find(session.gymCapacity, { organization: organization, week: week });
            process.stdout.write(gymCapacity.available.toString().padEnd(4) + '\t');
            // process.stdout.write(gymCapacity.available.toString().padEnd(4) + '/' + gymCapacity.maximum.toString().padEnd(4) + '\t');
        }
        console.log();
    }
}


module.exports.gameCapacity = gameCapacity;
module.exports.gymCapacity = gymCapacity;
