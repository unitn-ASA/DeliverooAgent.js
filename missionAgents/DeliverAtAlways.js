import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'Do Putdown At Mission Agent - Bonus for delivering at specific coordinates (one-time per agent)' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: 100 });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--coordinates', { help: 'Target coordinates as JSON array', default: JSON.stringify([
    {"x": 11, "y": 12},
    {"x": 12, "y": 12},
    {"x": 13, "y": 12}
])});
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const coordinates = JSON.parse(args['coordinates']);
const PROMPT = (args['prompt'] || 'Deliver at specific coordinates to receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts. Coordinates are ${JSON.stringify(coordinates)}. This is a one-time bonus per agent.`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );



const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => {

        // Check if the delivery includes any of the target coordinates
        if ( parcels.some( p => coordinates.map( xy => xy.x+','+xy.y ).includes( p.x+','+p.y ) ) ) {

            // Award the bonus
            socket.emit( 'reward', {agentId, points:BONUS_REWARD} )

            // Log msg on chat and console
            let deliveredByNameOrId = trackedAgents.get(agentId)?.name || agentId;
            let msg = `BONUS +${BONUS_REWARD} to ${deliveredByNameOrId}, who delivered at ${coordinates}`;
            console.log( msg);
            socket.emitSay( me.id, msg );

        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
