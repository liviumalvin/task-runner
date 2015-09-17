(function () {
    var Task = {
            lib: {}
        },
        slugify;


    slugify = function slugify(text) {

        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '-')   // Remove all non-word chars
            .replace(/\-\-+/g, '-')      // Replace multiple - with single -
            .replace(/^-+/, '')          // Trim - from start of text
            .replace(/-+$/, '');         // Trim - from end of text
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
     * Get the branch name
     */
    Task.getBranchName = function () {
        var branch;
        try {
            this.lib.request.body.should.have.property("ref");
            branch = this.lib.request.body.ref.split("refs/heads/").pop();
        } catch (e) {
            //@todo is there any other way of reading branch names?
        }

        this.lib.data.branch = {
            slug : slugify(branch),
            name : branch
        };
    };

    /**
     * Retrieves the last relevant commit
     */
    Task.getCommit = function () {
        var commits = [];

        try {
            this.lib.request.body.should.have.property("commits");
            commits = this.lib.request.body.commits;
        } catch (e) {
            //@todo no commits at all? why did the hook trigger?
        }

        //Filter the ones that are meant to be deployed
        commits = commits.filter(function (item) {
            return (-1 !== item.message.substr(0,3).indexOf("[D]"))
        });

        if (1 <= commits.length) {
            this.lib.data.commit = commits.pop(); // get the last one. After all, this one should contain latest things.
        }
    };

    /**
     * Store repo info
     */
    Task.getRepoData = function () {
        this.lib.data.repository =  this.lib.request.body.repository;
    };

    /**
     * Process the received data
     */
    Task.processData = function () {

        this.checkRequestStructure();
        this.getBranchName();
        this.getCommit();
        this.getRepoData();

        this.lib.data.namespace = this.lib.request.query.namespace;
        this.lib.data.token     = this.lib.request.query.token;

        //if there is any commit which should be deployed, launch the authorization process
        if (this.lib._.has(this.lib.data, 'commit')) {
            this.lib.app.tasks.run("authorizeRequest");
        }

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