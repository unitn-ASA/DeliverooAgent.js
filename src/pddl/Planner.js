import PddlDomain from './PddlDomain.js'
import PddlProblem from './PddlProblem.js'
import Executor from './Executor.js'



/**
 * Abstract class.
 * abstract doPlan(pddlDomain, pddlProblem)
 */
export default class Planner extends Executor {
    
    constructor ( ...pddlActionClasses ) {
        super( ...pddlActionClasses )
        for ( let actionClass of pddlActionClasses ) {
            this.addAction(actionClass)
        }
    }

    actions = {}

    addAction (actionClass) {
        this.actions[actionClass.name.toLowerCase()] = actionClass
    }

    getAction (name) {
        return this.actions[name]
    }

    static nextId = 0;

    async plan (beliefs, goals) {
        
        var pddlDomain = new PddlDomain('d'+Planner.nextId)
        pddlDomain.addAction(...Object.values(this.actions))
        var domainFile = await pddlDomain.saveToFile()

        var pddlProblem = new PddlProblem('p'+Planner.nextId)
        pddlProblem.addObject(...beliefs.objects) //'a', 'b'
        pddlProblem.addInit(...beliefs.entries.filter( ([fact,value])=>value ).map( ([fact,value])=>fact ))//(...beliefs.literals)
        pddlProblem.addGoal(...goals)
        var problemFile = await pddlProblem.saveToFile()

        Planner.nextId++;

        return await this.constructor.doPlan(pddlDomain, pddlProblem)

    }

    async planAndExec (beliefs, goals) {
        
        var plan = await this.plan(beliefs, goals);
        return await this.exec( plan );

    }

}

// var kitchenAgent = new Agent('kitchen')
// kitchenAgent.intentions.push(DimOnLight)
// kitchenAgent.intentions.push(Blackbox)

// var blackbox = new Blackbox(kitchenAgent, new LightOn({l: 'light1'}), './tmp/domain-lights.pddl', './tmp/problem-lights.pddl')
// blackbox.run()

