import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as config } from "./config.js";

const LOG_FROM = process.argv.slice(2);

const client = new DeliverooApi( config.host, config.token );

client.socket.on( 'log', ( socket, id, name, ...message ) => {

    if ( LOG_FROM.length==0 || LOG_FROM.includes(socket) || LOG_FROM.includes(id) || LOG_FROM.includes(name) ) {
        console.log( socket, id, name, '\t', ...message );
    }

} );