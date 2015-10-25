var request = require('request');
var fs = require('fs-extra');
var Q = require('q');
var unzip = require('unzip');
var log = require('./util/log');
var _ = require('lodash');
var RequestError = require('./util/request-error');
var ProgressBar = require('progress');

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

    req.on('response', function(res) {
      var len = parseInt(res.headers['content-length'], 10);

      var bar = new ProgressBar('[:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: len
      });

      res.on('data', function(chunk) {
        bar.tick(chunk.length);
      });
    });

    req.on('error', function(error) {
      log.error(error);
    });

    req.on('end', function() {
      _extractZip(zipname, cb);
    });
  }

  function getTags() {
    var deferred = Q.defer();
    var tagsUrl = 'https://api.github.com/repos/' + options.owner + '/' + options.name + '/tags';
    requestOptions.json = true;

    request.get(tagsUrl, requestOptions, function(err, response, body) {
      if (err) {
        return deferred.reject(err);
      }
      if (response.statusCode !== 200) {
        return deferred.reject(new RequestError(response));
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  }

  function getBranches() {
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
  }

  if (!options.repo || !options.repo.length || options.repo.indexOf('/') < 0) {
    throw new Error('Invalid Repo');
  }

  _normalize();
  _setBranchUrl();

  if (process.env.NODE_ENV === 'test') {
    return {
      _extractZip: _extractZip,
      _normalize: _normalize,
      _setBranchUrl: _setBranchUrl,
      getTags: getTags,
      getBranches: getBranches,
      download: download
    };
  }

  return {
    getTags: getTags,
    getBranches: getBranches,
    download: download
  };
};
