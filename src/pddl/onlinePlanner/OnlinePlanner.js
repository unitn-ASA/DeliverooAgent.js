import PddlDomain from '../PddlDomain.js'
import PddlProblem from '../PddlProblem.js'
import Planner from '../Planner.js'
import fetchSolver from './fetchSolver.js'

// export default class OnlinePlanner extends Planner {
    
//     /**
//      * 
//      * @param {PddlDomain} pddlDomain 
//      * @param {PddlProblem} pddlProblem 
//      * @returns { [ { parallel: boolean, action: string, args: [string] } ] }
//      */
//     async doPlan (pddlDomain, pddlProblem) {
//         return fetchSolver( pddlDomain.content, pddlProblem.content )
//     }

// }

/**
 * 
 * @param {PddlDomain} pddlDomain 
 * @param {PddlProblem} pddlProblem 
 * @returns { [ { parallel: boolean, action: string, args: [string] } ] }
 */
export default async function (pddlDomain, pddlProblem) {
    return fetchSolver( pddlDomain.content, pddlProblem.content )
}
