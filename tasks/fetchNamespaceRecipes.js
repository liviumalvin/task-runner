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
        var command,
            dir;

        command = this.commands[this.action];
        command = command.replace(":url", namespace.url)
            .replace(":name", namespace.name);

        dir = FS.realpathSync("./recipes");
        if ('update' === this.action) {
            dir = this.getNamespacePath(namespace.name);
        }
        command = command.replace(":dir", dir);

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

        Task.lib.storage.log.push(" ---> [Fetching namespace:  " + namespace.name + "]");
        this.lib.exec(this.getNamespaceCommand(namespace), function (error, stdout, stderr) {

            Task.lib.storage.log.push("[STDOUT]: \r\n" + stdout);
            Task.lib.storage.log.push("[STDERR]: \r\n" + stderr);
            Task.lib.storage.log.push("-------------END-----------------");
            Task.lib.storage.log.push("");

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