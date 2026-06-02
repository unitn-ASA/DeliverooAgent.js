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
const ANSWERS = JSON.parse(args['answers']);
const PROMPT = (args['prompt'] || QUESTION + ' Reply with your answer to receive a bonus.')
                + ` Bonus is ${BONUS_REWARD}pts.`;



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {} );

socket.onMsg( async ( agentId, agentName, msg ) => {
    if ( ANSWERS.includes( JSON.stringify(msg).toLowerCase() ) ) {

        // Log msg on console and Tell to myself in the chat
        const responseMsg = 'Rewarded agent ' + agentName + ' for answering correctly to the question';
        console.log( responseMsg );
        socket.emitSay( me.id, responseMsg );

        // Assign reward to the agent
        socket.emit( 'reward', {agentId: agentId, points:BONUS_REWARD} );

    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
