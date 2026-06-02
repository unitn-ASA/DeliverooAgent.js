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

const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => {
        if ( parcels.length == PARCELS_NUMBER ) {

            // Log msg on chat and console
            const msg = 'Rewarded agent ' + agentId + ' for deliverying exactly ' + PARCELS_NUMBER + ' parcels';
            console.log( msg );
            // Tell to myself in the chat
            socket.emitSay( me.id, msg );

            // Assign reward to the agent
            socket.emit( 'reward', {agentId, points:BONUS_REWARD} )
        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
