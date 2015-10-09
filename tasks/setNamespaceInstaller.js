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
                "/install";
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
            installTask,
            installCommand;

        if (undefined === log) {
            this.lib.babylog.debug("Starting the namespace installation process...");
            log = true;
        }

        if (0 === jobs.length) {
            //Finish
            this.lib.babylog.debug("Finished installing the namespace");
            this.lib.events.emit("namespace.installed");
            return true;
        }

        job = jobs.shift();
        file = job.file;
        env = job.env;


        installTask = this.lib.babylog.createTask(job.name.replace(/\s/g, '_'), "[" + job.name + "]");
        installCommand = this.lib.spawn(env, [file].concat(this.getJobParams(job.params)), {
            cwd: this.getNamespaceInstallerPath()
        });

        installCommand.on("error", function (error) {
            installTask.data.data = error.toString();
            installTask.end();
            Task.execJob(jobs, log);
        });

        installCommand.stdout.on("data", function (message) {
            installTask.feed("STDOUT: " + message.toString());
        });

        installCommand.stderr.on("data", function (message) {
            installTask.feed("STDERR: " + message.toString());
        });

        installCommand.on("close", function (code) {
            installTask.end();
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

        this.lib.events.on("namespace.resolved", function () {
            Task.lib.babylog.debug("Namespace was resolved OK");
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