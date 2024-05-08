import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    // 'http://localhost:8080/?name=ddos', ''
    // 'https://deliveroojs.onrender.com/?name=ddos', ''
    'http://rtibdi.disi.unitn.it:8080/?name=ddos', ''
)

const client2 = new DeliverooApi(
    // 'http://localhost:8080/?name=ddos', client.token
    // 'https://deliveroojs.onrender.com/?name=ddos', client.token
    'http://rtibdi.disi.unitn.it:8080/?name=ddos', client.token
)

while (true) {
    client.move('down');
    await new Promise(resolve => setTimeout(resolve, 10));
    client.move('up');
}