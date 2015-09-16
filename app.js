/**
 * Gitlab hook responder
 * @author Cornita Liviu <lcornita@marketstheworld.com>
 *
 * This server should:
 *
 * respond to gitlab hooks using an http server
 *
 *
 */
var App = require("./core.js"),
    Config = require("./configs/main.json"),
    Events = require('events'),
    Data = {},
    Storage = {};

/**
 * Create events instance
 */
Events = new Events();

App.shareResource('events', Events);
App.shareResource('config', Config);
App.shareResource('app', App);
App.shareResource('storage', Storage);
App.shareResource('data', Data);
App.shareResource('http', App.tasks.add("createHttpResponder"));

//Testing purposes only
/*App.shareResource('request', require('./req.json'));*/

App.tasks.run("getRequestInfo");
App.tasks.run("setHttpRoutes");
App.tasks.run("createHttpResponder");





