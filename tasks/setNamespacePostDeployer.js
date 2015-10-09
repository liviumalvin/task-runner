(function () {
    "use strict";
    var Task = {
            jobs : {}
        },
        FS = require("fs");

    /**
     * Get base namespace path
     * @returns {string}
     */
    Task.getNamespaceInstallerPath = function () {
        return FS.realpathSync("./recipes")  +
            "/" +
            this.lib.data.namespace +
            "/post-deploy";
    };

    /**
     * Append job required params
     * @param params
     * @returns {string}
     */
    Task.getJobParams = function (params) {
        var query = [];
        try {
            params.should.have.property('length');
            if (0 < params.length) {
                params.forEach(function (param) {

                    if (Task.lib._.has(Task.lib.data, param)) {
                        query.push(Task.lib._.get(Task.lib.data, param));
                    }
                });
            }
        } catch (e) {
            //Nothing to do here. move on
        }

        return query;
    };

    /**
     * Run jobs
     * @param jobs
     * @param log
     * @returns {boolean}
     */
    Task.execJob = function (jobs, log) {
        var job,
            file,
            env,
            deployTask,
            deployCommand;

        if (undefined === log) {
            this.lib.babylog.debug("Starting the namespace post-deployment process...");
            log = true;
        }

        if (0 === jobs.length) {
            //Finish
            this.lib.babylog.debug("Finished post-deploying the namespace");
            this.lib.events.emit("namespace.finished");
            return true;
        }

        job = jobs.shift();
        file = job.file;
        env = job.env;


        deployTask = this.lib.babylog.createTask(job.name.replace(/\s/g, '_'), "[" + job.name + "]");
        deployCommand = this.lib.spawn(env, [file].concat(this.getJobParams(job.params)), {
            cwd: this.getNamespaceInstallerPath()
        });

        deployCommand.on("error", function (error) {
            deployTask.setData(error.toString());
            deployTask.end();
            Task.execJob(jobs, log);
        });

        deployCommand.stdout.on("data", function (message) {
            deployTask.feed("STDOUT: " + message.toString());
        });

        deployCommand.stderr.on("data", function (message) {
            deployTask.feed("STDERR: " + message.toString());
        });

        deployCommand.on("close", function (code) {
            deployTask.end();
            Task.execJob(jobs, log);
        });
    };

    /**
     * Task.run
     * Tries to resolve the namespace
     */
    Task.run = function () {
        var jsonJobs,
            path;

        path = require('path');
        jsonJobs = this.getNamespaceInstallerPath() + "/jobs.json";

        delete require.cache[path.resolve(jsonJobs)];
        this.jobs = require(jsonJobs);

        //Execute if any jobs
        this.execJob(this.jobs);
    };

    /**
     * Initialize the namespace resolver
     * @param lib
     */
    Task.init = function (lib) {
        this.lib = lib;
        this.lib.should.have.property("events");

        this.lib.events.on("namespace.deployed", function () {
            Task.lib.babylog.debug("Namespace was deployed OK");
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