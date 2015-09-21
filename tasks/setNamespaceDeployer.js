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
            "/deploy";
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

        return "'" + query.join("' '") + "'";
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
            env;

        if (undefined === log) {
            this.lib.rollbar.reportMessageWithPayloadData("Starting the namespace deployment process...", {
                level: "debug",
                custom: {
                    namespace: this.lib.data.namespace
                }
            });
            log = true;
        }

        if (0 === jobs.length) {
            //Finish
            this.lib.rollbar.reportMessageWithPayloadData("Finished deploying the namespace", {
                level: "debug",
                custom: {
                    namespace: this.lib.data.namespace
                }
            });
            this.lib.events.emit("namespace.deployed");
            return true;
        }

        job = jobs.shift();
        file = job.file;
        env = job.env;


        this.lib.rollbar.reportMessageWithPayloadData("[" + job.name + "] Running deployment queued job .Waiting for it to end...", {
            level: "debug",
            custom: {
                namespace: this.lib.data.namespace,
                job: job
            }
        });

        this.lib.exec("cd " + this.getNamespaceInstallerPath() + " " + env + " " + file + " " + this.getJobParams(job.params), function (error, stdout, stderr) {

            Task.lib.rollbar.reportMessageWithPayloadData("[" + job.name + "] Job ended", {
                level: "debug",
                custom: {
                    namespace: Task.lib.data.namespace,
                    job: job,
                    stderr: stderr,
                    stdout: stdout
                }
            });

            //Next job
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

        this.lib.events.on("namespace.installed", function () {
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