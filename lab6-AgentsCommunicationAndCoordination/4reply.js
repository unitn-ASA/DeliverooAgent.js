import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

await new Promise( res => socket.onYou( res ) );

socket.onMsg( async (id, name, msg, reply) => {
    console.log("new msg received from", name+':', msg);
    const myname = (await socket.me).name;
    if (reply) {
        let answer = 'hello '+name+', this is the reply from '+myname+'. Do you need anything?';
        console.log("my reply: ", answer);
        try { reply(answer) } catch { (error) => console.error(error) }
    }
});
