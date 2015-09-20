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
            log = [];
            log.push(" ");
            log.push("=========Running namespace deployer==========");
            log.push(" ");

        }

        if (0 === jobs.length) {
            //Finish
            this.lib.events.emit("namespace.deployed", log);
            return true;
        }

        job = jobs.shift();
        file = job.file;
        env = job.env;

        log.push("------------> [JOB: " + job.name + "]");
        this.lib.exec(env + " " + this.getNamespaceInstallerPath() + "/" + file + " " + this.getJobParams(job.params), function (error, stdout, stderr) {

            if (error) {
                log.push("[ERROR]: \r\n" + error.toString());
            }

            log.push("[STDOUT]: \r\n" + stdout);
            log.push("[STDERR]: \r\n" + stderr);
            log.push("<-----------------");
            log.push("");

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

        //When finish, store the log please
        this.lib.events.once("namespace.deployed", function (log) {
            Task.lib.storage.log.concat(log);
        });

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