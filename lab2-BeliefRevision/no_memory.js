import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs25.azurewebsites.net',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjOTQyMSIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6IjViMTVkMSIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQyNTY3NDE4fQ.5m8St0OZo_DCXCriYkLtsguOm1e20-IAN2JNgXL7iUQ'
)

const beliefset = new Map();

client.onConfig( config => {
    console.log('Config:', config);
    console.log('Agents observation distance:', config.AGENTS_OBSERVATION_DISTANCE);
})
client.onMap( (x,y,tiles) => {
    console.log('Map:', x,y,tiles);
} )

client.onYou( me => {
    // console.log('You:', me);
})
client.onAgentsSensing( ( agents ) => {

    for ( let a of agents ) {
        beliefset.set( a.id, a );
    }

    let prettyPrint = Array
    .from(beliefset.values())
    .map( ({name,x,y,score}) => {
        return `${name}(${score}):${x},${y}`;
    } ).join(' ');
    console.log(prettyPrint)

} )

