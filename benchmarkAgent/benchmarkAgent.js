import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import EventEmitter from "events";
import depth_search_daemon from "./depth_search_daemon.js";

/**
 * @typedef me
 * @type { { id: string, name: string, x: number, y: number, score: number, carrying: Map<string, parcel> } }
 */

/**
 * @typedef parcel
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").parcel}
 */

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)
const depth_search = depth_search_daemon(client);

// function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
//     const dx = Math.abs( Math.round(x1) - Math.round(x2) )
//     const dy = Math.abs( Math.round(y1) - Math.round(y2) )
//     return dx + dy;
// }

function distance( {x:x1, y:y1}, {x:x2, y:y2} ) {
    return depth_search( {x:x1, y:y1}, {x:x2, y:y2} ).length;
}



/**
 * Beliefset revision function
 */
/** @type  {me } */
const me = { id:undefined, name:undefined, x:undefined, y:undefined, score:undefined, carrying: new Map() };
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )

const parcels = new Map();
const sensingEmitter = new EventEmitter();
client.onParcelsSensing( async ( perceived_parcels ) => {
    let new_parcel_sensed = false;
    for (const p of perceived_parcels) {
        if ( ! parcels.has(p.id) )
            new_parcel_sensed = true;
        parcels.set( p.id, p)
        if ( p.carriedBy == me.id ) {
            me.carrying.set( p.id, p );
        }
    }
    for ( const [id,p] of parcels.entries() ) {
        if ( ! perceived_parcels.find( p=>p.id==id ) ) {
            parcels.delete( id ); 
            me.carrying.delete( id );
        }
    }
    if (new_parcel_sensed)
        sensingEmitter.emit("new_parcel")
} )

var AGENTS_OBSERVATION_DISTANCE
var MOVEMENT_DURATION
var PARCEL_DECADING_INTERVAL
client.onConfig( (config) => {
    AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
    MOVEMENT_DURATION = config.MOVEMENT_DURATION;
    PARCEL_DECADING_INTERVAL = config.PARCEL_DECADING_INTERVAL == '1s' ? 1000 : 1000000;
} );

const map = {
    width:undefined,
    height:undefined,
    tiles: new Map(),
    add: function ( tile ) {
        const {x, y} = tile;
        return this.tiles.set( x+1000*y, tile );
    },
    xy: function (x, y) {
        return this.tiles.get( x+1000*y )
    }
};
client.onMap( (width, height, tiles) => {
    map.width = width;
    map.height = height;
    for (const t of tiles) {
        map.add( t );
    }
} )
client.onTile( (x, y, delivery) => {
    map.add( {x, y, delivery} );
} )

function nearestDelivery({x, y}) {
    return Array.from( map.tiles.values() ).filter( ({type}) => type==2 ).sort( (a,b) => distance(a,{x, y})-distance(b,{x, y}) )[0]
}


/**
 * Options generation and filtering function
 */
sensingEmitter.on( "new_parcel", () => {

    // TODO revisit beliefset revision so to trigger option generation only in the case a new parcel is observed

    let carriedQty = me.carrying.size;
    let carriedReward = Array.from( me.carrying.values() ).reduce( (acc, parcel) => acc + parcel.reward, 0 )

    /**
     * Options generation
     */
    const options = []
    for (const parcel of parcels.values()) {
        if ( ! parcel.carriedBy )
            options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id, parcel.reward ] );
    }
    if ( carriedReward > 0 || parcels.size > 0 ) {
        options.push( [ 'go_deliver' ] );
    }
    
    function reward (option) {
        if ( option[0] == 'go_deliver' ) {
            let deliveryTile = nearestDelivery(me)
            return carriedReward - carriedQty * MOVEMENT_DURATION/PARCEL_DECADING_INTERVAL * distance( me, deliveryTile ); // carried parcels value - cost for delivery
        }
        else if ( option[0] == 'go_pick_up' ) {
            let [go_pick_up,x,y,id,reward] = option;
            let deliveryTile = nearestDelivery({x, y});
            return carriedReward + reward - (carriedQty+1) * MOVEMENT_DURATION/PARCEL_DECADING_INTERVAL * (distance( {x, y}, me ) + distance( {x, y}, deliveryTile ) ); // parcel value - cost for pick up - cost for delivery
        }
    }
    /**
     * Options filtering / sorting
     */

    options.sort( (o1, o2) => reward(o1)-reward(o2) )

    for (const opt of options) {
        myAgent.push( opt )
    }

} )



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
            if ( this.stopped )
                break;

            // if plan is 'statically' applicable
            if ( planClass.isApplicableTo( ...this.predicate ) ) {
                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                // this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute( ...this.predicate );
                    this.log( 'succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res );
                    return plan_res
                // or errors are caught so to continue with next plan
                } catch (error) {
                    if ( this.stopped )
                        break;
                    this.log( 'failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', error );
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
        return sub_intention.achieve();
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
        await client.emitPickup()
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        return true;
    }

}

class GoDeliver extends Plan {

    static isApplicableTo ( go_deliver ) {
        return go_deliver == 'go_deliver';
    }

    async execute ( go_deliver ) {

        let deliveryTile = nearestDelivery( me );

        await this.subIntention( ['go_to', deliveryTile.x, deliveryTile.y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit

        await client.emitPutdown()
        if ( this.stopped ) throw ['stopped']; // if stopped then quit

        return true;

    }

}

class Patrolling extends Plan {

    static isApplicableTo ( patrolling ) {
        return patrolling == 'patrolling';
    }

    async execute ( patrolling ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        let i = Math.round( Math.random() * map.tiles.size );
        let tile = Array.from( map.tiles.values() ).at( i );
        if ( tile )
            await this.subIntention( ['go_to', tile.x, tile.y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        return true;
    }

}

class DepthSearchMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {
        
        this.log( 'DepthSearchMove', 'from',  me.x, me.y, 'to', {x, y} );
        
        while ( me.x != x && me.y != y ) {

            const plan = depth_search(me, {x, y})
    
            // client.socket.emit( "path", plan.map( step => step.current ) );

            if ( plan.length == 0 ) {
                throw 'target not reachable';
            }
    
            for ( const step of plan ) {
    
                if ( this.stopped ) throw ['stopped']; // if stopped then quit
                
                const status = await client.emitMove( step.action )
    
                if ( status ) {
                    me.x = status.x;
                    me.y = status.y;
                }
                else {
                    this.log( 'DepthSearchMove replanning', 'from',  me.x, me.y, 'to', {x, y} );
                    break;
                }
    
            }
            
        }

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

            /** @type {{x,y}|boolean} */
            let status_x = false;
            /** @type {{x,y}|boolean} */
            let status_y = false;
            
            // this.log('me', me, 'xy', x, y);

            if ( x > me.x )
                status_x = await client.emitMove('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( x < me.x )
                status_x = await client.emitMove('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            if ( y > me.y )
                status_y = await client.emitMove('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( y < me.y )
                status_y = await client.emitMove('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                // this.log('stucked');
                throw 'stucked';
            } else if ( me.x == x && me.y == y ) {
                // this.log('target reached');
            }
            
        }

        return true;

    }
}

// plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( Patrolling )
planLibrary.push( GoDeliver )
planLibrary.push( DepthSearchMove )
// planLibrary.push( BlindMove )







/**
 * Intention revision loop
 */
class IntentionRevision {

    #intention_queue = new Array();
    get intention_queue () {
        return this.#intention_queue;
    }

    currentIntention;

    stopCurrent () {
        if ( this.currentIntention )
            this.currentIntention.stop();
    }

    async loop ( ) {
        while ( true ) {
            // Consumes intention_queue if not empty
            if ( this.intention_queue.length > 0 ) {
                console.log( 'intentionRevision.loop', this.intention_queue );
            
                // Current intention
                const predicate = this.intention_queue.shift();
                const intention = this.currentIntention = new Intention( this, predicate );
                
                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                if ( intention.predicate[0] == "go_pick_up" ) {
                    let id = intention.predicate[3]
                    let p = parcels.get(id)
                    if ( p && p.carriedBy ) {
                        console.log( 'Skipping intention because no more valid', intention.predicate );
                        continue;
                    }
                }

                // Start achieving intention
                await intention.achieve()
                // Catch eventual error and continue
                .catch( error => {
                    if ( !intention.stopped )
                        console.error( 'Failed intention', ...intention.predicate, 'with error:', error )
                } );

            }
            else {
                this.push( this.idle );
            }

            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }

    // async push ( predicate ) { }

    log ( ...args ) {
        console.log( ...args )
    }
    
    async push ( predicate ) {

        // console.log( 'IntentionRevisionReplace.push', predicate );

        // // Check if already queued
        // if ( this.intention_queue.find( (p) => p.join(' ') == predicate.join(' ') ) )
        //     return;
        
        // // Reschedule current
        // if ( this.currentIntention )
        //     this.intention_queue.unshift( this.currentIntention.predicate );

        // Prioritize pushed one
        this.intention_queue.unshift( predicate );

        // Force current to stop
        this.stopCurrent();
        
    }

}

/**
 * Start intention revision loop
 */

// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevision();
myAgent.idle = [ "patrolling" ];
// const myAgent = new IntentionRevisionRevise();
myAgent.loop();