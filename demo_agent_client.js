import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )

client.on("connect", () => {
    console.log( "socket connect", client.socket.id ); // x8WIv7-mJelg7on_ALbxc
});

client.on("disconnect", () => {
    console.log( "socket disconnect", client.socket.id ); // x8WIv7-mJelg7on_ALbxc
});


async function agentLoop () {

    var directionIndex = 1; // 'right'

    function directionString () {
        if (directionIndex > 3)
            directionIndex = directionIndex % 4;
        return [ 'up', 'right', 'down', 'left' ][ directionIndex ];
    }

    while ( true ) {
        
        await client.timer(100); // wait 0.1 sec and retry; if stucked, this avoid infinite loop

        await client.putdown();

        await client.timer(100); // wait 0.1 sec

        await client.pickup();

        await client.timer(100); // wait 0.1 sec

        directionIndex += [0,1,3][ Math.floor(Math.random()*3) ]; // straigth or turn left or right, not going back
        
        var status = await client.move( directionString() )
        
        if ( ! status ) {
            
            console.log( 'move failed' )

            directionIndex += [2,1,3][ Math.floor(Math.random()*3) ]; // backward or turn left or right, not try again straight, which just failed

        }

    }
}

agentLoop()

client.on( 'you', me => console.log(me) ) // {id, name, x, y, score}
client.on( 'agents sensing', aa => console.log(aa) ) // [ {}, {id, x, y, score}]
client.on( 'parcels sensing', pp => console.log(pp) ) // [ {}, {id, x, y, carriedBy, reward}]