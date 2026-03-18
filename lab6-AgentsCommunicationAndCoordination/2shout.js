import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect('https://deliveroojs2.rtibdi.disi.unitn.it/?name=shouter');

await new Promise( res => socket.onYou( res ) );

await socket.emitShout( process.argv[2] || 'hello everyone' );

process.exit();

