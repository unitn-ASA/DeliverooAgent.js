---
marp: true
theme: default
paginate: true
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  :root {
    --color-primary: #00C853;
    --color-secondary: #6C63FF;
    --color-accent: #FF6D00;
  }
  section {
    font-family: 'Inter', sans-serif;
  }
  h1 {
    color: var(--color-primary);
  }
  h2 {
    color: var(--color-secondary);
  }
  strong {
    color: var(--color-accent);
  }
  code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background: #e8f3ff;
    color: #2c2c2c;
    padding: 15px;
    border-radius: 8px;
  }
backgroundImage: url('https://marp.app/assets/hero-background.svg')
header: 'Belief Revision · [DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js) · [Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)'
footer: 'Marco Robol - University of Trento, A.Y. 2026/2027 - Autonomous Software Agents'
---

<!-- _class: lead -->

# Belief Revision

Belief Revision for the Deliveroo.js environment

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)

---

## Why Belief Revision?

An agent only **perceives what is within its observation distance**.

- What it senses at each `onSensing` event is a **partial snapshot** of the world
- The **beliefset** is the agent's internal model of the world, built from these snapshots
- **Belief revision** = deciding how new perceptions update (or overwrite, or invalidate) what the agent already believes

We explore three increasingly rich strategies:

1. `no_memory.js` – keep only the latest perception
2. `memory.js` – keep the full perception history
3. `uncertainty.js` – reason about what is *no longer* perceived

---

## `no_memory.js`
Implement an agent that:
- perceive other agents and overwrite previously perceived agents beliefset
- print all perceived agents as `${name}(${x},${y})`

---

## `no_memory.js` – Setup

```javascript
const socket = DjsConnect();

const beliefset = new Map();

socket.onConfig( config => {
    console.log('Agents observation distance:',
        config.GAME.player.observation_distance);
})

socket.onSensing( ( { self: me, positions } ) => {
    console.log('Sensed tiles:', positions?.length);
})
```

- `DjsConnect()` reads `HOST` and `TOKEN` from `.env`
- The **beliefset** is a `Map` indexed by agent `id`
- `sensing.positions` lists the **tiles currently within my sensing area**: anything outside them is not sensed
- `config.GAME.player.observation_distance` gives the **sensing radius**; `positions` is more convenient, since it gives the exact sensed tiles without computing distances

---

## `no_memory.js` – Overwriting beliefs

```javascript
socket.onSensing( ( sensing ) => {
    for ( let a of sensing.agents ) {
        beliefset.set( a.id, a );          // overwrite previous belief
    }
    let prettyPrint = Array
    .from(beliefset.values())
    .map( ({name,x,y,score}) => `${name}(${score}):${x},${y}` )
    .join(' ');
    console.log(prettyPrint)
} )
```

- Each sensed agent **replaces** the previous entry with the same `id`
- Agents that leave the observation area are **never removed**: their last known position stays in the beliefset, with no indication that it may be outdated

---

## `memory.js`
Implement an agent that:
- perceive agents and create a new entry in the beliefset including the timestamp about perceiving time
- print, for each perceived agent, perception history as `${id}@${Date.now()-start}:${x},${y} @${previousTime}:${x},${y} ...`

---

## `memory.js` – A history per agent

```javascript
/** @type {Map<string,{id, name, x, y, score, timestamp, direction}[]>} */
const beliefset = new Map();
const start = Date.now();
```

- Each agent `id` now maps to an **array of logs** (its perception history)
- `start` lets us store **relative timestamps** (ms since the agent started)

---

## `memory.js` – Appending perceptions

```javascript
socket.onSensing( ( sensing ) => {
    const timestamp = Date.now() - start;
    for ( let a of sensing.agents ) {
        if ( ! beliefset.has( a.id ) )
            beliefset.set( a.id, [] )
        const log = { id: a.id, name: a.name, x: a.x, y: a.y,
                      score: a.score, timestamp, direction: 'none' }
        const logs = beliefset.get( a.id );
        if ( logs && logs.length>0 ) {
            var previous = logs[logs.length-1];
            if ( previous.x < a.x ) log.direction = 'right';
            else if ( previous.x > a.x ) log.direction = 'left';
            else if ( previous.y < a.y ) log.direction = 'up';
            else if ( previous.y > a.y ) log.direction = 'down';
        }
        beliefset.get( a.id )?.push( log );
    }
```

- New perceptions are **appended**, never overwritten
- Comparing with the **previous log** we infer a new belief: the movement `direction`

---

## `memory.js` – Is my belief still observed?

```javascript
    for ( const logs of beliefset.values() ) {
        const {id,name,x,y,direction} = logs[logs.length-1]
        const inView = !! sensing.positions?.some(
            p => p.x == Math.round(x) && p.y == Math.round(y) );
        const history = logs.slice().reverse()
            .map( ({timestamp,x,y}) => `@${timestamp}:${x},${y}` ).join(' ');
        console.log( `${id}${history} (${name}, ${direction}, ${inView})` );
    }
} )
```

- For each agent we print its **perception history**, most recent first: `id@t:x,y @t:x,y ...`
- `inView` tells whether the last known position is one of the **sensed tiles** (`sensing.positions`)
  - `true` and not sensed anymore → the belief is **stale**: the agent has moved away
  - `false` → the belief **cannot be verified**, it may still be valid

---

## `uncertainty.js`
    Implement belief revision so that:
    - say Hello to agents that are met for the first time:
        `console.log( 'Hello', a.name )`
    - for agents already met in the past:
        - case 1: I was seeing him also last time
            - But he moved:
                `console.log( 'You are moving', a.name )`
            - Or he did not moved:
                `console.log( 'You are still in same place as before' )`
        - case 2: I see him again after some time
            - Seems that he moved:
                `console.log( 'Welcome back, seems that moved', a.name )`
            -  As far as I remember he is still here:
                `console.log( 'Welcome back, seems you are still here as before', a.name )`
    - I am perceiving (eventually no one is around me) and seems that I am not seeing him anymore
        - He just went off, right now:
            `console.log( 'Bye', a.name )`
        - It's already a while since last time I saw him:
            `console.log( 'Its a while that I don\'t see', a.name, 'I remember him in', a.x, a.y )`
        - I'm back where I remember I saw him last time:
            `console.log( 'I remember', a.name, 'was here, but I cannot see him anymore. Forget him.' )`

---

## `uncertainty.js` – Representing "lost" agents

```javascript
/** @type {Map<string,[{name:string,x:number,y:number}|string]>} */
const beliefset = new Map();

socket.onSensing( ( sensing ) => {
    // Is tile x,y currently within my sensing area?
    const isSensed = ( {x, y} ) =>
        !! sensing.positions?.some( p => p.x == x && p.y == y );
```

- The history of each agent mixes two kinds of entries:
  - an **object** `{name, x, y}` → "I saw him here"
  - the **string** `'lost'` → "from here on, I am not seeing him"
- So `typeof(last) === 'object'` means *"I was seeing him last time"*
- `isSensed` checks a tile against `sensing.positions`, the tiles I can currently see

---

## `uncertainty.js` – Filtering perceptions

```javascript
    for (const a of sensing.agents) {

        // I don't know where he is, I can't do anything with him
        if ( a.x == undefined || a.y == undefined )
            continue;

        // the agent is moving between two tiles, skip him
        if ( a.x % 1 != 0 || a.y % 1 != 0 )
            continue;
```

- Compare with `undefined`, not truthiness: `0` is a valid coordinate!
- While moving, agents have **fractional coordinates** (e.g. `0.6`, `0.4`)
- We only revise beliefs on **integer tiles**, to avoid treating half-steps as real moves

---

## `uncertainty.js` – First meeting

```javascript
        if ( ! beliefset.has(a.id) ) {
            console.log( 'Hello', a.name );
            beliefset.set( a.id, [{ name: a.name, x: a.x, y: a.y }] );
        } else {
            const history = beliefset.get( a.id )
            const last = history[history.length-1]
            const second_last = (history.length>1
                ? history[history.length-2] : 'no knowledge')
```

- Unknown `id` → **new belief**, the history starts with the current position
- Otherwise we look at the **last** entry (seen or `'lost'`) and the **second last** entry (where he was before being lost)

---

## `uncertainty.js` – Case 1: still seeing him

```javascript
            if ( typeof(last) === 'object' ) { // I was seeing him also last time
                if ( last.x != a.x || last.y != a.y ) { // But he moved
                    history.push( { name: a.name, x: a.x, y: a.y } )
                    console.log( 'You are moving', a.name )
                } else { // Still here but not moving
                    console.log( 'You are still in same place as before' )
                }
            }
```

- Seen last time **and** now → continuous observation, no uncertainty
- A new entry is added **only if the position changed**, so the history records **moves**, not every sensing event

---

## `uncertainty.js` – Case 2: seeing him again

```javascript
            else if ( typeof(second_last) === 'object' ) { // last == 'lost'
                history.push( { name: a.name, x: a.x, y: a.y } )
                if ( second_last.x != a.x || second_last.y != a.y ) {
                    console.log( 'Welcome back, seems that you moved', a.name )
                } else {
                    console.log( 'Welcome back, seems you are still here as before', a.name )
                }
            }
```

- `last` is `'lost'`: the agent **re-enters** my observation area
- Comparing with the position **before he was lost** (`second_last`) we revise our belief: did he move while out of sight?

---

## `uncertainty.js` – Not seeing him anymore

```javascript
    for ( const [id,history] of beliefset.entries() ) {
        const last = history[history.length-1]
        const second_last = (history.length>1
            ? history[history.length-2] : 'no knowledge')

        if ( ! sensing.agents.map( a => a.id ).includes( id ) ) {
            if ( typeof(last) === 'object' ) {          // Just went off
                history.push( 'lost' );
                console.log( 'Bye', last.name );
            } else if ( typeof(second_last) === 'object' ) { // a while ago
                console.log( 'Its a while that I don\'t see', second_last.name,
                    'I remember him in', second_last.x, second_last.y );
                if ( isSensed(second_last) ) {
                    console.log( 'I remember', second_last.name,
                        'was here, but I cannot see him anymore. Forget him.' );
                    beliefset.delete(id)
                }
            }
        }
    }
```

---

## `uncertainty.js` – Explanation

- We iterate over **all beliefs**, not over the sensed agents: we need to reason about **missing** perceptions
- **Just went off**: last entry was a position → append `'lost'`
- **A while ago**: already `'lost'` → we still remember his last known position (`second_last`)
- **Forget him**: the tile where I remember him is among the sensed `positions`, but he is not there → the belief is **contradicted** by my perception, so it is removed

Key idea: absence of a perception is information too, but only **inside** the area I can observe.

---

<!-- _class: lead -->

# Questions?

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)
