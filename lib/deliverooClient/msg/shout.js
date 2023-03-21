import * as config from "../../../config.js";
import { timer, DeliverooApi } from "../index.js";

const client = new DeliverooApi( config.host, config.token )

client.shout( ...process.argv.slice(2) );

await timer(100);
process.exit();

