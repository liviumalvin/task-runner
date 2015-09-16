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

            lib.config.should.have.property('authToken');

            try {
                lib.config.authToken.should.equal(lib.data.token);
                lib.data.auth = true;
            } catch (e) {
                lib.data.auth = false;
                throw e;
            }
        }
    };
}());