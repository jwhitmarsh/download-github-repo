var wget = require('download');
var request = require('request');
var fs = require('fs');

/**
 * Expose `download`.
 */

module.exports = download;

/**
 * Download GitHub `repo` to `dest` and callback `fn(err)`.
 *
 * @param {String} repo
 * @param {String} dest
 * @param {Function} fn
 */

function download(options, cb) {
  var url = github(normalize(options.repo));
  var req = request.get(url, {
    encoding: null,
    auth: {
      user: options.user,
      pass: options.password
    },
    headers: {
      'User-Agenct': 'request'
    }
  });
  var file = fs.createWriteStream('lamp-backend-master.zip');
  var data = [];

  req.pipe(file);

  req.on('error', function(error) {
    console.error(error);
  });

  req.on('end', function() {
    cb(0);
  });
}

/**
 * Return a GitHub url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function github(repo) {
  return 'https://github.com/' + repo.owner + '/' + repo.name + '/archive/' + repo.branch + '.zip';
}

/**
 * Normalize a repo string.
 *
 * @param {String} string
 * @return {Object}
 */

function normalize(string) {
  var owner = string.split('/')[0];
  var name = string.split('/')[1];
  var branch = 'master';

  if (~name.indexOf('#')) {
    branch = name.split('#')[1];
    name = name.split('#')[0];
  }

  return {
    owner: owner,
    name: name,
    branch: branch
  };
}
