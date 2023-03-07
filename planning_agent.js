import PddlDomain from "./src/pddl/PddlDomain.js";
import PddlProblem from "./src/pddl/PddlProblem.js";
import Beliefset from "./src/bdi/Beliefset.js";
import Planner from "./src/pddl/Planner.js";

import OnlinePlanner from "./src/pddl/onlinePlanner/OnlinePlanner.js";
Planner.doPlan = OnlinePlanner;


class LightOn {

    static parameters = ['l']
    static precondition = [ ['switched-off', 'l'] ]
    static effect = [ ['switched-on', 'l'], ['not switched-off', 'l'] ]
    
    async exec (...args) {
        console.log( 'LightOn', ...args )
    }

}

const myBeliefset = new Beliefset()
myBeliefset.declare( 'switched-off light1' )

const myGoal = [ 'switched-on light1' ]

const myPlanner = new Planner( LightOn );

// myPlanner.planAndExec(myBeliefset, myGoal);
const plan = await myPlanner.plan( myBeliefset, myGoal );
myPlanner.exec( plan );
