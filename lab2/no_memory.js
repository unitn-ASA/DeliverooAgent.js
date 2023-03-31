import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)

const db = new Map()

// client.socket.on( 'parcels sensing', ( parcels ) => {
    
//     const pretty = Array.from(parcels)
//         .map( ( {id,x,y,carriedBy,reward} ) => {
//             return reward; //`(${x},${y},${reward})`
//         } )
//         .join( ' ' )
//     console.log( pretty )

//     // for (const p of parcels) {
//     //     db.set( p.id, p)
//     // }
    
//     // console.log( db )

// } )

client.onAgentsSensing( ( agents ) => {
    
    const pretty = Array.from(agents)
        .map( ( {id,name,x,y,score} ) => {
            return `${name}(${x},${y})`
        } )
        .join( ' ' )
    console.log( pretty )

} )

/**
 * 29/03/2023
 * Implement an agent that:
 * 
 */