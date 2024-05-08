import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs.onrender.com',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * @type {Map<x,Map<y,{x,y,delivery}>}
 */
const map = new Map()

client.onTile( ( x, y, delivery ) => {
    if ( ! map.has(x) )
        map.set(x, new Map)    
    map.get(x).set(y, {x, y, delivery})
} );



const me = {};

await new Promise( res => {
    client.onYou( ( {id, name, x, y, score} ) => {
        me.id = id
        me.name = name
        me.x = x
        me.y = y
        me.score = score
        // console.log( 'me:', me.x, me.y );
        res()
    } )
} );



const target = {
    x: process.argv[2],
    y: process.argv[3]
};
console.log(me.name, 'goes from', me.x, me.y, 'to', target.x, target.y);

while ( me.x != target.x || me.y != target.y ) {

    var m = new Promise( res => client.onYou( m => m.x % 1 != 0 || m.y % 1 != 0 ? null : res() ) );

    if ( me.x < target.x )
        await client.move('right');
    else if ( me.x > target.x )
        await client.move('left');
    
    if ( me.y < target.y )
        await client.move('up');
    else if ( me.y > target.y )
        await client.move('down');

    await m;
}

client.onParcelsSensing( async ( parcels ) => {
    
    // console.log( `me(${me.x},${me.y})`,
    //     parcels
    //     .map( p => `${p.reward}@(${p.x},${p.y})` )
    //     .join( ' ' )
    // );

    // for ( let p of parcels ) {
    //     if ( ! p.carriedBy ) {
    //         if ( me.x < p.x )
    //             await client.move('right');
    //         else if ( me.x > p.x )
    //             await client.move('left')
    //         else if ( me.y < p.y )
    //             await client.move('up')
    //         else if ( me.y > p.y )
    //             await client.move('down')
    //         client.pickup();
    //     }
    // }

} )
