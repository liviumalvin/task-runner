(function () {
    "use strict";
    var Task = {},
        FS = require("fs");

    /**
     * Get base namespace path
     * @returns {string}
     */
    Task.getNamespacePath = function () {
        return FS.realpathSync("./recipes")  + "/" + this.lib.data.namespace;
    };

    /**
     * Task.run
     * Tries to resolve the namespace
     */
    Task.run = function () {

        this.lib.babylog.debug("Trying to resolve a namespace");

        try {

            FS.statSync(this.getNamespacePath());
            FS.statSync(this.getNamespacePath() + "/install");
            FS.statSync(this.getNamespacePath() + "/deploy");
            FS.statSync(this.getNamespacePath() + "/post-deploy");

            FS.statSync(this.getNamespacePath() + "/install/jobs.json");
            FS.statSync(this.getNamespacePath() + "/deploy/jobs.json");
            FS.statSync(this.getNamespacePath() + "/post-deploy/jobs.json");

            this.lib.events.emit("namespace.resolved");
        } catch (e) {

            this.lib.babylog.warning("Namespace not resolved due to inconsistent folder/file structure");
        }
    };

    /**
     * Initialize the namespace resolver
     * @param lib
     */
    Task.init = function (lib) {
        this.lib = lib;
        this.lib.should.have.property("events");

        this.lib.events.on("resolve.namespace", function () {
            Task.run();
        });
    };

    /**
     * Public by facade
     * @type {{init: Function, run: Function}}
     */
    module.exports = {
        init: function (lib) {
            Task.init(lib);
        },
        run : function () {}
    };
}());