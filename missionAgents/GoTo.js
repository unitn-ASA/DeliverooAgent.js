import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'GoTo Mission Agent - Agent receives bonus for reaching specific coordinates' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: -1000 });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--coordinates', { help: 'Target coordinates as JSON array', default: JSON.stringify([
    {"x": 11, "y": 12},
    {"x": 12, "y": 12},
    {"x": 13, "y": 12}
])});
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const coordinates = JSON.parse(args['coordinates']);
const PROMPT = (args['prompt'] || 'Go to one of these coordinates to receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts. Coordinates are ${JSON.stringify(coordinates)}`;

const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

/**
 * @type {{id:string}}
 */
const me = await new Promise( res => {
    socket.onceYou( me => {
        res( me );
    } )
} );

/** @type {string[]} */
const missionAchievedAgentIds = [];
socket.onSensing( async ( sensing ) => {
    const candidates = sensing.agents.filter( a => coordinates.map( xy => xy.x+','+xy.y ).includes( a.x+','+a.y ) );
    for (const c of candidates) {
        if ( ! missionAchievedAgentIds.includes( c.id ) ) {
            missionAchievedAgentIds.push( c.id );

            // Log msg on chat and console
            const msg = 'Rewarded agent ' + c.name + ' for being at coordinates ' + c.x + ',' + c.y;
            console.log( msg );
            // Tell to myself in the chat
            socket.emitSay( me.id, msg );

            // Assign reward to the agent
            socket.emit( 'reward', {agentId: c.id, points:BONUS_REWARD} );
        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
