import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/client").IOAgent} IOAgent */

const client = DjsConnect();

/**
 * @type {Map<string,IOAgent&{agentPostfix:string}>}
 */
const agents = new Map();

/**
 * @type {Map<string,{teamName:string,score:number,pti:number,agents:[IOAgent]}>}
 */
const teams = new Map();

/** @type {number} */
const start = Date.now();

client.onSensing( ( sensed ) => {

    for ( let a of sensed.agents ) {
        agents.set( a.id, {
            ...a,
            agentPostfix: a.name.split( '_' )[ 1 ] || '?'
        } );
    }

    // update leaderboard
    teams.clear();
    for ( let a of agents.values() ) {
        let teamName = a.name.split( '_' )[ 0 ];
        let agentPostfix = a.name.split( '_' )[ 1 ];
        a.teamName = teamName;
        a.agentPostfix = agentPostfix || '?';

        const team = teams.get( teamName );
        if ( team ) {
            team.score += a.score;
            team.agents.push( a );
        } else {
            teams.set( teamName, { teamName, score: a.score, agents:[a], pti:0 } );
        }
    }

    const sortedTeams = Array.from( teams.values() )
    .sort( (a,b) => b.score - a.score ) // sort by score, higher to lower 
    .map( (team,index,teams) => {
        team.pti = teams.length - index;               // pti from n down to 1
        return team;
    } );

    /** @type {number} */
    const now = Date.now();
    // compute time from now since start as mm:ss
    const mmss = `${Math.floor((now-start)/60000)}:${(Math.floor((now-start)/1000)%60).toString().padStart(2,'0')}`;

    // clear console
    console.clear();

    console.log( `Leaderboard ${mmss}\n` + sortedTeams.map( (t,index) => `${index+1}°\t${t.pti}pts\t${t.teamName}(${t.score})\t${t.agents.map(a=>`${a.agentPostfix}(${a.score})`).join('\t')}` ).join( '\n' ) );
    
} )


