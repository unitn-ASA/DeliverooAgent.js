import { DjsClientSocket } from "@unitn-asa/deliveroo-js-sdk/client";

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

export default function ( /**@type {DjsClientSocket}*/socket ) {
    
    var OBSERVATION_DISTANCE
    var MOVEMENT_DURATION
    socket.onConfig( (config) => {
        OBSERVATION_DISTANCE = config.GAME.player.observation_distance;
        MOVEMENT_DURATION = config.GAME.player.movement_duration;
    } );
    
    /**
     * @typedef tile
     * @type { { x: number, y: number, type: string, locked?: boolean, cost_to_here?: number, previous_tile?: tile, action_from_previous? } }
     */
    /**
     * @type {Map<string, tile>}
     */
    const map = new Map()
    socket.onTile( ( {x, y, type} ) => {
        // console.log('map.set', x+'_'+y, {x, y, type})
        map.set(x+'_'+y, {x, y, type})
    } );
    
    var me = {x:undefined, y:undefined};
    socket.onYou( ( {x, y} ) => {
        me.x = x;
        me.y = y;
    } );

    const agents = new Map()
    socket.onSensing( ( sensing ) => {
        for ( const {id, name, x, y, score} of sensing.agents ) {
            agents.set(id, {id, x, y} );
        }
        for ( const [id, {x, y}] of agents.entries() ) {
            if ( distance (me, {x, y}) < OBSERVATION_DISTANCE && ! sensing.agents.find( ({id: agent_id}) => id == agent_id ) )
            agents.delete(id);
        }
    } );

    return async function ( {x:init_x, y:init_y}, {x:target_x, y:target_y} ) {
        
        init_x = Math.round(init_x);
        init_y = Math.round(init_y);
        target_x = Math.round(target_x);
        target_y = Math.round(target_y);

        for ( const {id, x, y} of agents.values() ) {
            try{
                map.get(Math.ceil(x)+'_'+Math.ceil(y)).locked = true;
                map.get(Math.floor(x)+'_'+Math.floor(y)).locked = true;
                // console.log('planning aware of agent at', x, y)
            } catch {}
        }

        // console.log('go from', me.x, me.y, 'to', target_x, target_y);

        async function search (cost, x, y, previous_tile, action_from_previous) {

            const currentTile = map.get(x+'_'+y);
            
            if ( ! currentTile || currentTile.type == '0' || currentTile.locked )
                return false;

            if ( previous_tile && ["←", "↑", "→", "↓"].includes(currentTile.type) ) {
                if ( x == previous_tile.x + 1 && currentTile.type == '←' ) // I want right but there's a left arrow
                    return false;
                if ( x == previous_tile.x - 1 && currentTile.type == '→' ) // I want left but there's a right arrow
                    return false;
                if ( y == previous_tile.y + 1 && currentTile.type == '↓' ) // I want up but there's a down arrow
                    return false;
                if ( y == previous_tile.y - 1 && currentTile.type == '↑' ) // I want down but there's an up arrow
                    return false;
            }
                
            const tile = map.get(x+'_'+y)
            if( tile.cost_to_here <= cost)
                return false;
            else {
                tile.cost_to_here = cost;
                tile.previous_tile = previous_tile;
                if( action_from_previous )
                    tile.action_from_previous = action_from_previous;
            }
            
            if ( target_x == x && target_y == y ) {
                // console.log('found with cost', cost)
                // function backward ( tile ) {
                //     console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
                //     if ( tile.previous_tile ) backward( tile.previous_tile );
                // }
                // backward( tile )
                return true;
            }

            let options = new Array(
                [cost+1, x+1, y, tile, 'right'],
                [cost+1, x-1, y, tile, 'left'],
                [cost+1, x, y+1, tile, 'up'],
                [cost+1, x, y-1, tile, 'down']
            );
            options = options.sort( (a, b) => {
                return distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - distance({x: target_x, y: target_y}, {x: b[1], y: b[2]})
            } )

            await search( ...options[0] )
            await search( ...options[1] )
            await search( ...options[2] )
            await search( ...options[3] )
            
        }

        await search(0, init_x, init_y);

        // console.log('map.get', target_x+'_'+target_y, 'in', Array.from(map.values()).map( t => t.x+'_'+t.y ).join(', '))
        let dest = map.get(target_x+'_'+target_y);
        
        const plan = [];

        while ( dest.previous_tile ) {
            // console.log( dest.cost_to_here + ' move ' + dest.action_from_previous + ' ' + dest.x + ',' + dest.y );
            plan.unshift( { step: dest.cost_to_here, action: dest.action_from_previous, current: {x: dest.x, y: dest.y} } )
            dest = dest.previous_tile;
        }
        
        map.forEach( (tile) => {
            delete tile.cost_to_here;
            delete tile.previous_tile;
            delete tile.action_from_previous;
            delete tile.locked;
        } )

        return plan;

    }

}



