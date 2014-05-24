/**
 * Qbyco Continuos Integration Agent
 * @author Qbyco
 * @version  0.1.0
 */
(function () {
    "use strict";

    var server = require("express"),
        bp = require("body-parser"),
        app = server(),
        nodeRunner = require("child_process").exec,
        smtpTransport,
        mailer = require('nodemailer'),
        config = require("./configs/main.json"),
        jade,
        jade_runtime,
        jade_filters;

    
    //Setup jade
    jade = require("jade");
    jade_runtime = require('./node_modules/jade/lib/runtime'),
    jade_filters = require('./node_modules/jade/lib/filters');
    jade_filters.nl2br = function(text) {
      return jade_runtime.escape(text).replace(/\n/g, "<br/>");
    }
    
    //Init smtp       
    smtpTransport = mailer.createTransport("SMTP", config.smtp);
    
    //Use bodyparser
    app.use(bp()); // to support JSON-encoded bodies                                                                                                                                                                                                                     


    //Init recipes repo
    nodeRunner("git clone " + config.recipes + " ./recipes", function (error, stdout, stderr) {
        if (error) {
            console.log("Recipes GIT: " + error.message);
            return false;
        }

        console.log(stdout, stderr);
    });

    app.post("/", function (req, res) {
        var recipe,
            branch,
            QbycoCI = {},
            Runner = {};

        if ("982739mm2jf" !== req.query.token) {
            res.write("Welcome to QbycoCI");
            res.end();
            return false;
        }

        //Set constants                                                                                                                                                                                                                                                   
        QbycoCI.path = config.app.location;
        QbycoCI.project = req.query.recipe;
        QbycoCI.recipe = require(QbycoCI.path + "recipes/" + req.query.recipe + "/main.json");
        QbycoCI.branch = req.body.ref.split("/").pop();

        //Handle config file
        if ("object" !== typeof QbycoCI.recipe) {
            //Fail
            console.log("Malformed recipe for : -> " + req.query.recipe + "/" + QbycoCI.branch);
            return false;
        }

        //Fallback to master branch
        if (undefined === QbycoCI.recipe[QbycoCI.branch]) {
            QbycoCI.branch = "master";
        }

        //Get runner details
        Runner.branch = QbycoCI.branch;
        Runner.jobs = QbycoCI.recipe[Runner.branch].jobs;
        Runner.path = QbycoCI.recipe[Runner.branch].path;

        //Recursively run jobs
        Runner.execute = function (jobs, log) {
            var name,
                file,
                env;

            if (undefined === log) {
                log = "";
                log += "\n[RUNNING CI]\n";
            }

            if (0 === jobs.length) {
                var commit;

                //Get last commit
                if (0 < req.body.commits.length) {
                    commit = req.body.commits.shift();                    
                }

                //Handle output
                var mailOptions = {
                    from: config.mail.from,
                    to: config.mail.to,
                    subject: "[QbycoCI] " + "(" + Runner.branch + ")" + QbycoCI.project.toUpperCase(),
                    html: jade.renderFile(__dirname + '/emails/deploy.jade', {
                        log: log.replace(/\n/g, "<br/>"),
                        author: commit.author.name + " (" + commit.author.email + ")",
                        project: QbycoCI.project,
                        branch: Runner.branch,
                        commit: commit.message
                    })
                };

                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) console.log(error);
                    return true;
                });

                return true;
            }

            name = jobs.shift();
            file = Runner.jobs[name].file;
            env = Runner.jobs[name].env;


            log += "(*)Running for " + name + " job on " + Runner.branch + "\n";
            log += " -> " + env + " " + file + "\n";

            nodeRunner("cd " + Runner.path + " && pwd", function (error, stdout, stderr) {
                nodeRunner(env + " " + file, {
                    cwd: QbycoCI.path + "recipes/" + QbycoCI.project + "/jobs/"
                }, function (error, stdout, stderr) {

                    if (null !== error) {
                        //Fail
                        log = "FAILED ON : " + env + " " + file + "\n";
                        log += "[FATAL ERROR]" + error.message;
                    } else {
                        log += "[STDOUT]:\n" + stdout + "\n[STDERR]\n" + stderr + "\n";
                    }

                    //Next job
                    Runner.execute(jobs, log);
                });
            });
        }

        Runner.execute(Object.keys(Runner.jobs));
        res.end();
    });

    app.listen(config.app.port);
}());