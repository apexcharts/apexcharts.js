'use strict';

var fs = require('fs');
var path = require('path');

var log = require('gulplog');
var yargs = require('yargs');
var Liftoff = require('liftoff');
var interpret = require('interpret');
var v8flags = require('v8flags');
var messages = require('@gulpjs/messages');
var findRange = require('semver-greatest-satisfied-range');

var exit = require('./lib/shared/exit');

var arrayFind = require('./lib/shared/array-find');
var makeTitle = require('./lib/shared/make-title');
var makeHelp = require('./lib/shared/options/make-help');
var cliOptions = require('./lib/shared/options/cli-options');
var completion = require('./lib/shared/completion');
var cliVersion = require('./package.json').version;
var toConsole = require('./lib/shared/log/to-console');
var mergeCliOpts = require('./lib/shared/config/cli-flags');
var buildTranslations = require('./lib/shared/translate');

// Get supported ranges
var ranges = fs.readdirSync(path.join(__dirname, '/lib/versioned/'));

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

var cli = new Liftoff({
  name: 'gulp',
  processTitle: makeTitle('gulp', process.argv.slice(2)),
  extensions: interpret.jsVariants,
  v8flags: v8flags,
  configFiles: [
    {
      name: '.gulp',
      path: '.',
      extensions: interpret.jsVariants,
      findUp: true,
    },
    {
      name: '.gulp',
      path: '~',
      extensions: interpret.jsVariants,
    },
  ],
});

var parser = yargs
  .help(false)
  .version(false)
  .detectLocale(false)
  .showHelpOnFail(false)
  .exitProcess(false)
  .fail(onFail)
  .options(cliOptions);

var opts = parser.parse();

// Set up event listeners for logging temporarily.
// TODO: Rework console logging before we can set up proper config
// Possibly by batching messages in gulplog until listeners are attached
var cleanupListeners = toConsole(log, opts, buildTranslations());

cli.on('preload:before', function(name) {
  log.info({ tag: messages.PRELOAD_BEFORE, name: name });
});

cli.on('preload:success', function(name) {
  log.info({ tag: messages.PRELOAD_SUCCESS, name: name });
});

cli.on('preload:failure', function(name, error) {
  log.warn({ tag: messages.PRELOAD_FAILURE, name: name });
  if (error) {
    log.warn({ tag: messages.PRELOAD_ERROR, error: error });
  }
});

cli.on('loader:success', function(name) {
  // This is needed because interpret needs to stub the .mjs extension
  // Without the .mjs require hook, rechoir blows up
  // However, we don't want to show the mjs-stub loader in the logs
  /* istanbul ignore else */
  if (path.basename(name, '.js') !== 'mjs-stub') {
    log.info({ tag: messages.LOADER_SUCCESS, name: name });
  }
});

cli.on('loader:failure', function(name, error) {
  log.warn({ tag: messages.LOADER_FAILURE, name: name });
  if (error) {
    log.warn({ tag: messages.LOADER_ERROR, error: error });
  }
});

cli.on('respawn', function(flags, child) {
  log.info({ tag: messages.NODE_FLAGS, flags: flags });
  log.info({ tag: messages.RESPAWNED, pid: child.pid });
});

function run() {
  cli.prepare({
    cwd: opts.cwd,
    configPath: opts.gulpfile,
    preload: opts.preload,
  }, onPrepare);
}

module.exports = run;

function isDefined(cfg) {
  return cfg != null;
}

function onFail(message, error) {
  // Run Liftoff#prepare to get the env. Primarily to load themes.
  cli.prepare({}, function (env) {
    // We only use the first config found, which is a departure from
    // the previous implementation that merged with the home
    var cfg = arrayFind(env.config, isDefined);
    var translate = buildTranslations(cfg);

    var errorMsg = translate.message({ tag: messages.ARGV_ERROR, message: message, error: error });
    if (errorMsg) {
      console.error(errorMsg);
    }

    makeHelp(parser, translate).showHelp(console.error);
    exit(1);
  });
}

function onPrepare(env) {
  // We only use the first config found, which is a departure from
  // the previous implementation that merged with the home
  var cfg = arrayFind(env.config, isDefined);
  var flags = mergeCliOpts(opts, cfg);

  // Remove the previous listeners since we have appropriate config now
  cleanupListeners();

  var translate = buildTranslations(cfg);

  // Set up event listeners for logging again after configuring.
  toConsole(log, flags, translate);

  cli.execute(env, cfg.nodeFlags, function (env) {
    onExecute(env, flags, translate);
  });
}

// The actual logic
function onExecute(env, flags, translate) {
  // Moved the completion logic outside of Liftoff since we need to include translations
  if (flags.completion) {
    return completion(flags.completion, translate);
  }

  // This translates the --continue flag in gulp
  // To the settle env variable for undertaker
  // We use the process.env so the user's gulpfile
  // Can know about the flag
  if (flags.continue) {
    process.env.UNDERTAKER_SETTLE = 'true';
  }

  if (flags.help) {
    makeHelp(parser, translate).showHelp(console.log);
    exit(0);
  }

  // Anything that needs to print outside of the logging mechanism should use console.log
  if (flags.version) {
    console.log('CLI version:', cliVersion);
    console.log('Local version:', env.modulePackage.version || 'Unknown');
    exit(0);
  }

  if (!env.modulePath) {
    var missingNodeModules =
      fs.existsSync(path.join(env.cwd, 'package.json'))
      && !fs.existsSync(path.join(env.cwd, 'node_modules'));

    var hasYarn = fs.existsSync(path.join(env.cwd, 'yarn.lock'));
    if (missingNodeModules) {
      log.error({ tag: messages.MISSING_NODE_MODULES, cwd: env.cwd });
      if (hasYarn) {
        log.error({ tag: messages.YARN_INSTALL })
      } else {
        log.error({ tag: messages.NPM_INSTALL })
      }
    } else {
      log.error({ tag: messages.MISSING_GULP, cwd: env.cwd });
      if (hasYarn) {
        log.error({ tag: messages.YARN_INSTALL_GULP });
      } else {
        log.error({ tag: messages.NPM_INSTALL_GULP });
      }
    }
    exit(1);
  }

  if (!env.configPath) {
    log.error({ tag: messages.MISSING_GULPFILE });
    exit(1);
  }

  // Chdir before requiring gulpfile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    log.info({ tag: messages.CWD_CHANGED, cwd: env.cwd });
  }

  // Find the correct CLI version to run
  var range = findRange(env.modulePackage.version, ranges);

  if (!range) {
    log.error({ tag: messages.UNSUPPORTED_GULP_VERSION, version: env.modulePackage.version });
    exit(1);
  }

  // Load and execute the CLI version
  var versionedDir = path.join(__dirname, '/lib/versioned/', range, '/');
  require(versionedDir)(env, flags, translate);
}
