(function () {
    var Task = {
        lib: {}
    };

    /**
     * Check for needed dependencies
     */
    Task.checkRequestStructure = function () {
        this.lib.should.have.property('request');

        this.lib.request.should.have.property("body");
        this.lib.request.should.have.property("query");

        this.lib.request.body.should.have.property("repository");
        this.lib.request.body.repository.should.have.property("name");
        this.lib.request.body.repository.should.have.property("url");

        this.lib.request.query.should.have.property("token");
        this.lib.request.query.should.have.property("namespace");
    };

    /**
     * Process the received data
     */
    Task.processData = function () {

        this.checkRequestStructure();

        this.lib.data.namespace = this.lib.request.query.namespace;
        this.lib.data.token     = this.lib.request.query.token;

        this.lib.app.tasks.run("authorizeRequest");

    };

    /**
     * Run the task
     * @param lib
     */
    Task.run = function (lib) {
        this.lib = lib;

        try {
            lib.should.have.property('request');
            this.processData();
        } catch (e) {
            //Silently fail, this is not a request
        }
    };

    /**
     * Task.init
     * @param lib
     */
    Task.init = function (lib) {
        lib.should.have.property("events");

        lib.events.on("gitlab.hook", function (http) {
            Task.lib.request = http.request;

            //Store the response object, others may use it
            Task.lib.storage.response = http.response;

            try {
                Task.processData();
                http.response.write(JSON.stringify(Task.lib.data));
            } catch (e) {
                http.response.write("Data incomplete.");
                http.response.write(e.toString());
            }

            //End response
            http.response.end();
        });
    };


    /**
     * Export needed function run
     * @param lib
     */
    module.exports = {
        run: function (lib) {
            return Task.run(lib);
        },
        init: function (lib) {
            return Task.init(lib);
        }
    };

}());