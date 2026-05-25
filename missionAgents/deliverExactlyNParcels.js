import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const BONUS_REWARD = 500;
const PARCELS_NUMBER = 3;
const PROMPT = 'From now on, who deliver exactly '+PARCELS_NUMBER+' parcels at a time receives a bonus of 500pts';



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
