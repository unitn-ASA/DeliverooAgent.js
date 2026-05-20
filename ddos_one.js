import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

let me = await new Promise( res => socket.onYou( res ) );
let name = me.name;

// const client2 = DjsConnect(
//     'http://localhost:8080/?name=ddos', client.token
//     // 'https://deliveroojs.onrender.com/?name=ddos', client.token
//     // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', client.token
// )

async function loop1() {
    while (true) {
        await socket.emitPickup();
        // await new Promise(resolve => setTimeout(resolve, 0));
        await socket.emitPutdown();
        // await new Promise(resolve => setTimeout(resolve, 0));
        await socket.emitMove('down');
        // await new Promise(resolve => setTimeout(resolve, 0));
        await socket.emitMove('up');
        // await new Promise(resolve => setTimeout(resolve, 0));
    }
}
async function loop2() {
    let i = 0;
    while (true) {
        await socket.emitShout( `hello ${i++} from ${name} Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum` );
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

loop1();
loop2();