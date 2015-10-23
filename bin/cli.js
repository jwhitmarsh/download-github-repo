#!/usr/bin/env node

var Download = require('../index');
var prompt = require('prompt');
var inquirer = require('inquirer');
var gitConf = require('git-config');
var path = require('path');
var d;

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

function _download(url) {
  d.download(url, function() {
    console.log('\nDone!');
  });
}

function _start(config) {
  d = new Download(config);
  var normalizedRepo = d.normalize(config.repo);

  if (normalizedRepo.definedBranch) {
    return _download(d.github(normalizedRepo));
  }

  d.tags(normalizedRepo).then(_gotTags);
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

gitConf(function(err, config) {
  if (err) {
    return console.error(err);
  }

  try {
    config = require(path.join(process.cwd(), 'dgr-config.json'));
    return _start(config);
  } catch (e) {
    _startWithPrompt(config);
  }
});
