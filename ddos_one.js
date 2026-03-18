import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

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
    let name = (await socket.me).name;
    while (true) {
        console.log('say');
        socket.emitSay( '73d6d9', `hello ${i++} from ddos${name}` );
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

loop1();
loop2();