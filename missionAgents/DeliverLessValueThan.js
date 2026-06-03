import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'If you deliver parcels for a total amount of reward lower or equal to 10, you get a bonus' });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: 100 });
parser.add_argument('--threshold', { help: 'Reward threshold to get the bonus', type: 'int', default: 10 });
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const THRESHOLD = args['threshold'];
const PROMPT = (args['prompt'] || `If you deliver parcels for a total amount of reward lower or equal to ${THRESHOLD}, you get a bonus.`)
                + ` Bonus is ${BONUS_REWARD}pts. Threshold is ${THRESHOLD}pts.`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );



const { me, trackedAgents, trackedParcels, emitReward } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels, reward}) => {

        // Check if the delivery includes any of the target coordinates
        if ( reward <= THRESHOLD ) {

            // Reward the agent for delivering parcels for a total reward lower or equal to the threshold
            emitReward(agentId, BONUS_REWARD, 'delivered parcels for a total reward of ' + reward + 'pts, which is lower or equal to the threshold of ' + THRESHOLD + 'pts');

        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
