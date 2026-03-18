import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

/**
 * @type {Map<string,{id,name,x,y,score,timestamp,direction}[]>}
 */
const beliefset = new Map();
const start = Date.now();
var AOD; socket.onConfig( config => AOD = config.GAME.player.agents_observation_distance );
var me; socket.onYou( m => me = m );

socket.onAgentsSensing( ( sensing ) => {
    const timestamp = Date.now() - start;
    for ( let {agent: a} of sensing ) {
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
        if ( logs.length>0 ) {
            var previous = logs[logs.length-1];
            if ( previous.x < a.x ) log.direction = 'right';
            else if ( previous.x > a.x ) log.direction = 'left';
            else if ( previous.y < a.y ) log.direction = 'up';
            else if ( previous.y > a.y ) log.direction = 'down';
            else log.direction = 'none';
        }
        beliefset.get( a.id ).push( log );
    }
    // compute if within perceiving area
    let prettyPrint = Array.from(beliefset.values()).map( (logs) => {
        const {timestamp,name,x,y,direction} = logs[logs.length-1]
        const d = dist( me, {x,y} );
        return `${name}(${direction},${d<AOD})@${timestamp}:${x},${y}`;
    }).join(' ');
    console.log(prettyPrint)
} )
const dist = (a1,a2) => Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y);

