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
header: 'Reactive Agents · [DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js) · [Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)'
footer: 'Marco Robol - University of Trento, A.Y. 2026/2027 - Autonomous Software Agents'
---

<!-- _class: lead -->

# Implementing the BDI control loop

Implementing the BDI control loop for the Deliveroo.js environment

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)

---

## Reactive Agents

A **reactive agent** maps the current perception directly to an action:

- no long-term plan, no complex internal model of the world
- every `onSensing` event (or loop iteration) re-evaluates **what to do now**
- simple and robust, but **myopic**: it reacts to what it sees, not to what it wants to achieve

Files in this lab:

1. `move_in_circle.js` – sequencing actions with `await`
2. `one_move.js` – a single reactive rule: step on an adjacent parcel and pick it up
3. `blind_move.js` – move toward a target, ignoring obstacles
4. `blind_pick.js` – combine the two: chase the nearest parcel

---

## `move_in_circle.js` – Awaiting actions

```javascript
while ( true ) {
    try {
        const start = Date.now();
        await socket.emitMove('right');
        await socket.emitMove('down');
        await socket.emitMove('left');
        await socket.emitMove('up');
        console.log('moving in circle took on avg',
            (Date.now() - start) / 4, 'ms per move');
    } catch (e) {
        console.error('error while moving in circle', e);
    }
}
```

- Every action returns a **Promise** resolved when the server **acknowledges** it
- `await` makes actions **sequential**: the next move starts only when the previous completed
- Measuring the elapsed time shows the **duration of a move**, set by the server configuration

---

## `one_move.js`
Implement an agent that:
- when 1 tile away from a parcel, reactively moves on the parcel tile and pick it up

---

## `one_move.js` – Tracking myself

```javascript
const me = {};

socket.onSensing( ( { self } ) => {
    if ( ! self ) return;
    const {id, name, x, y, score} = self;
    me.id = id;
    me.name = name;
    if ( x != undefined ) me.x = x;
    if ( y != undefined ) me.y = y;
    me.score = score;
} )
```

- `self` is my own agent as seen by the server
- Coordinates are updated only when defined
  - compare with `undefined`, not truthiness: `0` is a valid coordinate!

---

## `one_move.js` – The reactive rule

```javascript
var control = false;

socket.onSensing( async ( sensings ) => {
    if ( control ) {
        return;
    }
    control = true;
    for ( let p of sensings.parcels ) {
        if ( ! p.carriedBy ) {
            // ... move on the parcel, then pick it up (next slide)
        }
    }
    control = false;
} )
```

- `onSensing` callbacks are **not awaited**: a new event can arrive while we are still acting
- The `control` flag is a simple **lock**: perceptions received while acting are **skipped**, avoiding concurrent and conflicting moves

---

## `one_move.js` – Acting

```javascript
            let direction;
            if      ( me.x == p.x-1 && me.y == p.y ) direction = 'right';
            else if ( me.x == p.x+1 && me.y == p.y ) direction = 'left';
            else if ( me.y == p.y-1 && me.x == p.x ) direction = 'up';
            else if ( me.y == p.y+1 && me.x == p.x ) direction = 'down';

            if ( direction ) {
                // emitMove resolves to the new position, or false if the move failed
                const moved = await socket.emitMove( direction );
                if ( moved ) {
                    me.x = moved.x;
                    me.y = moved.y;
                }
            }

            if ( me.x == p.x && me.y == p.y ) {
                await socket.emitPickup();
            }
```

- **Condition → action**: if the parcel is on an adjacent tile, step toward it
- The position returned by `emitMove` updates `me` **immediately**, so the pickup check does not depend on the next sensing event

---

## `blind_move.js`
Implement an agent that:
- moves in the direction of a given target, moving alternatively on x and y in the direction of the target

---

## `blind_move.js` – Waiting for my position

```javascript
const me = {};

await new Promise( res => {
    socket.onSensing( ( { self } ) => {
        if ( ! self ) return;
        const {id, name, x, y, score} = self;
        me.id = id; me.name = name; me.x = x; me.y = y; me.score = score;
        res(null);
    } )
} );

const target = {
    x: Number.parseInt(process.argv[2]),
    y: Number.parseInt(process.argv[3])
};
if ( Number.isNaN(target.x) || Number.isNaN(target.y) ) {
    console.error('Usage: node blind_move.js <x> <y>');
    process.exit(1);
}
```

- Top-level `await`: the agent **does not start** until it knows its own position
- The listener stays registered, so `me` keeps being updated afterwards
- The target is read from the command line: `node blind_move.js 5 3`

---

## `blind_move.js` – Moving toward the target

```javascript
while ( me.x != target.x || me.y != target.y ) {

    var m = new Promise( res => {
        const listener = ( { self } ) => {
            if ( ! self || self.x % 1 != 0 || self.y % 1 != 0 ) return;
            socket.off( "sensing", listener );
            res();
        };
        socket.onSensing( listener );
    } );

    if ( me.x < target.x )      await socket.emitMove('right');
    else if ( me.x > target.x ) await socket.emitMove('left');

    if ( me.y < target.y )      await socket.emitMove('up');
    else if ( me.y > target.y ) await socket.emitMove('down');

    await m;
    console.log(me.name, 'Moved to', me.x, me.y);
}
```

---

## `blind_move.js` – Explanation

- Each iteration tries **one step on x** and **one step on y**, alternating axes
- Promise `m` resolves at the next sensing event where I am on an **integer tile**, so `me` is up to date before the next decision
- **Blind**: the agent ignores the map
  - a wall or another agent makes `emitMove` fail, and the agent keeps retrying the same move forever
  - there is no path planning: this is addressed in later labs

---

## `blind_pick.js`
Implement an agent that:
- combines the two from above
- when a parcel is perceived, reactively moves toward it and then pick it up
    - what happens in the case of 2 parcels observed?
    - what happens when another parcel is observed meanwhile moving?
        - what if the other parcel is more valuable (and maybe closer)?
        - or on the opposite if the other parcel is distant and less valuable?

---

## `blind_pick.js` – Perceiving parcels

```javascript
const parcels = new Map();

socket.onSensing( async ( sensing ) => {
    // reactive agent: beliefs about parcels are only what is currently perceived
    parcels.clear();
    for ( let p of sensing.parcels ) {
        parcels.set( p.id, p );
    }
} )
```

- Parcels are indexed by `id`
- The map is **rebuilt** at every sensing event: parcels picked up by others or gone out of view are forgotten
- Compare with Lab 2: here there is **no memory**, which is the typical choice of a purely reactive agent

---

## `blind_pick.js` – One step at a time

```javascript
async function blindMove ( target ) {
    var m = new Promise( res => { /* next sensing on an integer tile */ } );

    if ( me.x < target.x )      await socket.emitMove('right');
    else if ( me.x > target.x ) await socket.emitMove('left');

    if ( me.y < target.y )      await socket.emitMove('up');
    else if ( me.y > target.y ) await socket.emitMove('down');

    await m;
}
```

- Same logic as `blind_move.js`, wrapped in a function performing **one step** toward the target
- Moving one step at a time lets the agent **reconsider** its target after every step

---

## `blind_pick.js` – The control loop

```javascript
while (true) {
    await new Promise( res => setTimeout( res, 100 ) );
    if ( ! me.id || ! parcels.size ) continue;

    const nearest = Array.from( parcels.values() )
    .filter( p => ! p.carriedBy )
    .sort( (a, b) => distance( me, a ) - distance( me, b ) )
    .shift();

    if ( ! nearest ) { console.log( 'no parcels' ); continue; }

    await blindMove( nearest )

    // pick up only once on the parcel tile, otherwise re-evaluate the nearest parcel
    if ( me.x == nearest.x && me.y == nearest.y ) {
        const picked = await socket.emitPickup();
        console.log( 'picked up', picked.map( p => p.id ).join( ' ' ) );
    }
}
```

---

## `blind_pick.js` – Answering the questions

- **2 parcels observed**: the agent goes for the **nearest** free one (`! p.carriedBy`)
- **A new parcel appears while moving**: the target is re-selected after **every step**, so the agent switches to it if it is closer
- **More valuable vs. closer**: `reward` is ignored, only distance matters
  - a better score function could weigh reward against distance, e.g. `p.reward - distance(me, p)`
- **Distant and less valuable**: never preferred, since the nearest wins
- Downside: two parcels at the same distance can make the agent **oscillate** between them; committing to a target is the topic of the **BDI** control loop (intentions)

---

<!-- _class: lead -->

# Questions?

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)
