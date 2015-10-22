var download = require('./index');
var commander = require('commander');
var pgk = require('./package.json');

commander
  .version(pgk.version)
  .option('-r, --repo <repo>', 'Repo to download')
  .option('-u, --user <user>', 'Github username')
  .option('-p, --password <password>', 'Github password')
  .parse(process.argv);


var options = {
  repo: commander.repo,
  user: commander.user,
  password: commander.password,
  dest: './'
};

download(options, function(err) {
  if (err) return console.log(err);
  console.log('done');
});
