import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
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
 * BDI desire revision function
 */
client.onParcelsSensing( parcels => {
    
    // for (const parcel of parcels.values())
    //     if ( ! parcel.carriedBy )
    //         myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    // TODO push go_pick_up only in the case a new parcel is observed

    /**
     * Options
     */
    const options = []
    for (const parcel of parcels.values())
        if ( ! parcel.carriedBy )
            options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] );
            // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    /**
     * Select best intention
     */
    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if ( option[0] == 'go_pick_up' ) {
            let current_d = distance( {x: option[1], y:option[2]}, me )
            if ( current_d < nearest ) {
                best_option = option
                nearest = current_d
            }
        }
    }

    if(best_option)
        myAgent.push( best_option )

} )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )



/**
 * Intention revision loop
 */
class IntentionRevision {

    #intention_queue = new Array();
    get intention_queue () {
        return this.#intention_queue;
    }

    async intentionLoop ( ) {
        while ( !this.stopped ) {
            const intention = this.intention_queue.shift();
            if ( intention ) {
                
                // Do I still want to achieve this intention?
                let p = parcels.get(intention.args[2])
                if ( p && p.carriedBy ) {
                    console.log( 'skipping intention because no more valid', intention.desire, intention.args )
                    continue;
                }

                await intention.achieve().catch( error =>
                    console.log( ...error )
                    // console.log( 'failed intention', intention.desire, intention.args, 'with error:', error )
                );

            }
            await new Promise( res => setImmediate( res ) );
        }
    }

    // async push ( desire, ...args ) { }

    #stopped = false
    get stopped () {
        return this.#stopped;
    }
    async stop ( ) {
        console.log( 'stop intention revision');
        this.#stopped = true;
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

}

class IntentionRevisionQueue extends IntentionRevision {

    async push ( current ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        if ( last && last[0] == current[0] && last[1] == current[1] && last[2] == current[2] )
            return;
        let desire = current[0]
        let args = current.slice(1)
        console.log( 'Queing intention', desire, ...args );
        const intention = new Intention( null, desire, ...args );
        this.intention_queue.push( intention );
    }

}

class IntentionRevisionReplace extends IntentionRevision {

    async push ( current ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        if ( last && last[0] == current[0] && last[1] == current[1] && last[2] == current[2] )
            return;
        let desire = current[0]
        let args = current.slice(1)
        console.log( 'Replacing current intention with', desire, ...args );
        const intention = new Intention( null, desire, ...args );
        this.intention_queue.push( intention );
        if ( last )
            last.stop();
    }

}

class IntentionRevisionRevise extends IntentionRevision {

    async push ( desire, ...args ) {
        console.log( 'Revising current intention. New desire received', desire, ...args );
        // TODO
        // re-order intentions (for example based on parcel distance)   
    }

}

const myAgent = new IntentionRevisionQueue();
// const myAgent = new IntentionRevisionReplace();
// const myAgent = new IntentionRevisionRevise();
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
class Intention {

    #current_plan;
    #stopped = false;
    get stopped () {
        return this.#stopped;
    }
    stop () {
        console.log( 'stop intention', this.desire, ...this.#args );
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    #parent;
    #desire;
    #args;
    get parent () {
        return this.#parent;
    }
    get desire () {
        return this.#desire;
    }
    get args () {
        return this.#args;
    }

    constructor ( parent, desire, ...args ) {
        this.#parent = parent;
        this.#desire = desire;
        this.#args = args;
    }

    #started = false;
    async achieve () {
        if ( this.#started)
            return this;
        else
            this.#started = true;

        for (const plan of plans) {

            if ( this.stopped ) throw [ 'stopped intention', this.#desire ];

            if ( plan.isApplicableTo( this.#desire ) ) {
                this.#current_plan = plan;
                console.log('achieving desire', this.#desire, ...this.#args, 'with plan', plan);
                try {
                    const plan_res = await plan.execute( ...this.#args );
                    console.log( 'succesful intention', this.#desire, ...this.#args, 'with plan', plan, 'with result', plan_res );
                    return plan_res
                } catch (error) {
                    console.log( 'failed intention', this.#desire, ...this.#args,'with plan', plan, 'with error', error );
                }
            }

        }

        // console.log( 'no plan satisfied the desire ', this.#desire, ...this.#args );
        throw ['no plan satisfied the desire ', this.#desire, ...this.#args ]
    }

}

/**
 * Plan library
 */
const plans = [];

class Plan {

    #stopped = false
    stop () {
        console.log( 'stop plan');
        this.#stopped = true;
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }
    get stopped () {
        return this.#stopped;
    }

    #sub_intentions = [];

    async subIntention ( desire, ...args ) {
        const sub_intention = new Intention( null, desire, ...args );
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    isApplicableTo ( desire ) {
        return desire == 'go_pick_up';
    }

    async execute ( x, y ) {
        if ( this.stopped ) throw 'stopped';
        await this.subIntention( 'go_to', x, y );
        if ( this.stopped ) throw 'stopped';
        await this.subIntention( 'go_to', x, y );
        if ( this.stopped ) throw 'stopped';
        await client.pickup()
        if ( this.stopped ) throw 'stopped';
        return true;
    }

}

class BlindMove extends Plan {

    isApplicableTo ( desire ) {
        return desire == 'go_to';
    }

    async execute ( x, y ) {

        while ( me.x != x || me.y != y ) {

            let status_x = false;
            let status_y = false;
            
            console.log('me', me, 'xy', x, y);

            if ( x > me.x )
                status_x = await client.move('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( x < me.x )
                status_x = await client.move('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( y > me.y )
                status_y = await client.move('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( y < me.y )
                status_y = await client.move('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                console.log('stucked');
                throw 'stucked';
            } else if ( me.x == x && me.y == y ) {
                console.log('target reached');
            }
            
        }

        return true;

    }
}

plans.push( new GoPickUp() )
plans.push( new BlindMove() )
