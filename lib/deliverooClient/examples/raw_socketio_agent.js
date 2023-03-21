import * as config from "../../../config.js";
// import { timer } from "./src/timer.js";
// import { DeliverooApi } from "./src/DeliverooApi.js";
import { timer, DeliverooApi } from "../index.js";

const socket = new DeliverooApi( config.host, config.token )


socket.on("you", ({id, name, x, y, score}) => {
    // console.log("you", {id, name, x, y, score})
});


async function agentLoop () {

    var directionIndex = 1; // 'right'

    function directionString () {
        if (directionIndex > 3)
            directionIndex = directionIndex % 4;
        return [ 'up', 'right', 'down', 'left' ][ directionIndex ];
    }

    while ( true ) {

        await timer(100); // wait 0.1 sec and retry; if stucked, this avoid infinite loop

        await socket.putdown();

        await timer(100); // wait 0.1 sec

        await socket.pickup();

        await timer(100); // wait 0.1 sec

        directionIndex += [0,1,3][ Math.floor(Math.random()*3) ]; // straigth or turn left or right, not going back
        
        var status = await socket.move( directionString() )
        
        if ( ! status ) {
            
            console.log( 'move failed' )

            directionIndex += [2,1,3][ Math.floor(Math.random()*3) ]; // backward or turn left or right, not try again straight, which just failed

        }

    }
}

agentLoop()

socket.on( 'you', me => console.log(me) ) // {id, name, x, y, score}
socket.on( 'agents sensing', aa => console.log(aa) ) // [ {}, {id, x, y, score}]
socket.on( 'parcels sensing', pp => console.log(pp) ) // [ {}, {id, x, y, carriedBy, reward}]