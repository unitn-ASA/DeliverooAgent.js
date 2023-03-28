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