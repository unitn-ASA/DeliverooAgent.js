import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as argsParser } from "args-parser";

const client = new DeliverooApi() // expect to get host and token from cmd args
await new Promise( res => client.onYou( res ) );

const args = argsParser(process.argv);
let teamAgentId = args['teamId'];

var currentIntention = null;
var pickupCoordination = {};

client.onMsg( async (id, name, /**@type {{action:string,parcelId:string}}*/msg, reply) => {
    
    if ( msg?.action == 'pickup' ) {
        
        // wait between 0-100ms before replying, in case the other agent is also replying
        await new Promise( resolve => setTimeout(resolve, Math.random()*50) );
        
        if (reply) {
            try { 
                if ( pickupCoordination[msg.parcelId] == client.id ) {
                    console.log("replying NO. I'm already picking up this parcel")
                    reply( false ); // no, I'm already picking up this parcel
                } else if ( pickupCoordination[msg.parcelId] == id || ! pickupCoordination[msg.parcelId] ) {
                    console.log("replying YES. teamMate can do the pickup");
                    pickupCoordination[msg.parcelId] = id; // parcel is assigned to the other agent
                    reply( true ); // yes, go ahead, you can pickup
                }
            } catch { (error) => console.error(error) }
        }
    }

});

client.onParcelsSensing( async (parcels) => {
    // if there are parcels and I'm not already doing something
    if ( parcels.length > 0  && ! currentIntention) {
        let parcel = parcels[0];
        
        // if parcel is already assigned
        if ( pickupCoordination[parcel.id] )
            return;
        
        console.log("parcel", parcel);

        // wait for the other agent to reply
        const reply = await client.emitAsk( teamAgentId, {
            action: 'pickup',
            parcelId: parcel.id
        } );
        
        // if I am allowed to pickup and parcel is not assigned to anybody
        if ( reply ) {
            if ( ! pickupCoordination[parcel.id] ) {
                console.log(`We agreed: I will do the pickup`, parcel.id);
                pickupCoordination[parcel.id] = client.id; // assign parcel to me
                currentIntention = client.emitMove( 'down' );
                let pickup = await currentIntention;
                currentIntention = null;
            } else {
                console.log(
                    "I let the other agent pickup, but meanwhile he replied me back to pickup",
                    "Should we coordinate again?",
                    parcel.id
                );
            }
        } else {
            console.log(`We agreed: teamMate ${teamAgentId} will do the pickup`, parcel.id);
        }


    }
})
