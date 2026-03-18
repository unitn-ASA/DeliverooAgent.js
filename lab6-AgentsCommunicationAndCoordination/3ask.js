import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect(
    'https://deliveroojs2.rtibdi.disi.unitn.it/?name=asker'
)

await new Promise( res => socket.onYou( res ) );

let reply = await socket.emitAsk( 'd26d57', 'are you script 4reply?' );
console.log(reply);

process.exit();