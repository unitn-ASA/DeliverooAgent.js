import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM2NDAyZiIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6Ijc3MGQ2NiIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQzNTM1OTgxfQ.eZ_YNtxcRs0avs-npv8Y5uZcqKWXMlN3lnFxZUWwXko'
    // marco (36402f)
)
await new Promise( res => client.onYou( res ) );

client.onMsg( async (id, name, msg, reply) => {
    console.log("new msg received from", name+':', msg);
    const myname = (await client.me).name;
    if (reply) {
        let answer = 'hello '+name+', this is the reply from '+myname+'. Do you need anything?';
        console.log("my reply: ", answer);
        try { reply(answer) } catch { (error) => console.error(error) }
    }
});
