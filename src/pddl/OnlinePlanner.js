const Intention = require('../bdi/Intention')
const PddlDomain = require('./PddlDomain')
const PddlProblem = require('./PddlProblem')
const pddlActionGoal =  require('./actions/pddlActionGoal')
const PlanningGoal =  require('./PlanningGoal')
const fetch = require('node-fetch') // import fetch from 'node-fetch';



function setup (intentions = []) {

    var OnlinePlanning = class extends Intention {
        
        constructor (agent, goal) {
            super(agent, goal)
            this.plan = []; // [{parallel: true, goal: goalInstance}]
        }

        static actions = {}

        static addAction (intentionClass) {
            this.actions[intentionClass.name.toLowerCase()] = intentionClass
        }

        static getAction (name) {
            return this.actions[name]
        }

        static applicable (goal) {
            return goal instanceof PlanningGoal
        }

        async doPlan (domainFile, problemFile) {

            // console.log(JSON.stringify( {domain: domainFile.content, problem: problemFile.content} ))
            var res = await fetch("http://solver.planning.domains/solve", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify( {domain: domainFile.content, problem: problemFile.content} )
            }).then(function (res) {
                return res.json();
            }).then(function (res) {
                return res;
            })
            
            // console.log(res);
            // console.log(res.result.plan);

            if (!res.result.plan && res.result.output.split('\n')[0] != ' --- OK.') {
                this.log('No plan found')
                this.log(res)
                throw new Error('Plan not found');
            }

            this.log('Plan found:')
            var planStruct = []

            if (res.result.plan) {
                for (let step of res.result.plan) {
                    let s = step.name.replace('(','').replace(')','').split(' ')
                    this.log('- ' + step.name)
                    planStruct.push(s);
                }
            }

            // var previousNumber = 0
            for (let line of planStruct) {
                // var number = line.shift()
                var action = line.shift()
                var args = line
                // console.log(number, action, args)
                var intentionClass = this.constructor.getAction(action)
                var mappedArgs = {}
                for (let index = 0; index < intentionClass.parameters.length; index++) {
                    let k = intentionClass.parameters[index]
                    let v = args[index]
                    mappedArgs[k] = v
                }
                var intentionInstance = new intentionClass(this.agent, new pddlActionGoal(mappedArgs) )
                this.plan.push({parallel: false/*number==previousNumber*/, intention: intentionInstance});
            }
            
            return;
        }

        *exec () {
            
            var pddlDomain = new PddlDomain(this.agent.name)
            pddlDomain.addAction(...Object.values(this.constructor.actions))
            var domainFile = yield pddlDomain.saveToFile()

            var pddlProblem = new PddlProblem(this.agent.name)
            pddlProblem.addObject(...this.agent.beliefs.objects) //'a', 'b'
            pddlProblem.addInit(...this.agent.beliefs.entries.filter( ([fact,value])=>value ).map( ([fact,value])=>fact ))//(...this.agent.beliefs.literals)
            pddlProblem.addGoal(...this.goal.parameters.goal)
            var problemFile = yield pddlProblem.saveToFile()

            yield this.doPlan(pddlDomain, pddlProblem)

            var previousStepGoals = []

            for (const step of this.plan) {
                if (step.parallel) {
                    this.log('Starting concurrent step ' + step.intention.toString())
                }
                else {
                    yield Promise.all(previousStepGoals)
                    previousStepGoals = []
                    this.log('Starting sequential step ' + step.intention.toString())
                }
                previousStepGoals.push(
                    step.intention.run().catch( err => {
                        throw err//new Error('Step failed');
                    } )
                )
            }

            // wait for last steps to complete before finish blackbox plan execution intention
            yield Promise.all(previousStepGoals)

        }

    } // end of class Blackbox extends Intention

    for ( let intentionClass of intentions ) {
        OnlinePlanning.addAction(intentionClass)
    }

    return {OnlinePlanning};
}



// var kitchenAgent = new Agent('kitchen')
// kitchenAgent.intentions.push(DimOnLight)
// kitchenAgent.intentions.push(Blackbox)

// var blackbox = new Blackbox(kitchenAgent, new LightOn({l: 'light1'}), './tmp/domain-lights.pddl', './tmp/problem-lights.pddl')
// blackbox.run()



module.exports = setup