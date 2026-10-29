import 'dotenv/config'
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk/client';

const socket = DjsConnect();

let myPosition = { x: 0, y: 0 };

socket.onSensing( ( { self } ) => {
    if ( self?.x != undefined && self?.y != undefined ) myPosition = { x: self.x, y: self.y };
});

socket.onMap( async (width, height, tiles) => {
    // Move along predefined path
    /** @type { ('up'|'right'|'down'|'left')[] } */
    const path = ['right', 'right', 'down', 'down', 'left', 'left', 'up', 'up'];

    for (const direction of path) {
        // Insist on the path: retry the same move until it succeeds (or give up)
        let result = await socket.emitMove(direction);
        for ( let retries = 0; ! result && retries < 10; retries++ ) {
            console.log(`Move ${direction} failed, retrying...`);
            await new Promise(r => setTimeout(r, 100));
            result = await socket.emitMove(direction);
        }
        console.log( result ? `Moved ${direction} to ${result.x},${result.y}` : `Giving up on ${direction} at ${myPosition.x},${myPosition.y}` );
    }

    // Pickup parcels
    const picked = await socket.emitPickup();
    console.log( 'Picked up', picked.length, 'parcels' );
});
