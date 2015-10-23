var request = require('request');
var fs = require('fs-extra');
var Q = require('q');
var unzip = require('unzip');

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
    var zipname = options.normalizedRepo.name + '.zip';
    var file = fs.createWriteStream(zipname);
    var extractFile = options.normalizedRepo.name + '-' + url.split('/').pop();

    req.pipe(file);

    req.on('error', function(error) {
      console.error(error);
    });

    req.on('end', function() {
      fs.createReadStream(zipname)
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
    });
  }

  /**
   * Return a GitHub url for a given `repo` object.
   *
   * @param {Object} repo
   * @return {String}
   */
  function github(repo) {
    return 'https://github.com/' + repo.owner + '/' + repo.name + '/zipball/' + repo.branch;
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
    var definedBranch = ~name.indexOf('#')

    // ~ bitwise truthy because indexOf() returns a negative int (-1) if not found
    if (definedBranch) {
      branch = name.split('#')[1];
      name = name.split('#')[0];
    }

    options.normalizedRepo = {
      owner: owner,
      name: name,
      branch: branch,
      definedBranch: definedBranch
    };

    return {
      owner: owner,
      name: name,
      branch: branch,
      definedBranch: definedBranch
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
    download: download,
    github: github
  };

};
