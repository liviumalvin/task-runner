(function () {
    "use strict";
    var Task = {
            commands: {
                update: "cd :dir && git pull origin master",
                clone: "cd :dir && git clone :url ./:name"
            },
            action: "clone"
        },
        FS;

    FS = require('fs');

    /**
     * Get base namespace path
     * @returns {string}
     */
    Task.getNamespacePath = function (namespace) {
        return FS.realpathSync("./recipes")  +
            "/" +
            namespace;
    };

    Task.getNamespaceCommand = function (namespace) {
        var command = {};


        command.cwd = FS.realpathSync("./recipes");
        if ('update' === this.action) {

            command.cwd = this.getNamespacePath(namespace.name);
            command.args = [
                'pull',
                'origin',
                'master'
            ];
        } else {
            command.args = [
                'clone',
                namespace.url,
                './' + namespace.name
            ];
        }

        return command;
    };

    Task.fetchNamespaces = function () {
        var namespace;

        if (0 === this.namespaces.length) {
            this.lib.events.emit("recipes.updated", {});
        }

        namespace = this.namespaces.shift();

        if (undefined !== namespace) {
            try {
                FS.statSync(Task.getNamespacePath(namespace.name));
                Task.action = "update";
            } catch (e){
                Task.action = "clone";
            }

            Task.run(namespace);
        }
    };

    /**
     * Run the namespace installation
     * @param namespace
     */
    Task.run = function (namespace) {
        var nsTask,
            command,
            params,
            nl2br = require("nl2br");

        params = this.getNamespaceCommand(namespace);

        nsTask = this.lib.babylog.createTask('namespaceRecipesFetch',"[" + namespace.name + "] Git");
        nsTask.feed("Launching spawn with command: " + JSON.stringify(params));

        command = this.lib.spawn('git', params.args, {
            cwd: params.cwd,
            env: namespace.env
        });

        command.on("error", function (error) {
            nsTask.data.data = error.toString();
            nsTask.end();
        });

        command.stdout.on("data", function (feed) {
            nsTask.feed('STDOUT: ' + nl2br(feed));
        });

        command.stderr.on("data", function (feed) {
            nsTask.feed('STDERR: ' + nl2br(feed));
        });

        command.on("close", function (code) {
            nsTask.end();

            Task.fetchNamespaces();
        });
    };

    /**
     * Public by facade
     * @param lib
     */
    module.exports.run = function (lib) {

        Task.lib = lib;
        lib.should.have.property("config");

        Task.namespaces = JSON.parse(JSON.stringify(Task.lib.config.namespaces));
        Task.fetchNamespaces();
    };

}());