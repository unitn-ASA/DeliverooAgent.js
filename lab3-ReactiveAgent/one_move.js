import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

/** @type { function ({x:number, y:number}, {x:number, y:number}): number } */
function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

/** @type { {id:string, name:string, x:number, y:number, score:number} } */
const me = {};

socket.onSensing( ( { self } ) => {
    if ( ! self ) return;
    const {id, name, x, y, score} = self;
    me.id = id;
    me.name = name;
    if ( x != undefined ) me.x = x;
    if ( y != undefined ) me.y = y;
    me.score = score;
} )

var control = false;

socket.onSensing( async ( sensings ) => {

    console.log( `me(${me.x},${me.y})`,
        control ? 'skip' : 'go to parcels: ',
        sensings.parcels
        .map( p => `${p.reward}@(${p.x},${p.y})` )
        .join( ' ' )
    );

    if ( control ) {
        return;
    }
    control = true;
    
    for ( let p of sensings.parcels ) {
        if ( ! p.carriedBy ) {
            /** @type { 'right' | 'left' | 'up' | 'down' | undefined } */
            let direction;
            if      ( me.x == p.x-1 && me.y == p.y )
                direction = 'right';
            else if ( me.x == p.x+1 && me.y == p.y )
                direction = 'left';
            else if ( me.y == p.y-1 && me.x == p.x )
                direction = 'up';
            else if ( me.y == p.y+1 && me.x == p.x )
                direction = 'down';

            if ( direction ) {
                // emitMove resolves to the new position, or false if the move failed
                const moved = await socket.emitMove( direction );
                if ( moved ) {
                    me.x = moved.x;
                    me.y = moved.y;
                }
            }

            if ( me.x == p.x && me.y == p.y ) {
                await socket.emitPickup();
            }
        }
    }
    
    control = false;

} )


