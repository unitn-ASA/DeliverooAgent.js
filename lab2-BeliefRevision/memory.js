import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs.onrender.com',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

/**
 * @type {Map<string,[{id,x,y,carriedBy,reward}]}
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
        a.timestamp = timestamp;
        const logs = beliefset.get( a.id );
        if ( logs.length>0 ) {
            var previous = logs[logs.length-1];
            if ( previous.x < a.x ) a.direction = 'right';
            else if ( previous.x > a.x ) a.direction = 'left';
            else if ( previous.y < a.y ) a.direction = 'up';
            else if ( previous.y > a.y ) a.direction = 'down';
            else a.direction = 'none';
        }
        beliefset.get( a.id ).push( a );
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

