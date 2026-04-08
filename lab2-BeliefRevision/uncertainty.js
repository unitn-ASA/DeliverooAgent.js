import dotenv from 'dotenv'
dotenv.config({path: '../.env', override: true})
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/client").IOAgent} IOAgent */



const socket = DjsConnect();
socket.connect();

/** @type {Map<string,[{name:string,x:number,y:number}|string]>} */
const beliefset = new Map();

/** @type {number} */
const start = Date.now();

/** @type {number} */
var AOD;

socket.onConfig( config => AOD = config.GAME.player.observation_distance );

/** @type {IOAgent} */
var me;

socket.onYou( m => me = m );

/**
 * @param {{x?:number,y?:number}} a1
 * @param {{x?:number,y?:number}} a2
 * @returns {number}
 */
const dist = (a1, a2) => a1.x && a1.y && a2.x && a2.y ? Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y) : Infinity;

socket.onSensing( ( sensing ) => {
    
    for (const a of sensing.agents) {

        // if x or y are undefined, skip him, I don't know where he is and I can't do anything with him
        if ( !a.x || !a.y )
            continue;
        
        // if the agent is moving between two tiles, skip him
        if ( a.x % 1 != 0 || a.y % 1 != 0 ) // skip intermediate values (0.6 or 0.4)
            continue;

        // I meet someone for the first time
        if ( ! beliefset.has(a.id) ) {
            
            console.log( "Nice to meet you", a.name );
            beliefset.set( a.id, [{ name: a.name, x: a.x, y: a.y }] );

        } else { // I remember him

            // this is everything I know about him
            const history = beliefset.get( a.id )
            if ( !history ) continue; // this should not happen, but this fix type checking error

            // this is about the last time I saw him
            const last = history[history.length-1]
            const second_last = (history.length>2 ? history[history.length-2] : 'no knowledge')
            
            if ( typeof(last) === 'object' ) { // I was seeing him also last time

                if ( last.x != a.x || last.y != a.y ) { // But he moved
                
                    history.push( { name: a.name, x: a.x, y: a.y } )
                    console.log( 'I\'m seeing you moving', a.name )
                
                } else { // Still here but not moving

                }                

            } else if ( typeof(second_last) === 'object' ) { // I see him again after some time
                
                history.push( { name: a.name, x: a.x, y: a.y } )

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

        if ( ! sensing.agents.map( a => a.id ).includes( id ) ) {
            // If I am not seeing him anymore
            
            if ( typeof(last) === 'object' ) { // meaning last != 'lost'
                // Just went off

                history.push( 'lost' );
                console.log( 'Bye', last.name );

            } else if ( typeof(second_last) === 'object' ) { // while last == 'lost'
                // It has been a while, since last time I saw him
                
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

