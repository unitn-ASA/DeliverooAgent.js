import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect('https://deliveroojs.bears.disi.unitn.it/?name=shouter');

await socket.me;

await socket.emitShout( process.argv[2] || 'hello everyone' );

process.exit();

