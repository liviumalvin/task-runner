(function () {
    "use strict";

    var HttpInstance,
        Server = {
            lib: {}
        };

    /**
     * Require a basic http instance
     */
    HttpInstance = require("express");

    /**
     * Create server from the http instance
     */
    Server.http = HttpInstance();

    /**
     * Server.checkLibDependencies
     */
    Server.checkLibDependencies = function () {
        this.lib.should.have.property("config");
        this.lib.config.should.have.property("app");
        this.lib.config.app.should.have.property("port");
    };

    /**
     * Server.run
     * @param lib
     */
    Server.run = function (lib) {
        this.lib = lib;

        this.checkLibDependencies();

        //listen on port
        this.http.listen(this.lib.config.app.port);
    };

    Server.init = function (lib) {
        var bp;

        bp = require("body-parser");

        //Json parser
        this.http.use(bp.json());
        this.http.use(bp.urlencoded({ extended: true }));

        return this.http;
    };

    /**
     * Public by facade
     * @param lib
     */
    module.exports = {
        run : function (lib) {
            return Server.run(lib);
        },
        init: function (lib) {
            return Server.init(lib);
        }
    };


}());