import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)
await new Promise( res => client.onYou( res ) );

client.onMsg( (id, name, msg, reply) => {
    console.log("new msg received from", name+':', msg);
    let answer = 'hello '+name+', here is reply.js as '+client.name+'. Do you need anything?';
    console.log("my reply: ", answer);
    if (reply)
        try { reply(answer) } catch { (error) => console.error(error) }
});
