/**
 * Gitlab hook responder
 * @author Cornita Liviu <cornita.liviu@yahoo.com>
 *
 * This server should:
 *
 * respond to gitlab hooks using an http server
 * call a default set of recipes based on the given namespace
 */
var App = require("./core.js"),
    Config = require("./configs/main.json"),
    Events = require('events'),
    Rollbar = require('rollbar'),
    Data = {},
    Storage = {
        log: [],
        lastRunningLog: ""
    };

/**
 * Rollbar init
 */
Rollbar.init(Config.rollbar.token, Config.rollbar.options);

/**
 * Create events instance
 */

Events = new Events.EventEmitter();

/**
 * Share resources
 */
App.shareResource('events', Events);
App.shareResource('config', Config);
App.shareResource('app', App);
App.shareResource('storage', Storage);
App.shareResource('data', Data);
App.shareResource('rollbar', Rollbar);

App.shareResource('_', require("lodash"));
App.shareResource('exec', require("child_process").exec);

App.shareResource('http', App.tasks.add("createHttpResponder"));

/**
 * Register system tasks
 */
App.tasks.run("fetchNamespaceRecipes");

//Gitlab @todo please move this to a separate controller
App.tasks.run("getRequestInfo");
App.tasks.run("setNamespaceResolver");
App.tasks.run("setNamespaceInstaller");
App.tasks.run("setNamespaceDeployer");
App.tasks.run("setNamespacePostDeployer");

//App related
App.tasks.run('recipesWatcher');
App.tasks.run("setHttpRoutes");
App.tasks.run("createHttpResponder");

//Handle uncaught
process.on("uncaughtException", function (error) {
    Rollbar.reportMessageWithPayloadData("An uncaught exception was finally caught: " + error.toString(), {
        level: "critical",
        custom: {
            error: error.message,
        }
    });
});







