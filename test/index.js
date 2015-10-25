var assert = require('assert');
var _ = require('lodash');
var fs = require('fs-extra');

var RequestError = require('../util/request-error');
var Download = require('..');

describe('download-github-repo', function() {

  var validConfig = {
    "repo": "jwhitmarsh/dotfiles",
    "user": "jwhitmarsh@dresources.com",
    "password": "W3lc0me!23456"
  };

  describe('when instantiated', function() {

    it('should throw if options are undefined', function(done) {
      assert.throws(function() {
        var d = new Download();
        d.noop();
      }, Error, 'Options object required');
      done();
    });

    it('should throw if repo is undefined', function(done) {
      assert.throws(function() {
        var d = new Download({
          repo: undefined
        });
        d.noop();
      }, Error, 'Invalid Repo');
      done();
    });

    it('should throw if repo is empty string', function(done) {
      assert.throws(function() {
        var d = new Download({
          repo: ''
        });
        d.noop();
      }, Error, 'Invalid Repo');
      done();
    });

    it('should throw if repo is an invalid url', function(done) {
      assert.throws(function() {
        var d = new Download({
          repo: 'not a url'
        });
        d.noop();
      }, Error, 'Invalid Repo');
      done();
    });

    it('should normalize the repo', function(done) {
      var d = new Download(validConfig);
      d.noop();
      assert.equal(validConfig.owner, 'jwhitmarsh');
      assert.equal(validConfig.name, 'dotfiles');
      assert.equal(validConfig.branch, 'master');
      assert.equal(validConfig.definedBranch, false);
      done();
    });

    it('should normalize the repo with a defined branch', function(done) {
      var c = _.clone(validConfig);
      c.repo = 'jwhitmarsh/dotfiles#branch';

      var d = new Download(c);
      d.noop();
      assert.equal(c.owner, 'jwhitmarsh');
      assert.equal(c.name, 'dotfiles');
      assert.equal(c.branch, 'branch');
      assert.equal(!!c.definedBranch, true);
      done();
    });

    it('should set the url', function(done) {
      var d = new Download(validConfig);
      d.noop();
      assert.equal(validConfig.url, 'https://api.github.com/repos/jwhitmarsh/dotfiles/zipball/master');
      done();
    });

    it('should set the url to a branch', function(done) {
      var c = _.clone(validConfig);
      c.repo = 'jwhitmarsh/dotfiles#branch';

      var d = new Download(c);
      d.noop();
      assert.equal(c.url, 'https://api.github.com/repos/jwhitmarsh/dotfiles/zipball/branch');
      done();
    });

  });

  describe('download()', function() {

    it('should throw if url is invalid', function(done) {
      var d = new Download(validConfig);
      var fn = function() {
        d.download('asdfas', function(err) {
          if (err) {
            throw err;
          }
        });
      };
      assert.throws(function() {
        fn();
      }, RequestError);
      done();
    });

    it('should throw 404 if url cannot be found', function(done) {
      var d = new Download(validConfig);

      d.download('https://api.github.com/repos/jwhitmarsh/dotfiles/zipball/not-a-branch', function(err) {
        assert.equal(err.statusCode, 404);
        done();
      });
    });

    it('should throw 401 if not authorized', function(done) {
      var d = new Download({
        repo: 'dresources/abacus-dotfiles',
        user: 'notauser',
        password: 'badpassword'
      });

      d.download(undefined, function(err) {
        assert.equal(err.statusCode, 401);
        done();
      });
    });

    it('should download a zip', function(done) {
      var d = new Download(validConfig);

      d.download(undefined, function() {
        assert.doesNotThrow(function() {
          fs.statSync('dotfiles.zip');
        }, Error);
        fs.unlink('dotfiles.zip');
        done();
      });
    });

  });

});
