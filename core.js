(function () {
    "use strict";

    require("should");


    //Use a fake req
    var Server = {
        tasks: {
            store: {}
        },
        sharedResources: {}
    };

    /**
     * Server.shareResource
     * @param name
     * @param resource
     * @returns {boolean}
     */
    Server.shareResource = function (name, resource) {
        this.sharedResources[name] = resource;
        return true;
    };

    /**
     * Tasks.add
     * @param name
     */
    Server.tasks.add = function (name) {
        if (undefined === this.store[name]) {

            this.store[name] = require("./tasks/" + name + ".js");

            try {
                this.store[name].should.have.property("init");
                return this.store[name].init(this.extendLib({}));
            } catch (e) {
                //Silently move on, the task cannot init
            }
        }
        return true;
    };

    /**
     * Tasks.run
     * @param name
     * @param lib
     * @returns {*}
     */
    Server.tasks.run = function (name, lib) {
        try {
            this.store.should.have.property(name);
        } catch (e) {
            this.add(name);
        }

        this.store[name].should.have.property('run');
        (typeof this.store[name].run).should.equal('function');

        lib = this.extendLib(lib);

        //Run in its context
        return this.store[name].run(lib);

    };

    /**
     * Tasks.init
     * @param lib
     * @returns {*|{}}
     */
    Server.tasks.extendLib = function (lib) {
        lib = lib || {};

        if (0 < Object.keys(Server.sharedResources).length) {
            Object.keys(Server.sharedResources).forEach(function (item) {
                lib[item] = Server.sharedResources[item];
            });
        }

        return lib;
    };

    /**
     * Public by facade
     */
    module.exports = {
        tasks: {
            add: function (name) {
                return Server.tasks.add(name);
            },
            run: function (name, lib) {
                return Server.tasks.run(name, lib || {});
            }
        },
        shareResource: function (name, resource) {
            return Server.shareResource(name, resource);
        }
    };
}());