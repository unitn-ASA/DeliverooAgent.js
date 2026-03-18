import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect('https://deliveroojs2.rtibdi.disi.unitn.it/?name=teller');

await new Promise( res => socket.onYou( res ) );

await socket.emitSay( 'd26d57', {
    hello: 'stranger d26d57',
    iam: 'teller', //await socket.me.then( me => me.name ),
    id: socket.id
} );

process.exit();

