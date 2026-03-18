import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const LOG_FROM = process.argv.slice(2);

// const client = DjsConnect( process.env.HOST, process.env.TOKEN );
const client = DjsConnect();

client.on( 'log', ( src, {ms, frame}, ...message ) => {
        
    if ( src != 'server' ) {
        const {socket, id, name} = src;
        if ( LOG_FROM.includes(socket) || LOG_FROM.includes(id) || LOG_FROM.includes(name) )
            console.log( 'client', ms, socket, id, name, '\t', ...message );
    }
    else {
        if ( LOG_FROM.length == 0 )
            console.log( 'server', ms, '\t', ...message )
    }

} );