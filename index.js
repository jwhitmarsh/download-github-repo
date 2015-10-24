var request = require('request');
var fs = require('fs-extra');
var Q = require('q');
var unzip = require('unzip');
var log = require('./util/log');
var _ = require('lodash');

module.exports = function(options) {

  /**
   * Default request options
   */
  var requestOptions = {
    encoding: null,
    auth: {
      user: options.user,
      pass: options.password
    },
    headers: {
      'User-Agent': 'request'
    }
  };

  /**
   * Download GitHub `repo` to `dest` and callback `fn(err)`.
   * @param {String} repo
   * @param {String} dest
   * @param {Function} fn
   */
  function download(url, cb) {
    options.url = url !== undefined ? url : options.url;

    var zipname = options.name + '.zip';
    var file = fs.createWriteStream(zipname);

    log.info('donloading...', options.url);
    var req = request.get(options.url, requestOptions);
    req.pipe(file);

    req.on('error', function(error) {
      log.error(error);
    });

    req.on('end', function() {
      _extractZip(zipname, cb);
    });
  }

  function _extractZip(zipPath, cb) {
    log.info('extracting', zipPath);
    var extractFile = options.name + '-' + options.url.split('/').pop();
    fs.createReadStream(zipPath)
      .pipe(unzip.Parse())
      .on('entry', function(entry) {
        var fileName = entry.path;
        var type = entry.type; // 'Directory' or 'File'
        var zipParent = fileName.substr(0, fileName.indexOf('/'));
        fileName = fileName.replace(zipParent, extractFile);

        if (type === 'Directory') {
          fs.ensureDirSync('./' + fileName);
        } else {
          entry.pipe(fs.createWriteStream('./' + fileName));
        }
      })
      .on('close', cb);
  }

  /**
   * Normalize a repo string.
   * @return {void}
   */
  function _normalize() {
    var owner = options.repo.split('/')[0];
    var name = options.repo.split('/')[1];
    var branch = 'master';
    var definedBranch = ~name.indexOf('#');

    // ~ bitwise truthy because indexOf() returns a negative int (-1) if not found
    if (definedBranch) {
      branch = name.split('#')[1];
      name = name.split('#')[0];
    }

    options = _.assign(options, {
      owner: owner,
      name: name,
      branch: branch,
      definedBranch: definedBranch
    });
  }

  /**
   * Return a GitHub url for a given `repo` object.
   * @param {Object} repo
   * @return {String}
   */
  function _setBranchUrl() {
    options.url = 'https://github.com/' + options.owner + '/' + options.name + '/zipball/' + options.branch;
  }

  var tags = function() {
    var deferred = Q.defer();
    var tagsUrl = 'https://api.github.com/repos/' + options.owner + '/' + options.name + '/tags';
    requestOptions.json = true;

    request.get(tagsUrl, requestOptions, function(err, response, body) {
      if (err) {
        deferred.reject(err);
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  };

  var branches = function() {
    var deferred = Q.defer();
    var tagsUrl = 'https://api.github.com/repos/' + options.owner + '/' + options.name + '/branches';
    requestOptions.json = true;

    request.get(tagsUrl, requestOptions, function(err, response, body) {
      if (err) {
        deferred.reject(err);
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  };

  if (!options.repo || !options.repo.length) {
    throw new Error('repo is a required field');
  }

  _normalize();
  _setBranchUrl();

  return {
    tags: tags,
    branches: branches,
    download: download
  };

};
