import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    // 'http://localhost:8080/?name=ddos'
    // 'https://deliveroojs.onrender.com/?name=ddos', ''
    // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', ''
    'https://deliveroojs25.azurewebsites.net/?name=ddos'
);

// const client2 = new DeliverooApi(
//     'http://localhost:8080/?name=ddos', client.token
//     // 'https://deliveroojs.onrender.com/?name=ddos', client.token
//     // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', client.token
// )

while (true) {
    client.emitMove('down');
    await new Promise(resolve => setTimeout(resolve, 0));
    client.emitMove('up');
    await new Promise(resolve => setTimeout(resolve, 0));
}