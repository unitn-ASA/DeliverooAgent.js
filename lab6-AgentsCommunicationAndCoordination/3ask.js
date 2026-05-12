import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect(
    'https://deliveroojs.bears.disi.unitn.it/?name=asker'
)

await new Promise( res => socket.onYou( res ) );

let reply = await socket.emitAsk( '0a582d', 'are you script 4reply?' );
console.log(reply);

process.exit();