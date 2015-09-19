(function () {
    "use strict";
    var Task = {};

    Task.updateRecipes = function (lib, http) {
        var nl2br;

        http.response.setHeader("Content-Type", "text/html");

        nl2br = require("nl2br");

        //Update recipes
        http.response.write("Updating my recipes");

        lib.should.have.property('app');
        lib.app.tasks.run("fetchNamespaceRecipes");

        lib.events.once("recipes.updated", function () {
            http.response.write(nl2br(lib.storage.log.join("<br />")));
            http.response.end();
        });
    };

    /**
     * Public by facade
     * @param lib
     */
    module.exports = {
        init: function (lib) {
            lib.should.have.property("events");
            lib.events.on("recipes.update", function (http) {
                Task.updateRecipes(lib, http);
            });
        },
        run: function () {}
    };

}());