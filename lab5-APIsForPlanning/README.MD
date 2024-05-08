
# APIs for Planning

`npm install @unitn-asa/pddl-client`@0.0.37

Based on https://solver.planning.domains:5001.

Checkout https://github.com/AI-Planning/planning-as-a-service to install a local instance of the planning service.

How to use:

`import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";`

## 1. `onlineSolver` and `PddlExecutor`

- `onlineSolver`: generate a plan using the online solver and decode retrieved plan.

- `PddlExecutor`: execute the plan using specific executors for each action.

```javascript
import { onlineSolver, PddlExecutor } from "@unitn-asa/pddl-client";
var plan = await onlineSolver(domain, problem);
const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (l)=>console.log('exec lighton '+l) } );
pddlExecutor.exec( plan );
```

## 2. `PddlProblem`

- `PddlProblem`: encode problem into pddl format.

```javascript
import { PddlProblem } from "@unitn-asa/pddl-client";
var pddlProblem = new PddlProblem(
    'lights',
    'light1 light2',
    '(switched-off light1) (switched-on light1)',
    'and (switched-on light1) (switched-on light2)'
)
let problem = pddlProblem.toPddlString();
console.log( problem );
```

## 3. `Beliefset`

- `Beliefset`: representation of beliefset based on predicate, ready to be converted into pddl

```javascript
const myBeliefset = new Beliefset();
myBeliefset.declare( 'switched-off light1' );
myBeliefset.undeclare( 'switched-on light1' );
myBeliefset.declare( 'switched-off light2' );

var pddlProblem = new PddlProblem(
    'lights',
    myBeliefset.objects.join(' '),
    myBeliefset.toPddlString(),
    'and (switched-on light1) (not (switched-on light2))'
)
```

## 4. `PddlDomain` and `PddlAction`

```javascript
const lightOn = new PddlAction(
    'lightOn',
    '?l',
    'and (switched-off ?l)',
    'and (switched-on ?l) (not (switched-off ?l))',
    async ( l ) => console.log( 'exec lightOn', l )
);
console.log( lightOn.toPddlString() )
console.log( PddlAction.tokenize( lightOn.precondition ) )
console.log( PddlAction.tokenize( lightOn.effect ) )

var pddlDomain = new PddlDomain( 'lights', lightOn, ... )

let domain = pddlDomain.toPddlString();
var plan = await onlineSolver( domain, problem );
```

