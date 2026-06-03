import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'GoTo Mission Agent - Agent receives bonus for reaching specific coordinates' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: -1000 });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--unatantum', { help: 'If set, the mission can be achieved only once by a single agent', default: true });
parser.add_argument('--coordinates', { help: 'Target coordinates as JSON array', default: JSON.stringify([
    {"x": 11, "y": 12},
    {"x": 12, "y": 12},
    {"x": 13, "y": 12}
])});
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const UNATANTUM = JSON.parse(args['unatantum'] || false);
console.log('UNATANTUM:', UNATANTUM);
const COORDINATES = JSON.parse(args['coordinates']);
const PROMPT = (args['prompt'] || 'Go to one of these coordinates to receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts. Coordinates are ${JSON.stringify(COORDINATES)}`;

const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

/** @type {string[]} */
const missionAchievedAgentIds = [];

const {emitReward} = await observeAsGod(socket, {
    onMove: ({agentId, agentName, x, y}) => {
        
        // Check if the new coordinates are among the target coordinates
        if ( COORDINATES.map( xy => xy.x+','+xy.y ).includes( x+','+y ) ) {

            // Check if the agent has not already achieved the mission or if the mission can be achieved multiple times by the same agent
            if ( ! missionAchievedAgentIds.includes( agentId ) || ! UNATANTUM ) {
                missionAchievedAgentIds.push( agentId );

                // Reward the agent for reaching the target coordinates
                emitReward(agentId, BONUS_REWARD, 'reached coordinates ' + x + ',' + y);
            }
        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
