import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

/** @type {Map<string,{id:string, name:string, x:number, y:number, score:number, timestamp:number, direction:string}[]>} */
const beliefset = new Map();
const start = Date.now();

// Previous implementation, based on the observation distance from the config
// /** @type {number} */
// var OBSERVATION_DISTANCE;
// socket.onConfig( config => OBSERVATION_DISTANCE = config.GAME.player.observation_distance );
//
// /** @type {import('@unitn-asa/deliveroo-js-sdk/client').IOAgent} */
// var me;
// socket.onSensing( ( { self } ) => { if ( self ) me = self } );
//
// const dist = (a1,a2) => Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y);

socket.onSensing( ( sensing ) => {
    const timestamp = Date.now() - start;
    for ( let a of sensing.agents ) {
        if ( ! beliefset.has( a.id ) )
            beliefset.set( a.id, [] )
        const log = {
            id: a.id,
            name: a.name,
            x: a.x,
            y: a.y,
            score: a.score,
            timestamp: timestamp,
            direction: 'none'
        }
        const logs = beliefset.get( a.id );
        if ( logs && logs.length>0 ) {
            var previous = logs[logs.length-1];
            if ( previous.x < a.x ) log.direction = 'right';
            else if ( previous.x > a.x ) log.direction = 'left';
            else if ( previous.y < a.y ) log.direction = 'up';
            else if ( previous.y > a.y ) log.direction = 'down';
            else log.direction = 'none';
        }
        beliefset.get( a.id )?.push( log );
    }
    // print, for each agent, its perception history from the most recent one
    for ( const logs of beliefset.values() ) {
        const {id,name,x,y,direction} = logs[logs.length-1]
        // compute if last known position is within perceiving area
        // (round, since a moving agent is in between two tiles)
        const inView = !! sensing.positions?.some( p => p.x == Math.round(x) && p.y == Math.round(y) );
        // Previous implementation, based on the observation distance from the config
        // const inView = dist( me, {x,y} ) < OBSERVATION_DISTANCE;
        const history = logs.slice().reverse().map( ({timestamp,x,y}) => `@${timestamp}:${x},${y}` ).join(' ');
        console.log( `${id}${history} (${name}, ${direction}, ${inView})` );
    }
} )

