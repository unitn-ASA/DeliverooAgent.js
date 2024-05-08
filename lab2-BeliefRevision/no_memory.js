import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs.onrender.com',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

const beliefset = new Map();

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

