'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');


let connect = function () {

    return new Promise((resolve) => {

        resolve();
    });
};

const stub = {
    'pg-promise': function () {

        return function () {

            return {
                connect: connect
            };
        };
    }
};
const Plugin = Proxyquire('../', stub);
const lab = exports.lab = Lab.script();
let request;
let server;


lab.beforeEach((done) => {

    server = new Hapi.Server();
    server.connection({ port: 0 });
    server.route({
        method: 'GET',
        path: '/',
        handler: function (req, reply) {

            /*if (req.query.kill) {
                req.pg.kill = true;
            }*/

            reply('hapi-pg-promise, at your service');
        }
    });

    request = {
        method: 'GET',
        url: '/'
    };

    done();
});


lab.experiment('Postgres Plugin', () => {

    lab.test('it registers the plugin', (done) => {

        server.register(Plugin, (err) => {

            server.start(() => {

                Code.expect(err).to.not.exist();
                done();
            });
        });
    });


    /*lab.test('it returns an error when the connection fails in the extension point', (done) => {

        const realConnect = connect;
        connect = function(resolve, reject) {
            return new Promise(function(resolve, reject) {
                reject(Error('connect failed'));
            });
        };

        server.register(Plugin, (err) => {

            server.start(() => {});
            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(500);
                connect = realConnect;

                done();
            });
        });
    });*/

    lab.test('it successfully returns when the connection succeeds in extension point', (done) => {

        const realConnect = connect;
        connect = function () {

            return new Promise((resolve, reject) => {

                resolve();
            });
        };

        // const realConnect = stub.pg.connect;
        // stub.pg.connect = function (connection, callback) {
        //
        //     const returnClient = () => {};
        //
        //     callback(null, {}, returnClient);
        // };

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                connect = realConnect;

                done();
            });
        });
    });


    /*lab.test('it successfully cleans up during the server tail event', (done) => {

        const realConnect = stub.pg.connect;
        stub.pg.connect = function (connection, callback) {

            const returnClient = function (killSwitch) {

                Code.expect(killSwitch).to.equal(true);
                stub.pg.connect = realConnect;

                done();
            };

            callback(null, {}, returnClient);
        };

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();

            request.url = '/?kill=true';

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                stub.pg.connect = realConnect;
            });
        });
    });*/


    lab.test('it successfully uses native bindings without error', (done) => {

        const pluginWithConfig = {
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:mysecretpassword@localhost/hapi_node_postgres',
                native: true
            }
        };

        server.register(pluginWithConfig, (err) => {

            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
