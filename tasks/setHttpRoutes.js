(function () {
    "use strict";

    var Router = [],
        duckTypeHttpRequest;

    //Inject lib into private context by duck typing
    duckTypeHttpRequest  = function (lib, handler) {
        return function (request, response) {
            handler(lib,request, response);
        }
    };

    /**
     * Routes
     */
    Router.push({
        route: "/",
        type: "post",
        handler: function (lib, request, response) {
            lib.events.emit('gitlab.hook', {
                request: request,
                response: response
            });
        }
    });

    Router.push({
        route: "/recipes/update",
        type: "get",
        handler: function (lib, request, response) {
            lib.events.emit('recipes.update', {
                request: request,
                response: response
            });
        }
    });

    Router.push({
        route: "/log",
        type: "get",
        handler: function (lib, request, response) {
            var nl2br;

            nl2br = require('nl2br');

            response.setHeader("Content-Type", "text/html");
            response.write("Last log: ");
            response.write(nl2br(lib.storage.log.join("<br/>")));
            response.end();
        }
    });

    /**
     * Public by facade
     * @param lib
     */
    module.exports.run = function (lib) {
        lib.should.have.property('http');
        lib.should.have.property('events');

        Router.forEach(function (routeObject) {
            lib.http.should.have.property(routeObject.type);
            lib.http[routeObject.type](routeObject.route, duckTypeHttpRequest(lib, routeObject.handler));
        });
    }

}());