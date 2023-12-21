'use strict'
process.env.DEBUG = 'schedule';
const d = require('debug')('schedule');

const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const YAML = require('yaml');

const p = require('./pr').p(d);
const e = require('./pr').e(d);
const p4 = require('./pr').p4(d);
const y = require('./pr').y(d);
const y4 = require('./pr').y4(d);
const exit = require('./exit');



function weekToDate(week) {
    if (week === 1) {
        return '12-03-23';
    }
    if (week === 2) {
        return '12-10-23';
    }
    if (week === 3) {
        return '12-17-23';
    }
    if (week === 4) {
        return '01-07-24';
    }
    if (week === 5) {
        return '01-14-24';
    }
    if (week === 6) {
        return '01-21-24';
    }
    if (week === 7) {
        return '01-28-24';
    }
    if (week === 8) {
        return '02-04-24';
    }
    if (week === 9) {
        return '02-18-24';
    }
    if (week === 10) {
        return '02-25-24';
    }
}


function orgFull(s) {
    if (s === 'a') {
        return 'Assoc';
    }
    if (s === 'c') {
        return 'CYS';
    }
    if (s === 'j') {
        return 'JYO';
    }
    if (s === 't') {
        return 'TriCity';
    }
    if (s === 'y') {
        return 'YAO';
    }
}


function teamFull(team) {
    let s2 = orgFull(team.name[0]) + ' ' + team.name.toUpperCase();
    if (team.fullname) {
        s2 += ' ' + _.capitalize(team.fullname);
    }
    return s2;
}

function leagueFull(league) {
    if (league === 'g4') {
        return 'Girls 4th (G4)';
    }
    if (league === 'g56') {
        return 'Girls 5th/6th (G3)';
    }
    if (league === 'g789') {
        return 'Girls 7th/8th/9th (G2)';
    }
    if (league === 'b45') {
        return 'Boys 4th/5th (DA)';
    }
    if (league === 'b6') {
        return 'Boys 6th (DN)';
    }
    if (league === 'b7') {
        return 'Boys 7th (CA)';
    }
    if (league === 'b89') {
        return 'Boys 8th/9th (CN)';
    }
}


function center(s, width, ch = ' ') {
    const left = Math.floor((width - s.length) / 2);
    const right = width - s.length - left;
    return ch.repeat(left) + s + ch.repeat(right);
}


function left(s, width, ch = ' ') {
    return s.padEnd(width);
}


module.exports.weekToDate = weekToDate;
module.exports.orgFull = orgFull;
module.exports.teamFull = teamFull;
module.exports.leagueFull = leagueFull;
module.exports.center = center;
module.exports.left = left;
