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

const me = {};

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )

const db = new Map()

client.onParcelsSensing( async ( parcels ) => {
    
    const pretty = Array.from(parcels)
        .map( ( {id,x,y,carriedBy,reward} ) => {
            return reward; //`(${x},${y},${reward})`
        } )
        .join( ' ' )
    console.log( pretty )

    for (const p of parcels) {
        db.set( p.id, p)
        if ( distance(p, me) <= 1 ) {
            if ( me.x + 1 == p.x )
                await client.move('right')
            else if ( me.x - 1 == p.x )
                await client.move('left')
            else if ( me.y + 1 == p.y )
                await client.move('up')
            else if ( me.y - 1 == p.y )
                await client.move('down')
            client.pickup()
        }

    }
    
    console.log( db )

} )


