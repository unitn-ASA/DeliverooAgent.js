import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://rtibdi.disi.unitn.it:8080',
    // agent.id e083aa6f59e
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUwODNhYTZmNTllIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNzE2Mjg2NTA2fQ.grMI3zVziSg6troUw8HXi9wAvLSNil0OrBcA_Uz00V0'
)
await new Promise( res => client.onYou( res ) );

client.onMsg( (id, name, msg, reply) => {
    console.log("new msg received from", name+':', msg);
    if (reply) {
        let answer = 'hello '+name+', here is reply.js as '+client.name+'. Do you need anything?';
        console.log("my reply: ", answer);
        try { reply(answer) } catch { (error) => console.error(error) }
    }
});
