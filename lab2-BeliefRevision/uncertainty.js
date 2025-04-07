import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs25.azurewebsites.net',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjOTQyMSIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6IjViMTVkMSIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQyNTY3NDE4fQ.5m8St0OZo_DCXCriYkLtsguOm1e20-IAN2JNgXL7iUQ'
)

/** @type {Map<string,[{id,name,x,y}|string]>} */
const beliefset = new Map();
const start = Date.now();
var AOD; client.onConfig( config => AOD = config.AGENTS_OBSERVATION_DISTANCE );
var me; client.onYou( m => me = m );
const dist = (a1,a2) => Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y);

client.onAgentsSensing( ( agents ) => {

    // const now = Date.now();
    // for ( let a of agents ) {
    //     if ( ! beliefset.has( a.id ) )
    //         beliefset.set( a.id, [] )
    //     a.timestamp = now;
    //     const logs = beliefset.get( a.id );
    //     if ( logs.length>0 ) {
    //         var previous = logs[logs.length-1];
    //         if ( previous.x < a.x ) a.direction = 'right';
    //         else if ( previous.x > a.x ) a.direction = 'left';
    //         else if ( previous.y < a.y ) a.direction = 'up';
    //         else if ( previous.y > a.y ) a.direction = 'down';
    //         else a.direction = 'none';
    //     }
    //     beliefset.get( a.id ).push( a );
    // }

    // let prettyPrint = Array.from(beliefset.values()).map( (logs) => {
    //     const {timestamp,name,x,y,direction} = logs[logs.length-1]
    //     const d = dist( me, {x,y} ); // if within perceiving area d<AOD
    //     return `${name}(${direction})@-${now-timestamp}:${x},${y}`;
    // }).join(' ');
    // console.log(prettyPrint)
    
    for (const a of agents) {

        if ( a.x % 1 != 0 || a.y % 1 != 0 ) // skip intermediate values (0.6 or 0.4)
            continue;

        // I meet someone for the first time
        if ( ! beliefset.has( a.id) ) {
            
            console.log( "Nice to meet you", a.name );
            beliefset.set( a.id, [a] );

        } else { // I remember him

            // this is everything I know about him
            const history = beliefset.get( a.id )

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

    for ( const [id,history] of beliefset.entries() ) {

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
                
                if ( dist(me, second_last) <= 3 ) {
                    console.log( 'I remember', second_last.name, 'was within 3 tiles from here. Forget him.' );
                    beliefset.delete(id)
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