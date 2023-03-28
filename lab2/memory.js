import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)
/**
 * @type {Map<string,[{id,x,y,carriedBy,reward}]}
 */
const db = new Map()
    
const start = Date.now();

client.socket.on( 'parcels sensing', ( parcels ) => {

    for (const p of parcels) {
        if ( ! db.has( p.id) ) {
            db.set( p.id, [] )
        }
        const history = db.get( p.id )
        const last = history[history.length-1]
        if ( !last || last.x != p.x || last.y != p.y ) {
            history.push( {x: p.x, y: p.y} )
        }
        console.log( p.id+':'+history.map( p => ' @' + (Date.now() - start) + ':' + p.x + '' + p.y ).join( ' ' ) )
    }

    console.log( '' )
    
    // console.log( db )

} )

/**
 * 29/03/2023
 * Implement an agent that:
 * 
 */