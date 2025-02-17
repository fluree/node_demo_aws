const express = require('express');
const bodyParser = require('body-parser');
const process = require('process');
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // switch out to xhr2 https://stackoverflow.com/questions/32604460/xmlhttprequest-module-not-defined-found/46081151#46081151
global.WebSocket = require('ws');  // https://flaviocopes.com/node-websockets/
require('@fluree/flureenjs');

const server = express();
const PORT = 3000;

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

var flureeDbConn;
var njsConnections = [];
var flureeIsAvailable = false;
var isShuttingDown = false;
var listener; // defined by listener function

//------------------------
// Handlers for shut-down
//------------------------
function shutDownHandler() {
    isShuttingDown = true;
    console.log('Received kill signal, shutting down gracefully');
    listener.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    njsConnections.forEach(curr => curr.end());
    setTimeout(() => njsConnections.forEach(curr => curr.destroy()), 5000);

    if (flureeDbConn !== undefined) {
        try {
            flureenjs.close(flureeDbConn);
            flureeIsAvailable = false;
        }
        catch (error) {
            console.warn("error closing connection: ", error);
        }
    }
}
process.on('SIGTERM', shutDownHandler);
process.on('SIGINT', shutDownHandler);

//------------------------
// Fluree Logging
//------------------------
//flureenjs.set_logging({level: "config"});

//------------------------
// Connection to Fluree
//------------------------
function flureeConnect(url, options) {
    if (!url) {
        throw "Unable to connect to Fluree: Missing url. "
    }

    var cOpts = {};
    if (options && options.keepAlive && options.keepAlive === true) {
        cOpts = { "keep-alive-fn": function () { flureeConnect(url, options); } }
    }

    console.info("Connecting to Fluree instance @", url, " options: ", cOpts);
    flureenjs.connect_p(url, cOpts)
        .then(conn => {
            flureeDbConn = conn;
            flureeIsAvailable = true;
        })
        .catch(error => {
            console.error("Error connecting to Fluree DB", error);
            //  [  1.771s] [server] "Server contact error: " 
            //  "xhttp error - http://localhost:8080/fdb/health" 
            //  {:url "http://localhost:8080/fdb/health", :error :xhttp/http-error}
            // -> gracefully shutdown NodeJS server
            // -> or add re-try logic
        })
}

//------------------------
// Start-up query instance
//------------------------
//const flureeUrl = "http://localhost:8080";
const flureeUrl = "http://ledger1.ledger.local:8090";
const connectOpts = { keepAlive: true }
// flureeConnect(flureeUrl);  // without client-side keep-alive
flureeConnect(flureeUrl, connectOpts);  // with client-side keep-alive


//------------------------
// Listener
//------------------------
listener = server.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));


//-------------------------
// Handlers for connections
//-------------------------
listener.on('connection', connection => {
    njsConnections.push(connection);
    connection.on('close', () => njsConnections = njsConnections.filter(curr => curr !== connection));
});


//------------------------
// Routes
//------------------------
server.get('/', (request, response) => {
    response.status(200).send("hello");
});

server.post('/api/db/:network/:db/:action', (request, response) => {
    const network = request.params.network;
    const dbId = request.params.db;
    const action = request.params.action.toLowerCase();
    const params = request.params;
    const body = request.body || {};
    const ledger = network + '/' + dbId;

    // "shared" variable names
    var db = null;
    var opts = null;
    var query = null;
    var txn = null;
    var user = undefined;
    var pwd = undefined;
    var token = undefined;
    var expire = undefined;
    var auth = undefined;

    switch (action) {

        case 'password_login':
            if (body.user) user = body.user;
            if (body.password) pwd = body.password;
            if (body.expire) expire = body.expire;
            flureenjs.password_login(flureeDbConn, ledger, pwd, user, auth, expire)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'password_generate':
            if (body.user) user = body.user;
            if (body.password) pwd = body.password;
            if (body.opts) opts = body.opts;
            flureenjs.password_generate(flureeDbConn, ledger, pwd, user, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'renew_token':
            if (body.jwt) token = body.jwt;
            if (body.expire) expire = body.expire;
            flureenjs.renew_token(flureeDbConn, token)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'block_query':
            if (body.query) query = body.query;
            if (body.opts) opts = body.opts;
            flureenjs.block_query(flureeDbConn, ledger, query, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'block_range':
            const start = (body.start ? Number(body.start) : null);
            const end = (body.end ? Number(body.end) : null);
            if (body.opts) opts = body.opts;
            flureenjs.block_range(flureeDbConn, ledger, start, end, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'delete_ledger':
            if (body.opts) opts = body.opts;
            flureenjs.delete_ledger(flureeDbConn, ledger, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'db_schema':
            db = flureenjs.db(flureeDbConn, ledger);
            flureenjs.db_schema(db)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'graphql':
            if (body.graphql) query = JSON.stringify(body.graphql);
            if (body.opts) opts = body.opts;
            flureenjs.graphql(flureeDbConn, ledger, query, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'history':
            if (body.query) query = body.query;
            if (body.opts) opts = body.opts;
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.history_query(db, query, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'multi_query':
            if (body.query) query = body.query;
            if (body.opts) opts = body.opts;
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.multi_query(db, query, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'monitor_tx':
            // retrieve txid and timeout from body
            const txid = body.txid;
            const timeout = (body.timeout ? Number(body.timeout) : 0);
            flureenjs.monitor_tx(flureeDbConn, ledger, txid, timeout)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'new_ledger':
            if (body.opts) opts = body.opts;
            flureenjs.new_ledger(flureeDbConn, ledger, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'query':
            if (body.query) query = body.query;
            if (body.opts) opts = body.opts;
            console.log(body.query);
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.q(db, query, opts)
                .then(results => {
                    response.send(JSON.stringify(results));
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'signed_query':
            if (body.query) query = body.query;
            if (body.opts) opts = body.opts;
            flureenjs.signed_query(flureeDbConn, ledger, query, opts)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'sparql':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts) opts = body.opts;
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.sparql(db, query)
                .then(results => {
                    response.send(results);
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        case 'transact':
            txn = body.txn;
            console.log("transaction: ", txn);
            if (body.opts) opts = body.opts;
            flureenjs.transact(flureeDbConn, ledger, txn, opts)
                .then(results => {
                    response.send(JSON.stringify(results));
                })
                .catch(error => {
                    console.log(error);
                    response.status(500).send(error);
                });
            break;

        default:
            response.status(404).send('Invalid action requested');
            break;
    }
});


//// Code to open a connection specifically for one request 
// server.post('/api/db/:network/:db/:action', (request, response) => {
//     var   flureeDbConn;
//     const network = request.params.network;
//     const dbId    = request.params.db;
//     const action  = request.params.action.toLowerCase();
//     const params  = request.params;
//     const body    = request.body;
//     const ledger  = network + '/' + dbId;
//     switch (action) {
//         case 'query':
//             flureenjs.connect_p(flureedbUrl)
//             .then(conn =>
//                 {
//                     flureeDbConn = conn;
//                     db = flureenjs.db(conn, ledger);
//                     flureenjs.q(db, body)
//                     .then (results => {
//                         response.send(results);
//                     })
//                     .catch(error => 
//                         {
//                             console.log(error);
//                             response.status(500).send(error);
//                     })
//                     .finally(() => { if (flureeDbConn !== undefined) flureenjs.close(flureeDbConn); });
//                 })
//             .catch(error => 
//                 {
//                     console.log(error);
//                     response.status(500).send(error);
//                 })
//             break;

//         default:
//             response.status(404).send('Invalid action requested');
//             break;
//     }
// });
