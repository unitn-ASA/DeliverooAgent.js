import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
// import EventEmitter from 'events';

/**
 * @typedef IOParcelEnhanced
 * @type {import("@unitn-asa/deliveroo-js-sdk/types/IOParcel.js").IOParcel & {initiallyPickedUpBy:string, deliveredBy:string?}}
 */

/**
 * @typedef IOAgentEnhanced
 * @type {import("@unitn-asa/deliveroo-js-sdk/types/IOAgent.js").IOAgent & {connected: boolean}}
 */



/**
 * @param { import("@unitn-asa/deliveroo-js-sdk/client/DjsClientSocket.js").DjsClientSocket } socket
 * @param { { onDelivery?: function( {agentId:string, parcels:IOParcelEnhanced[], reward:number} ) : void,
 *            onPutdown?: function( {agentId:string, parcels:IOParcelEnhanced[]} ) : void,
 *            onPickup?: function( {agentId:string, parcels:IOParcelEnhanced[]} ) : void,
 *            onMove?: function( {agentId:string, agentName:string, x:number, y:number} ) : void
 *          } } listeners
 */
export async function observeAsGod ( socket, { onDelivery, onPutdown, onPickup, onMove } ) {
    
    // /**
    //  * @type {EventEmitter<{
    //  *                      "agent xy": [IOAgentEnhanced],
    //  *                      "agent score": [IOAgentEnhanced],
    //  *                      "agent connected": [IOAgentEnhanced],
    //  *                      "agent disconnected": [IOAgentEnhanced],
    //  *                      "agentHasDelivered": [{agentId: string, parcels:IOParcelEnhanced[]}],
    //  *                     }>}
    //  */
    // const eventEmitter = new EventEmitter();

    /**
     * @type {IOAgentEnhanced}
     */
    const me = await new Promise( res => {
        socket.onceYou( me => {            
            res( {...me, connected:true} );
        } )
    } );

    /**
     * @type { Map< string, IOAgentEnhanced > }
     */
    const trackedAgents = new Map();

    /**
     * @type { Map< string, IOParcelEnhanced > }
     */
    const trackedParcels = new Map();



    socket.onSensing( async ( sensing ) => {

        // Update tracked agents
        for (const a of sensing.agents) {
            var known = trackedAgents.get(a.id);
            // if we never saw this agent before
            if ( ! known ) {
                known = {...a, connected: true};
                trackedAgents.set( a.id, known );
            }
            // else if coordinates are valid
            else if ( a.x != null && a.y != null ) {
                if ( known.x != a.x || known.y != a.y ) {
                    known.x = a.x;
                    known.y = a.y;
                    // if movement is completed and agent is in a tile
                    if ( a.x%1 == 0 && a.y%1 == 0 && onMove ) {
                        onMove({ agentId: a.id, agentName: a.name, x: a.x, y: a.y });
                        // eventEmitter.emit('agent xy', known);
                    }
                }
                if ( known.score != a.score ) {
                    known.score = a.score;
                    // eventEmitter.emit('agent score', known);
                } 
                known.connected = true;
                // eventEmitter.emit('agent conected', known);
            }
        }
        for (const [knownId, knownAgent] of trackedAgents) {
            // If a known agent is not in the current sensing, mark it as disconnected
            if ( ! sensing.agents.find( a => a.id == knownId ) ) {
                knownAgent.connected = false;
                // eventEmitter.emit('agent disconnected', knownAgent);
            }
        }

        // Update tracked parcels
        for (const p of sensing.parcels) {
            const tracked = trackedParcels.get( p.id );

            if ( ! tracked && p.carriedBy ) {
                // First time seeing this parcel being carried
                trackedParcels.set( p.id, {
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    initiallyPickedUpBy: p.carriedBy,
                    carriedBy: p.carriedBy,
                    deliveredBy: null,
                    reward: p.reward
                } );
            }

            if ( tracked ) {
                tracked.x = p.x;
                tracked.y = p.y;
                // Parcel changed carrier, update info and trigger events
                if ( tracked.carriedBy != p.carriedBy ) {
                    // Parcel was put down
                    if ( tracked.carriedBy && ! p.carriedBy )
                        if ( onPutdown ) onPutdown({ agentId: tracked.carriedBy, parcels: [tracked] });
                    // Parcel was picked up
                    else if ( ! tracked.carriedBy && p.carriedBy )
                        if ( onPickup ) onPickup({ agentId: p.carriedBy, parcels: [tracked] });
                    tracked.carriedBy = p.carriedBy;
                }
                tracked.reward = p.reward;
            }
        }
        /**
         * @type { string [] }
         */
        const agentDelivering = [];
        /**
         * @type { (IOParcelEnhanced) [] }
         */
        const delivered = [];
        for (const tp of trackedParcels.values()) {

            // skip already delivered parcels
            if ( tp.deliveredBy )
                continue;

            // Parcel is no longer in sensing -> it was put down
            if ( ! sensing.parcels.find( sp => sp.id == tp.id ) ) {
                
                if (
                    // it was carried by someone
                    tp.carriedBy &&
                    // who is still connected
                    trackedAgents.get(tp.carriedBy)?.connected &&
                    // and parcel was not expired (reward > 1)
                    tp.reward > 1
                ) {
                    // Parcels delivered
                    tp.deliveredBy = tp.carriedBy;
                    delivered.push(tp);
                    if ( ! agentDelivering.includes( tp.deliveredBy ) )
                        agentDelivering.push( tp.deliveredBy );
                    // eventEmitter.emit( 'parcel delivered', tp );
                }
                else {
                    // Remove this parcel from tracking if this got lost
                    trackedParcels.delete( tp.id );
                }

            }
        }
        for ( let agentId of agentDelivering ) {
            let simultaneouslyDeliveredParcels = delivered.filter( p => p.deliveredBy == agentId )
            // eventEmitter.emit( 'agentHasDelivered', {agentId, parcels: simultaneouslyDeliveredParcels} );
            if (onDelivery)
                process.nextTick( () => onDelivery({ agentId, parcels: simultaneouslyDeliveredParcels, reward: simultaneouslyDeliveredParcels.reduce((sum, p) => sum + p.reward, 0) }) );
        }
    } )

    return { me, trackedAgents, trackedParcels };
}