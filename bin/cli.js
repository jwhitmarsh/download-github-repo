#!/usr/bin/env node

var download = require('../index');
var pgk = require('../package.json');
var stdio = require('stdio');

var ops = stdio.getopt({
  'repo': {
    key: 'r',
    args: 1,
    description: 'Repo to download: "organisation/repo"',
    mandatory: true
  },
  'user': {
    key: 'u',
    args: 1,
    description: 'Github username',
    mandatory: true
  },
  'password': {
    key: 'p',
    args: 1,
    description: 'Github password',
    mandatory: true
  },
  'dest': {
    key: 'd',
    args: 1,
    description: 'destination',
    mandatory: false
  }
});

function main() {
  download(ops, function(err) {
    if (err) return console.log(err);
    console.log('done');
  });
}

main();
