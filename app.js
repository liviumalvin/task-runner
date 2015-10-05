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
    Babylog = require('node-babylog'),
    Data = {},
    Storage = {
        log: [],
        lastRunningLog: ""
    };

/**
 * Babylog instance
 */
Babylog = Babylog.getNewInstance(Config.babylog);


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
App.shareResource('babylog', Babylog);

App.shareResource('_', require("lodash"));
App.shareResource('spawn', require("child_process").spawn);

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
    Babylog.fatal("An uncaught exception was finally caught: " + error.toString());
});







