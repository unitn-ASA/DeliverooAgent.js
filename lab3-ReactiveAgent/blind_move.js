import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

/** @type { function ( {x:number, y:number}, {x:number, y:number} ) : number } */
function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * @type { Map< string, {x:number, y:number, type:string} > }
 */
const map = new Map()

socket.onTile( ({x, y, type}) => {
    const key = `${x}_${y}`;
    map.set(key, {x, y, type});
} );


/** @type {import('@unitn-asa/deliveroo-js-sdk/client').IOAgent} */
const me = {};

await new Promise( res => {
    socket.onYou( ( {id, name, x, y, score} ) => {
        me.id = id
        me.name = name
        me.x = x
        me.y = y
        me.score = score
        // console.log( 'me:', me.x, me.y );
        res(null);
    } )
} );



/** @type { {x:number, y:number} } */
const target = {
    x: Number.parseInt(process.argv[2]),
    y: Number.parseInt(process.argv[3])
};
console.log(me.name, 'goes from', me.x, me.y, 'to', target.x, target.y);

while ( me.x != target.x || me.y != target.y ) {

    var m = new Promise( res => socket.onYou( m => m.x % 1 != 0 || m.y % 1 != 0 ? null : res() ) );

    if ( me.x && me.x < target.x )
        await socket.emitMove('right');
    else if ( me?.x && me.x > target.x )
        await socket.emitMove('left');
    
    if ( me?.y && me.y < target.y )
        await socket.emitMove('up');
    else if ( me?.y && me.y > target.y )
        await socket.emitMove('down');

    await m;
}

socket.onSensing( async ( sensing ) => {
    
    // console.log( `me(${me.x},${me.y})`,
    //     sensing.parcels
    //     .map( p => `${p.reward}@(${p.x},${p.y})` )
    //     .join( ' ' )
    // );

    // for ( let p of sensing.parcels ) {
    //     if ( ! p.carriedBy ) {
    //         if ( me.x < p.x )
    //             await client.emitMove('right');
    //         else if ( me.x > p.x )
    //             await client.emitMove('left')
    //         else if ( me.y < p.y )
    //             await client.emitMove('up')
    //         else if ( me.y > p.y )
    //             await client.emitMove('down')
    //         client.pickup();
    //     }
    // }

} )
