import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

/**
 * BONUS MONITOR:
 * Monitor parcels and award 500 bonus pts when:
 * - Someone initially picked up the parcel
 * - Later a DIFFERENT agent does the final delivery putdown
 */
const BONUS_REWARD = 500;
const PROMPT = 'From now on, everytime an agent deliver a parcel that was initially picked up by someone else, the delivery agent receives a bonus of '+BONUS_REWARD+'pts';



const socket = DjsConnect( process.env.HOST, process.env.ADMIN_TOKEN );

const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => {
        for ( let p of parcels ) {
            if ( p.deliveredBy && p.deliveredBy != p.initiallyPickedUpBy ) {


                // Log msg on chat and console
                let deliveredByNameOrId = trackedAgents.get(p.deliveredBy)?.name || p.carriedBy;
                let initiallyPickedUpByNameOrId = trackedAgents.get(p.initiallyPickedUpBy)?.name||p.initiallyPickedUpBy;
                let msg = `BONUS +${BONUS_REWARD} to ${deliveredByNameOrId}, who delivered ${p.id}(${p.reward}pts), initially picked up by ${initiallyPickedUpByNameOrId}`;
                console.log( msg);
                // Tell to myself in the chat
                socket.emitSay( me.id, msg );
                
                // Assign reward to the agent
                socket.emit( 'reward', {agentId, points:BONUS_REWARD} )
            }
        }
    }
} );



// Send the mission PROMPT
console.log( PROMPT );
socket.emitShout( PROMPT );
