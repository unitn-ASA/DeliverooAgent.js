import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'https://deliveroojs.onrender.com',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * Belief revision function
 */

const me = {};
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )
const parcels = new Map();
client.onParcelsSensing( async ( perceived_parcels ) => {
    for (const p of perceived_parcels) {
        parcels.set( p.id, p)
    }
} )



/**
 * BDI loop
 */

function agentLoop() {
    
    /**
     * Options
     */
    const options = [];
    for ( const [id, parcel] of parcels.entries() ) {
        if ( parcel.carriedBy ) continue;
        options.push( {
            desire: 'go_pick_up',
            args: [parcel]
        } );
    }

    /**
     * Select best intention
     */
    let best_option;
    let nearest_distance = Number.MAX_VALUE;
    for ( const option of options ) {
        if ( option.desire != 'go_pick_up' ) continue;
        let parcel = option.args[0];
        const distance_to_option = distance( me, parcel );
        if ( distance_to_option < nearest_distance ) {
            best_option = option;
            nearest_distance = distance_to_option;
        }
    }


    /**
     * Revise/queue intention 
     */
    if ( best_option ) {
        myAgent.queue( best_option.desire, ...best_option.args );

}
client.onParcelsSensing( agentLoop )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )



/**
 * Intention revision / execution loop
 */
class Agent {

    intention_queue = new Array();

    async intentionLoop ( ) {
        while ( true ) {
            const intention = this.intention_queue.shift();
            if ( intention )
                await intention.achieve();
            await new Promise( res => setImmediate( res ) );
        }
    }

    async queue ( desire, ...args ) {
        const current = new Intention( desire, ...args )
        this.intention_queue.push( current );
    }

    async stop ( ) {
        console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

}
const myAgent = new Agent();
myAgent.intentionLoop();

// client.onYou( () => myAgent.queue( 'go_to', {x:11, y:6} ) )

// client.onParcelsSensing( parcels => {
//     for (const {x, y, carriedBy} of parcels) {
//         if ( ! carriedBy )
//             myAgent.queue( 'go_pick_up', {x, y} );
//     }
// } )



/**
 * Intention
 */
class Intention extends Promise {

    #current_plan;
    stop () {
        console.log( 'stop intention and current plan');
        this.#current_plan.stop();
    }

    #desire;
    #args;

    #resolve;
    #reject;

    constructor ( desire, ...args ) {
        var resolve, reject;
        super( async (res, rej) => {
            resolve = res; reject = rej;
        } )
        this.#resolve = resolve
        this.#reject = reject
        this.#desire = desire;
        this.#args = args;
    }

    #started = false;
    async achieve () {
        if ( this.#started )
            return this;
        this.#started = true;

        /**
         * Plan selection
         */
        let best_plan;
        let best_plan_score = Number.MIN_VALUE;
        for ( const plan of plans ) {
            if ( plan.isApplicableTo( this.#desire ) ) {
                this.#current_plan = plan;
                console.log( 'achieving desire', this.#desire, ...this.#args,
                    'with plan', plan
                );
                try {
                    const result = await plan.execute( ...this.#args );
                    this.#resolve( result );
                    console.log( 'plan', plan, 'succesfully achieved intention',
                        this.#desire, ...this.#args);
                } catch (error) {
                    console.log( 'plan', plan, 'failed to achieve intention',
                        this.#desire, ...this.#args
                    );
                    this.#reject( e );
                }
            }
        }
    }

}

/**
 * Plan library
 */
const plans = [];

class Plan {

    stop () {
        console.log( 'stop plan and all sub intentions');
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }

    #sub_intentions = [];

    async subIntention ( desire, ...args ) {
        const sub_intention = new Intention( desire, ...args );
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    isApplicableTo ( desire ) {
        return desire == 'go_pick_up';
    }

    async execute ( {x, y} ) {
        // TODO move to x, y
        await this.subIntention( 'go_to', {x, y} );
        await client.pickup();
    }

}

class BlindMove extends Plan {

    isApplicableTo ( desire ) {
        return desire == 'go_to';
    }

    async execute ( {x, y} ) {
        while ( me.x != x || me.y != y ) {
            const dx = x - me.x;
            const dy = y - me.y;
            // TODO move right left up or down
        }

    }
}

plans.push( new GoPickUp() )
plans.push( new BlindMove() )
