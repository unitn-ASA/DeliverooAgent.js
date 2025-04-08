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

const me = {};

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )

var control = false;

client.onParcelsSensing( async ( parcels ) => {

    console.log( `me(${me.x},${me.y})`,
        control ? 'skip' : 'go to parcels: ',
        parcels
        .map( p => `${p.reward}@(${p.x},${p.y})` )
        .join( ' ' )
    );

    if ( control ) {
        return;
    }
    control = true;
    
    for ( let p of parcels ) {
        if ( ! p.carriedBy ) {
            if      ( me.x == p.x-1 && me.y == p.y )
                await client.emitMove('right');
            else if ( me.x == p.x+1 && me.y == p.y )
                await client.emitMove('left')
            else if ( me.y == p.y-1 && me.x == p.x )
                await client.emitMove('up')
            else if ( me.y == p.y+1 && me.x == p.x )
                await client.emitMove('down')

            if ( me.x == p.x && me.y == p.y ) {
                await client.emitPickup();
            }
        }
    }
    
    control = false;

} )


