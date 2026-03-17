import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs2.rtibdi.disi.unitn.it/?name=asker'
    // 'http://localhost:8080/?name=asker'
    // 'http://rtibdi.disi.unitn.it:8080',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllYzE3ZjU3NDE3IiwibmFtZSI6ImdvZCIsImlhdCI6MTY4MzY0MjYwNX0.RQma5Et12MM1Ff-wnuNC0Zaq4WkzEOZ7S6KAV1kfmak'
)
await new Promise( res => client.onYou( res ) );

let reply = await client.emitAsk( 'd26d57', 'are you script 4reply?' );
console.log(reply);

process.exit();