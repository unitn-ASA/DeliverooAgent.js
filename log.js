import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as config } from "./config.js";

const LOG_FROM = process.argv.slice(2);

const client = new DeliverooApi( config.host, config.token );

client.socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {

    if ( LOG_FROM.length==0 || LOG_FROM.includes(socket) || LOG_FROM.includes(id) || LOG_FROM.includes(name) ) {
        if ( src == 'server' )
            console.log( 'server', timestamp, '\t', ...message )
        else
            console.log( 'client', timestamp, socket, id, name, '\t', ...message );
    }

} );