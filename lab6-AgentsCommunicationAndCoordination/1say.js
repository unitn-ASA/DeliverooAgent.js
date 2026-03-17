import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs2.rtibdi.disi.unitn.it/?name=teller'
    // 'http://localhost:8080/?name=teller'
    // 'http://rtibdi.disi.unitn.it:8080',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllYzE3ZjU3NDE3IiwibmFtZSI6ImdvZCIsImlhdCI6MTY4MzY0MjYwNX0.RQma5Et12MM1Ff-wnuNC0Zaq4WkzEOZ7S6KAV1kfmak'
)
await new Promise( res => client.onYou( res ) );

await client.emitSay( 'd26d57', {
    hello: 'stranger d26d57',
    iam: 'teller', //await client.me.then( me => me.name ),
    id: client.id
} );

process.exit();

