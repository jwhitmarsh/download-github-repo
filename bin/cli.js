#!/usr/bin/env node

/* jshint latedef:nofunc */

var Download = require('../index');
var l = require('../util/log');
var inquirer = require('inquirer');
var gitConf = require('git-config');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var RequestError = require('../util/request-error');
var d;

var startConfig;

var promptSchema = {
  repo: {
    name: 'repo',
    message: 'Github repo to download',
    type: 'string',
    required: true
  },
  user: {
    name: 'user',
    message: 'Github user',
    type: 'string',
    required: true,
    default: null
  },
  password: {
    name: 'password',
    message: 'Github password',
    type: 'string',
    required: true,
    hidden: true
  }
};

function _download(url) {
  d.download(url, function() {
    l.info('done!');
  });
}

function _gotTags(tags) {
  var tagOptions = tags.map(function(tag) {
    return {
      name: tag.name,
      value: tag.zipball_url
    };
  });

  inquirer.prompt([{
    type: "list",
    name: "tag",
    message: "Pick a tag to download",
    choices: tagOptions
  }], function(answers) {
    _download(answers.tag);
  });
}

function _promptForAuth(cb) {
  inquirer.prompt([promptSchema.user, promptSchema.password], function(result) {
    cb(0, result);
  });
}

function _promptForRepo(cb) {
  inquirer.prompt([promptSchema.repo], function(result) {
    cb(0, result);
  });
}

function _handleStartRequestError(err) {
  // unauthorized
  if (err.statusCode === 401) {
    l.info(err.message);
    _promptForAuth(function(promptErr, result) {
      if (promptErr) {
        return l.error(promptErr);
      }
      _.assign(startConfig, result);
      _start(startConfig);
    });
  }

  // not found
  if (err.statusCode === 404) {
    l.info(err.message);
    _promptForRepo(function(promptErr, result) {
      if (promptErr) {
        return l.error(promptErr);
      }
      _.assign(startConfig, result);
      _start(startConfig);
    });
  }
}

function _handleStartError(err) {
  if (err instanceof RequestError) {
    return _handleStartRequestError(err);
  }
  throw err;
}

function _start(config) {
  startConfig = config;

  try {
    d = new Download(config);
  } catch (e) {
    l.error('error initializing Download()', e);
  }

  if (config.definedBranch) {
    return _download();
  }

  // q throws whether you handle it or not, so no try catch required
  d.tags()
    .then(_gotTags)
    .fail(_handleStartError)
    .done();
}

function _startWithPrompt(config) {
  promptSchema.user.default = config.user.email;
  inquirer.prompt([promptSchema.repo, promptSchema.user, promptSchema.password], function(result) {
    _start(result);
  });
}

function main() {
  gitConf(function(err, gitConfig) {
    if (err) {
      return l.error(err);
    }

    var options = {
      user: gitConfig.user
    };

    var configFilePath = path.join(process.cwd(), 'dgr-config.json');
    if (fs.existsSync(configFilePath)) {
      l.info('loading config file', configFilePath);

      _.assign(options, require(configFilePath));
      return _start(options);
    }

    _startWithPrompt(options);
  });
}

main();
