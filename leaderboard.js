import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    // 'https://deliveroojs2.rtibdi.disi.unitn.it', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YWM0ZiIsIm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NDEyMjg1NX0.Xqhv3O9cr-dFPDGp2lIuo1nIBOq2gKGAULIgWDv0vgA'
    'https://deliveroojs.rtibdi.disi.unitn.it', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU2ZTJiZCIsIm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NDcxMTY4OH0.Dbj-5UZ8TLRNcCEHbG9-NA3ekQ2LYT7w5VtqxDssYqY'
    // 'http://localhost:8080', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEyNzhiOSIsIm5hbWUiOiJnb2QiLCJ0ZWFtSWQiOiJmODA0MWUiLCJ0ZWFtTmFtZSI6ImdvZCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0MDA2NDUyM30.dyQHtNjjmmHd4OrXbfhi2CjMvISqdihrAQxxHkMLlmU'
    // 'http://localhost:8080/?name=ddos', ''
    // 'https://deliveroojs.onrender.com/?name=ddos', ''
    // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', ''

    // 'http://rtibdi.disi.unitn.it:8080',
    // god a7de10b05d1 @ http://rtibdi.disi.unitn.it:8080
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE3ZGUxMGIwNWQxIiwibmFtZSI6ImdvZCIsImlhdCI6MTcxNTA3ODg2MX0.fB4OowVYwujN3miDWrPgvD35iY7QQW3cy6I8xLkK-ps'
)

/**
 * @type {Map<string,{id,name,x,y,score}>}
 */
const agents = new Map();

/**
 * @type {Map<string,{teamName,score,pti:number,agents:[{id,name,score}]}}
 */
const teams = new Map();

/**
 * @type {Date}
 */
const start = new Date();

client.onAgentsSensing( ( sensed ) => {

    for ( let a of sensed ) {
        agents.set( a.id, a );
    }

    // update leaderboard
    teams.clear();
    for ( let a of agents.values() ) {
        let teamName = a.name.split( '_' )[ 0 ];
        let agentPostfix = a.name.split( '_' )[ 1 ];
        a.teamName = teamName;
        a.agentPostfix = agentPostfix || '?';

        if ( ! teams.has( teamName ) ) {
            teams.set( teamName, { teamName, score: a.score, agents:[a] } );
        } else {
            teams.get( teamName ).score += a.score;
            teams.get( teamName ).agents.push( a );
        }
    }

    const sortedTeams = Array.from( teams.values() )
    .sort( (a,b) => b.score - a.score ) // sort by score, higher to lower 
    .map( (team,index,teams) => {
        team.pti = teams.length - index;               // pti from n down to 1
        return team;
    } );

    const now = new Date();
    // compute time from now since start as mm:ss
    const mmss = `${Math.floor((now-start)/60000)}:${(Math.floor((now-start)/1000)%60).toString().padStart(2,'0')}`;

    // clear console
    console.clear();

    console.log( `Leaderboard ${mmss}\n` + sortedTeams.map( (t,index) => `${index+1}°\t${t.pti}pts\t${t.teamName}(${t.score})\t${t.agents.map(a=>`${a.agentPostfix}(${a.score})`).join('\t')}` ).join( '\n' ) );
    
} )


