import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)
    
const start = Date.now();



const me = {};

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

/**
 * @type {Map<string,[{id,name,x,y,score}]}
 */
const db = new Map()

client.onAgentsSensing( ( agents ) => {

    for (const a of agents) {

        if ( a.x % 1 != 0 || a.y % 1 != 0 ) // skip intermediate values (0.6 or 0.4)
            continue;

        // I meet someone for the first time
        if ( ! db.has( a.id) ) {

            db.set( a.id, [a] )
            console.log( 'Hello', a.name )

        } else { // I remember him

            // this is everything I know about him
            const history = db.get( a.id )

            // this is about the last time I saw him
            const last = history[history.length-1]
            const second_last = (history.length>2 ? history[history.length-2] : 'no knowledge')
            
            if ( last != 'lost' ) { // I was seeing him also last time

                if ( last.x != a.x || last.y != a.y ) { // But he moved
                
                    history.push( a )
                    console.log( 'I\'m seeing you moving', a.name )
                
                } else { // Still here but not moving

                }                

            } else { // I see him again after some time
                
                history.push( a )

                if ( second_last.x != a.x || second_last.y != a.y ) {
                    console.log( 'Welcome back, seems that you moved', a.name )
                } else {
                    console.log( 'Welcome back, seems you are still here as before', a.name )
                }

            }

        }

    }

    for ( const [id,history] of db.entries() ) {

        const last = history[history.length-1]
        const second_last = (history.length>1 ? history[history.length-2] : 'no knowledge')

        if ( ! agents.map( a=>a.id ).includes( id ) ) {
            // If I am not seeing him anymore
            
            if ( last != 'lost' ) {
                // Just went off

                history.push( 'lost' );
                console.log( 'Bye', last.name );

            } else {
                // A while since last time I saw him

                console.log( 'Its a while that I don\'t see', second_last.name, 'I remember him in', second_last.x, second_last.y );
                
                if ( distance(me, second_last) <= 3 ) {
                    console.log( 'I remember', second_last.name, 'was within 3 tiles from here. Forget him.' );
                    db.delete(id)
                }

            }

        } else { // If I am still seing him ... see above
            // console.log( 'still seing him', last.name )
        }

    }

} )



/**
 * 30/03/2023
 * Implement beliefset revision so to:
 * 
    // I meet someone for the first time
    console.log( 'Hello', a.name )

    // I already met him in the past

        // I was seeing him also last time
            
            // But he moved
            console.log( 'I\'m seeing you moving', a.name )

            // Or he did not moved
            console.log(  )
    
        // I see him again after some time
        
            // Seems that he moved
            console.log( 'Welcome back, seems that you moved', a.name )

            // As far as I remember he is still here
            console.log( 'Welcome back, seems you are still here as before', a.name )

    // I am perceiving (eventually no one is around me) and seems that I am not seeing him anymore
    
        // He just went off, right now
        console.log( 'Bye', last.name );

        // It's already a while since last time I saw him
        console.log( 'Its a while that I don\'t see', second_last.name, 'I remember him in', second_last.x, second_last.y );
        
            // I'm back where I remember I saw himlast time
            console.log( 'I remember', second_last.name, 'was within 3 tiles from here. Forget him.' );
 *
 *
 */