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
    if (type.toString() == '0') {
        //TODO
    }
} );


/** @type {import('@unitn-asa/deliveroo-js-sdk/client').IOAgent} */
const me = {};

await new Promise( res => {
    socket.onSensing( ( { self } ) => {
        if ( ! self ) return;
        const {id, name, x, y, score} = self;
        me.id = id
        me.name = name
        me.x = x
        me.y = y
        me.score = score
        console.log( 'me:', me.x, me.y );
        res(null);
    } )
} );



/** @type { {x:number, y:number} } */
const target = {
    x: Number.parseInt(process.argv[2]),
    y: Number.parseInt(process.argv[3])
};
if ( Number.isNaN(target.x) || Number.isNaN(target.y) ) {
    console.error('Usage: node blind_move.js <x> <y>');
    process.exit(1);
}
console.log(me.name, 'goes from', me.x, me.y, 'to', target.x, target.y);

while ( me.x != target.x || me.y != target.y ) {

    var m = new Promise( res => {
        const listener = ( { self } ) => {
            if ( ! self || self.x % 1 != 0 || self.y % 1 != 0 ) return;
            socket.off( "sensing", listener );
            res();
        };
        socket.onSensing( listener );
    } );

    if ( me.x < target.x )
        await socket.emitMove('right');
    else if ( me.x > target.x )
        await socket.emitMove('left');
    
    if ( me.y < target.y )
        await socket.emitMove('up');
    else if ( me.y > target.y )
        await socket.emitMove('down');

    await m;
    console.log(me.name, 'Moved to', me.x, me.y);
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


// while ( true) {
//     socket.emitMove('up');
//     await new Promise( res => setTimeout(res, 0) );
// }

socket.onConfig( config => { config.GAME } );