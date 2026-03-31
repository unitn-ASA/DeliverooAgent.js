import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

const beliefset = new Map();

socket.onConfig( config => {
    console.log('Config:', config);
    console.log('Agents observation distance:', config.GAME.player.observation_distance);
})
socket.onMap( (x,y,tiles) => {
    console.log('Map:', x,y,tiles);
} )

socket.onYou( me => {
    // console.log('You:', me);
})
socket.onSensing( ( sensing ) => {

    for ( let a of sensing.agents ) {
        beliefset.set( a.id, a );
    }

    let prettyPrint = Array
    .from(beliefset.values())
    .map( ({name,x,y,score}) => {
        return `${name}(${score}):${x},${y}`;
    } ).join(' ');
    console.log(prettyPrint)

} )

