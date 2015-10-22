var request = require('request');
var fs = require('fs');
var Q = require('q');

module.exports = function(options) {
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
   *
   * @param {String} repo
   * @param {String} dest
   * @param {Function} fn
   */
  function download(url, cb) {
    var req = request.get(url, requestOptions);
    var file = fs.createWriteStream(options.normalizedRepo.name + '.zip');

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
  var normalize = function(string) {
    var owner = string.split('/')[0];
    var name = string.split('/')[1];
    var branch = 'master';

    if (~name.indexOf('#')) {
      branch = name.split('#')[1];
      name = name.split('#')[0];
    }

    options.normalizedRepo = {
      owner: owner,
      name: name,
      branch: branch
    };

    return {
      owner: owner,
      name: name,
      branch: branch
    };
  };


  var tags = function(repo) {
    var deferred = Q.defer();
    var tagsUrl = 'https://api.github.com/repos/' + repo.owner + '/' + repo.name + '/tags';
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
    var tagsUrl = 'https://api.github.com/repos/' + options.normalizedRepo.owner + '/' + options.normalizedRepo.name + '/branches';
    requestOptions.json = true;

    request.get(tagsUrl, requestOptions, function(err, response, body) {
      if (err) {
        deferred.reject(err);
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  };

  return {
    tags: tags,
    branches: branches,
    normalize: normalize,
    download: download
  };

};
