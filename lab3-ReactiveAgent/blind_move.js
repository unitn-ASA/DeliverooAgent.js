import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs25.azurewebsites.net',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjOTQyMSIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6IjViMTVkMSIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQyNTY3NDE4fQ.5m8St0OZo_DCXCriYkLtsguOm1e20-IAN2JNgXL7iUQ'
    // 'https://deliveroojs2.rtibdi.disi.unitn.it/',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQyNmQ1NyIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6ImM3ZjgwMCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQwMDA3NjIwfQ.1lfKRxSSwj3_a4fWnAV44U1koLrphwLkZ9yZnYQDoSw'
    // 'http://localhost:8080',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiZDg3MyIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6IjA3ZmU2MiIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzM4NjAzNjMwfQ.Q9btNkm3VLXsZDsNHYsQm2nGUVfFnF-TWZrz4zPaWM4'
)

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * @type { Map< string, {x:number, y:number, type:string} > }
 */
const map = new Map()

client.onTile( ({x, y, type}) => {
    const key = `${x}_${y}`;
    map.set(key, {x, y, type});
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
        await client.emitMove('right');
    else if ( me.x > target.x )
        await client.emitMove('left');
    
    if ( me.y < target.y )
        await client.emitMove('up');
    else if ( me.y > target.y )
        await client.emitMove('down');

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
