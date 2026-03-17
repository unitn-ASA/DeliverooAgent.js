import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080'
    // 'https://deliveroojs.onrender.com/?name=ddos', ''
    // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', ''
    // 'https://deliveroojs25.azurewebsites.net/?name=ddos'
);

// const client2 = new DeliverooApi(
//     'http://localhost:8080/?name=ddos', client.token
//     // 'https://deliveroojs.onrender.com/?name=ddos', client.token
//     // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', client.token
// )

async function loop1() {
    while (true) {
        await client.emitPickup();
        // await new Promise(resolve => setTimeout(resolve, 0));
        await client.emitPutdown();
        // await new Promise(resolve => setTimeout(resolve, 0));
        await client.emitMove('down');
        // await new Promise(resolve => setTimeout(resolve, 0));
        await client.emitMove('up');
        // await new Promise(resolve => setTimeout(resolve, 0));
    }
}
async function loop2() {
    let i = 0;
    let name = (await client.me).name;
    while (true) {
        console.log('say');
        client.emitSay( '73d6d9', `hello ${i++} from ddos${name}` );
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

loop1();
loop2();