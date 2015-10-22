#!/usr/bin/env node

var Download = require('../index');
var prompt = require('prompt');
var inquirer = require('inquirer');
var d;

prompt.start();

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
    d.download(answers.tag, function() {
      console.log('downloaded!');
    });
  });
}

prompt.get(['repo' /* ,'user', 'password' */ ], function(err, result) {
  if (err) {
    return console.error(err);
  }

  if (!result.user) {
    result.repo = 'dresources/lamp-backend';
    result.user = 'jwhitmarsh';
    result.password = 'W3lc0me!23456';
  }

  d = new Download(result);
  var normalizedRepo = d.normalize(result.repo);

  //d.tags(normalizedRepo).then(_gotTags);
});
