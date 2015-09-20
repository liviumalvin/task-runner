(function () {
    "use strict";

    /**
     * Authorizes the request token
     * @type {{run: Function}}
     */
    module.exports = {
        run: function (lib) {

            lib.should.have.property('data');
            lib.data.should.have.property('token');
            lib.should.have.property('config');

            lib.config.should.have.property('auth');

            try {
                lib.config.auth.should.equal(lib.data.token);
                lib.data.auth = true;
            } catch (e) {
                lib.storage.log.push("Authorization failed. Stopping.");
                lib.data.auth = false;
                throw e;
            }

            lib.storage.log.push("Authorized. Starting the namespace deployment process");
            lib.events.emit("authorization.finished", lib.data.auth);
        }
    };
}());