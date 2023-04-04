import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
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



const {x: init_x, y: init_y} = await new Promise( res => client.onYou( res ) );
const target_x = process.argv[2], target_y = process.argv[3];
console.log('go from', init_x, init_y, 'to', target_x, target_y);



function search (step, x, y, direction) {

    if( ! map.has(x) || ! map.get(x).has(y) )
        return false;

    if( direction )
        console.log(step, 'move', direction, x, y);
    
    if ( target_x == x && target_y == y )
        return true;

    else if ( target_x > x && search(step+1, x+1, y, 'right') )
        console.log('target reached');
    
    else if ( target_x < x && search(step+1, x-1, y, 'left') )
        console.log('target reached');
    
    else if ( target_y > y && search(step+1, x, y+1, 'up') )
        console.log('target reached');
    
    else if ( target_y < y && search(step+1, x, y-1, 'down') )
        console.log('target reached');
    
    else
        return false;
    
}

search(0, init_x, init_y)