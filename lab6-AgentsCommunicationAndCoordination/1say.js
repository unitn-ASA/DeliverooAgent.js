import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect('https://deliveroojs.bears.disi.unitn.it/?name=teller');

await socket.me;

await socket.emitSay( '0a582d', {
    hello: 'stranger 0a582d',
    iam: 'teller', //await socket.me.then( me => me.name ),
    id: socket.id
} );

process.exit();

