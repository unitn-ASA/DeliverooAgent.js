#!/usr/bin/env node
import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )



client.on("msg", (id, name, msg, reply) => {
    console.log("msg", id, name, msg)
    if (reply)
        try { reply('this is msg_agent.js reply') } catch { (error) => console.error(error) }
});



client.shout( 'hello everyone' );

client.say( '0858a04228e', {hello: '0858a04228e'} );

client.ask( '0858a04228e', 'who are you?' ).then( (reply) => console.log(reply) );



// await client.timer(100);
// process.exit();