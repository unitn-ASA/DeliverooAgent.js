import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'Deliver Exactly N Parcels Mission Agent - Bonus for delivering exact number of parcels' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: 500 });
parser.add_argument('--parcels', { help: 'Number of parcels required for bonus', type: 'int', default: 3 });
parser.add_argument('--prompt', { help: 'Mission prompt' });
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const PARCELS_NUMBER = args['parcels'];
const PROMPT = (args['prompt'] || 'From now on, whoever delivers exactly ' + PARCELS_NUMBER + ' parcels at a time receives a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts. Required parcels: ${PARCELS_NUMBER}`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

const { me, trackedAgents, trackedParcels, emitReward } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => {
        if ( parcels.length == PARCELS_NUMBER ) {

            // Assign reward to the agent
            emitReward(agentId, BONUS_REWARD, 'delivered exactly ' + PARCELS_NUMBER + ' parcels');
        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
