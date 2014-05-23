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
        config = require("./configs/main.json");

    smtpTransport = mailer.createTransport("SMTP", config.smtp);
    app.use(bp()); // to support JSON-encoded bodies                                                                                                                                                                                                                     

    app.all("/", function (req, res) {
        var recipe,
            branch,
            QbycoCI = {},
            Runner = {};

        if ("POST" !== req.method) {
            res.write("Welcome to QbycoCI");
            res.end();
            return false;
        }

        if ("982739mm2jf" !== req.query.token) {
            res.write("Welcome to QbycoCI");
            res.end();
            return false;
        }

        //Set constants                                                                                                                                                                                                                                                   
        QbycoCI.path = "/home/gitlab_ci_runner/ci-projects/";
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
                log += "\n[COMMITS]\n";
                if (0 < req.body.commits.length) {
                    req.body.commits.forEach(function (commit) {
                        log += "\nAuthor: " + commit.author.name + " (" + commit.author.email + ")\n";
                        log += "ID: " + commit.id + "\n";
                        log += "Message: " + commit.message + "\n";
                        log += "Timestamp: " + commit.timestamp + "\n";
                        log += "Url: " + commit.url + "\n";
                    });
                }

                log += "\n[RUNNING CI]\n";
            }

            if (0 === jobs.length) {

                //Handle output
                var mailOptions = {
                    from: config.mail.from,
                    to: config.mail.to,
                    subject: "[QbycoCI] " + "(" + Runner.branch + ")" + QbycoCI.project.toUpperCase(),
                    text: log
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
                        log = "[FATAL ERROR]" + error.message;
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


    app.listen(25600);
}());