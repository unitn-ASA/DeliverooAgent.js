import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )

client.shout( ...process.argv.slice(2) );

await client.timer(100);
process.exit();

