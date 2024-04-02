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
 * Beliefset revision function
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
client.onConfig( (param) => {
    // console.log(param);
} )


const myBeliefset = new Beliefset();
client.onMap( (width, height, tiles) => {
    for (let {x, y, delivery} of tiles) {
        myBeliefset.declare( 'tile '+x+'_'+y );
        if (delivery)
            myBeliefset.declare( 'delivery '+x+'_'+y );
        let right = tiles.find( (_x,_y) => x== _x+1 && y==_y );
        if ( right ) {
            myBeliefset.declare( 'right '+x+'_'+y+' '+right.x+'_'+right.y+' ' )
        }
    }
} )


/**
 * Options generation and filtering function
 */
client.onParcelsSensing( parcels => {

    // TODO revisit beliefset revision so to trigger option generation only in the case a new parcel is observed

    /**
     * Options generation
     */
    const options = []
    for (const parcel of parcels.values())
        if ( ! parcel.carriedBy )
            options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] );
            // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    /**
     * Options filtering
     */
    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if ( option[0] == 'go_pick_up' ) {
            let [go_pick_up,x,y,id] = option;
            let current_d = distance( {x, y}, me )
            if ( current_d < nearest ) {
                best_option = option
                nearest = current_d
            }
        }
    }

    /**
     * Best option is selected
     */
    if ( best_option )
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

    async loop ( ) {
        while ( true ) {
            // Consumes intention_queue if not empty
            if ( this.intention_queue.length > 0 ) {
                console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
            
                // Current intention
                const intention = this.intention_queue[0];
                
                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                let id = intention.predicate[2]
                let p = parcels.get(id)
                if ( p && p.carriedBy ) {
                    console.log( 'Skipping intention because no more valid', intention.predicate )
                    continue;
                }

                // Start achieving intention
                await intention.achieve()
                // Catch eventual error and continue
                .catch( error => {
                    // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                } );

                // Remove from the queue
                this.intention_queue.shift();
            }
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }

    // async push ( predicate ) { }

    log ( ...args ) {
        console.log( ...args )
    }

}

class IntentionRevisionQueue extends IntentionRevision {

    async push ( predicate ) {
        
        // Check if already queued
        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return; // intention is already queued

        console.log( 'IntentionRevisionReplace.push', predicate );
        const intention = new Intention( this, predicate );
        this.intention_queue.push( intention );
    }

}

class IntentionRevisionReplace extends IntentionRevision {

    async push ( predicate ) {

        // Check if already queued
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        if ( last && last.predicate.join(' ') == predicate.join(' ') ) {
            return; // intention is already being achieved
        }
        
        console.log( 'IntentionRevisionReplace.push', predicate );
        const intention = new Intention( this, predicate );
        this.intention_queue.push( intention );
        
        // Force current intention stop 
        if ( last ) {
            last.stop();
        }
    }

}

class IntentionRevisionRevise extends IntentionRevision {

    async push ( predicate ) {
        console.log( 'Revising intention queue. Received', ...predicate );
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
    }

}

/**
 * Start intention revision loop
 */

// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevisionReplace();
// const myAgent = new IntentionRevisionRevise();
myAgent.loop();



/**
 * Intention
 */
class Intention {

    // Plan currently used for achieving the intention 
    #current_plan;
    
    // This is used to stop the intention
    #stopped = false;
    get stopped () {
        return this.#stopped;
    }
    stop () {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    /**
     * #parent refers to caller
     */
    #parent;

    /**
     * predicate is in the form ['go_to', x, y]
     */
    get predicate () {
        return this.#predicate;
    }
    #predicate;

    constructor ( parent, predicate ) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    #started = false;
    /**
     * Using the plan library to achieve an intention
     */
    async achieve () {
        // Cannot start twice
        if ( this.#started)
            return this;
        else
            this.#started = true;

        // Trying all plans in the library
        for (const planClass of planLibrary) {

            // if stopped then quit
            if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

            // if plan is 'statically' applicable
            if ( planClass.isApplicableTo( ...this.predicate ) ) {
                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute( ...this.predicate );
                    this.log( 'succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res );
                    return plan_res
                // or errors are caught so to continue with next plan
                } catch (error) {
                    this.log( 'failed intention', ...this.predicate,'with plan', planClass.name, 'with error:', ...error );
                }
            }

        }

        // if stopped then quit
        if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ['no plan satisfied the intention ', ...this.predicate ]
    }

}

/**
 * Plan library
 */
const planLibrary = [];

class Plan {

    // This is used to stop the plan
    #stopped = false;
    stop () {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }
    get stopped () {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor ( parent ) {
        this.#parent = parent;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention ( predicate ) {
        const sub_intention = new Intention( this, predicate );
        this.#sub_intentions.push( sub_intention );
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        await this.subIntention( ['go_to', x, y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        return true;
    }

}

class BlindMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {

        while ( me.x != x || me.y != y ) {

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            let status_x = false;
            let status_y = false;
            
            // this.log('me', me, 'xy', x, y);

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

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

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
                this.log('stucked');
                throw 'stucked';
            } else if ( me.x == x && me.y == y ) {
                // this.log('target reached');
            }
            
        }

        return true;

    }
}

class PddlMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {

        var pddlProblem = new PddlProblem(
            'lights',
            myBeliefset.objects.join(' '),
            myBeliefset.toPddlString(),
            'and (at me '+x+'_'+y+')'
        )
        
        let problem = pddlProblem.toPddlString();
        console.log( problem );
        let domain = await readFile('./domain-lights.pddl' );
    
        var plan = await onlineSolver( domain, problem );ù

        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        
        const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (l) => console.log('executor lighton '+l) } );
        pddlExecutor.exec( plan );

    }
}

// plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( BlindMove )
