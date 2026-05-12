import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect(
    'https://deliveroojs.bears.disi.unitn.it',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBhNTgyZCIsIm5hbWUiOiJtYXJjbyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzczODQ3MjQxfQ.6no1FuNTkhe-y3Ge5Nt0Faj2CAmnyRX3gEjE5aF6GuI'
)

await new Promise( res => socket.onYou( res ) );

socket.onMsg( async (id, name, msg, reply) => {
    console.log("new msg received from", name+':', msg);
    // const myname = (await socket.me).name;
    if (reply) {
        let answer = 'hello '+name+', this is the reply. Do you need anything?';
        console.log("my reply: ", answer);
        try { reply(answer) } catch { (/** @type {Error} */ error) => console.error(error) }
    }
});
