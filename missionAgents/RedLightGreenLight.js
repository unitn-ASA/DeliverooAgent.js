import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'red light, green light game' });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: 500 });
const args = parser.parse_args();

/**
 * BONUS MONITOR:
 * Monitor parcels and award bonus pts when:
 * - Someone initially picked up the parcel
 * - Later a DIFFERENT agent does the final delivery putdown
 */
const BONUS_REWARD = args['bonus'];
const PROMPT = (args['prompt'] || 'All agents prepare to stop at red light and wait for the green light message before moving again, as in a “red light, green light” game.')
                + ` Bonus is ${BONUS_REWARD}pts.`;

const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

/** @type {string[]} */
const moved = [];

const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onMove: ({agentId, agentName}) => {
        if ( light == 'red' && !moved.includes(agentId) ) {
            moved.push(agentId);

            // Log msg on chat and Tell to myself in the chat
            let msg = `${agentName} moved during red light!`;
            console.log( msg);
            socket.emitSay( me.id, msg );

            // Assign reward to the agent
            socket.emit( 'reward', {agentId, points:BONUS_REWARD} )
        }
    }
} );



const resumeMsg = 'GREEN LIGHT! You can move again!';
const stopMsg = 'RED LIGHT! Stop moving until the next green light!';

var light = 'green';
setInterval( () => {

    // Green light
    if ( light == 'red' ) {
        light = 'green';
        moved.length = 0; // reset moved agents list

        console.log( resumeMsg );
        socket.emitShout( resumeMsg );
    
    }
    // Red light
    else {
        setTimeout(() => {light = 'red';}, 2000);

        console.log( stopMsg );
        socket.emitShout( stopMsg );
    
    }

}, 15000 );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
