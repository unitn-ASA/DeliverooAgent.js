import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllYzE3ZjU3NDE3IiwibmFtZSI6ImdvZCIsImlhdCI6MTY4MzY0MjYwNX0.RQma5Et12MM1Ff-wnuNC0Zaq4WkzEOZ7S6KAV1kfmak'
)
await new Promise( res => client.onYou( res ) );

let reply = await client.ask( '09fd649e76e', 'hellooo?' );
console.log(reply);

process.exit();