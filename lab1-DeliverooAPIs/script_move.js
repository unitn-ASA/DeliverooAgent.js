import 'dotenv/config'
import { DjsConnect, DjsClientSocket } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect()

async function myFn () {

    let up = await socket.emitMove('up');
    let right = await socket.emitMove('right');
    
}

myFn ()

socket.onTile( ( {x, y, type} ) => {
    console.log(x, y, type)
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