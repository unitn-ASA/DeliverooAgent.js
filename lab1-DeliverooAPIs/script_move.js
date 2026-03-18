import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect()

async function myFn () {

    let up = await socket.emitMove('up');
    let right = await socket.emitMove('right');
    
}

// myFn ()

socket.on( 'tile', (x, y, delivery) => {
    console.log(x, y, delivery)
} )

/**
 * 28/03/2023
 * 
 * Implement an agent that:
 * - moves along a predefined path
 * - pick the parcel
 * - deliver it
 * 
 * What if other agents are moving?
 * - Dealing with failing actions, by insisting on path.
 */