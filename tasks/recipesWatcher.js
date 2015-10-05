(function () {
    "use strict";
    var Task = {};

    Task.updateRecipes = function (lib, http) {


        //Update recipes
        lib.should.have.property('app');
        lib.app.tasks.run("fetchNamespaceRecipes");


        lib.babylog.endCapture();

        http.response.setHeader("Content-Type", "text/html");
        http.response.write("Sent for update");
        http.response.end();

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