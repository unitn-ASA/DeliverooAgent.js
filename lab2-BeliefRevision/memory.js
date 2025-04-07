import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs25.azurewebsites.net',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjOTQyMSIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6IjViMTVkMSIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQyNTY3NDE4fQ.5m8St0OZo_DCXCriYkLtsguOm1e20-IAN2JNgXL7iUQ'
)

/**
 * @type {Map<string,{id,name,x,y,score,timestamp,direction}[]>}
 */
const beliefset = new Map();
const start = Date.now();
var AOD; client.onConfig( config => AOD = config.AGENTS_OBSERVATION_DISTANCE );
var me; client.onYou( m => me = m );

client.onAgentsSensing( ( agents ) => {
    const timestamp = Date.now() - start;
    for ( let a of agents ) {
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

