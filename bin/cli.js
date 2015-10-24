#!/usr/bin/env node

var Download = require('../index');
var l = require('../util/log');
var prompt = require('prompt');
var inquirer = require('inquirer');
var gitConf = require('git-config');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var d;

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

function _start(config) {
  d = new Download(config);

  if (config.definedBranch) {
    return _download();
  }

  d.tags().then(_gotTags);
}

function _startWithPrompt(config) {
  prompt.start();

  var schema = [{
    name: 'repo',
    description: 'Github repo to download',
    type: 'string',
    required: true
  }, {
    name: 'user',
    description: 'Github user',
    type: 'string',
    required: true,
    default: config.user.email
  }, {
    name: 'password',
    description: 'Github password',
    type: 'string',
    required: true,
    hidden: true
  }];

  prompt.get(schema, function(err, result) {
    if (err) {
      return console.error(err);
    }

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
