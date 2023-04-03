import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

async function agentLoop () {

    var previous = 'right'

    while ( true ) {

        await client.putdown();

        await client.pickup();

        let tried = [];

        while ( tried.length < 4 ) {
            
            let current = { up: 'down', right: 'left', down: 'up', left: 'right' }[previous] // backward

            if ( tried.length < 3 ) { // try haed or turn (before going backward)
                current = [ 'up', 'right', 'down', 'left' ].filter( d => d != current )[ Math.floor(Math.random()*3) ];
            }
            
            if ( ! tried.includes(current) ) {
                
                if ( await client.move( current ) ) {
                    console.log( 'moved', current );
                    previous = current;
                    break; // moved, continue
                }
                
                tried.push( current );
                
            }
            
        }

        if ( tried.length == 4 ) {
            console.log( 'stucked' );
            await client.timer(1000); // stucked, wait 1 sec and retry
        }


    }
}

agentLoop()