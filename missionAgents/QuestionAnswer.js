import dotenv from 'dotenv';
dotenv.config({ path: '../.env', override: true });
import { ArgumentParser } from "argparse";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const parser = new ArgumentParser({ description: 'Question Answer Mission Agent - Bonus for answering questions correctly' });
parser.add_argument('--bonus', { help: 'Bonus reward value', type: 'int', default: 500 });
parser.add_argument('--prompt', { help: 'Mission prompt' });
parser.add_argument('--question', { help: 'Question to ask', default: 'What is the capital of Italy?' });
parser.add_argument('--answers', { help: 'Correct answers as JSON array', default: JSON.stringify(['rome']) });
const args = parser.parse_args();

const BONUS_REWARD = args['bonus'];
const QUESTION = args['question'];
const ANSWERS = args['answers'].split(' ').map( ans => String(ans).toLowerCase() );
const PROMPT = (args['prompt'] || QUESTION + ' Reply with your answer to receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts.`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

const { me, trackedAgents, trackedParcels, emitReward } = await observeAsGod(socket, {} );

/** @type {string[]} */
const missionAchievedAgentIds = [];
socket.onMsg( async ( agentId, agentName, msg ) => {
    if ( ! missionAchievedAgentIds.includes( agentId ) && ANSWERS.includes( String(msg).toLowerCase() ) ) {
        missionAchievedAgentIds.push( agentId );

        // Reward the agent for answering correctly
        emitReward(agentId, BONUS_REWARD, 'answered correctly');
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
