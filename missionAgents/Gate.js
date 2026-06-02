import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'Deliveroo.js Mission Agent' });
parser.add_argument('--bonus', { help: 'Bonus reward value' });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--coordinates', { help: 'coordinates' });
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'] || 100;
const COORDINATES = JSON.parse( args['coordinates'] ) || [
    {"x": 11, "y": 12},
    {"x": 12, "y": 12},
    {"x": 13, "y": 12}
];
const PROMPT = (args['prompt'] || 'Every time you pass through one of these coordinates you receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts. Coordinates are ${JSON.stringify(COORDINATES)}`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onMove: ({agentId, agentName, x, y}) => {
        if ( COORDINATES.map( xy => xy.x+','+xy.y ).includes( x+','+y ) ) {
            
            // Log msg on console and Tell to myself in the chat
            const msg = 'Rewarded agent ' + agentName + ' for going through coordinates ' + x + ',' + y;
            console.log( msg );
            socket.emitSay( me.id, msg );
            
            // Assign reward to the agent
            socket.emit( 'reward', {agentId, points:BONUS_REWARD} );

        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
