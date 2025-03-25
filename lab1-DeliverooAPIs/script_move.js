import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)

async function myFn () {

    let up = await client.emitMove('up');
    let right = await client.emitMove('right');
    
}

// myFn ()

client.on( 'tile', (x, y, delivery) => {
    console.log(x, y, delivery)
} )

/**
 * 28/03/2023
 * 
 * Implement an agent that:
 * - moves along a predefined path
 * - pick the parcel
 * - deliver it
 * 
 * What if other agents are moving?
 * - Dealing with failing actions, by insisting on path.
 */