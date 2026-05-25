import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
import { observeAsGod } from "./utils/observeAsGod.js";

const BONUS_REWARD = 500;
const coordinates = [ {x:10, y:20}, {x:11, y:20} ];
const PROMPT = 'Go to one of these coordinates ' + JSON.stringify(coordinates) + ' and receives one bonus of ' + BONUS_REWARD + 'pts';



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
