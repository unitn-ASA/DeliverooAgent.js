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
header: 'Deliveroo.js APIs · [DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js) · [Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)'
footer: 'Marco Robol - University of Trento, A.Y. 2026/2027 - Autonomous Software Agents'
---

<!-- _class: lead -->

# Deliveroojs APIs
## Lab 1: Introduction to Agent Development

Building autonomous agents for the Deliveroo.js environment

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)

---

## Learning Objectives

In this lab, we will learn how to interact with the Deliveroojs APIs, implementing a script that acts as a simple agent:

- **Navigate** along a predefined path
- **Pick up** parcels from the environment
- **Deliver** parcels to their destinations

### Deliveroo.js

Deliveroo.js it's a **Grid-Based** parcel collection videogame. You can play in **Multi-Player** from your browser or develop your own Autonomous Agent that plays in your place.

---

## Where to play

Play on the web at [https://deliveroojs.azurewebsites.net/](https://deliveroojs.azurewebsites.net/), or preview the latest `develop` version at [https://deliveroojsdev.azurewebsites.net/](https://deliveroojsdev.azurewebsites.net/)

Within unitn network at https://deliveroojs.bears.disi.unitn.it/ (Requires unitn VPN which can be installed following instructions available at https://servicedesk.unitn.it/sd/it/service/vpn?id=unitrento_v2_service_card&sys_id=e5a898fec35bfd104cbb7055df013171).

To run locally:

1. `git clone https://github.com/unitn-ASA/Deliveroo.js.git`
1. `cd Deliveroo.js`, `npm run build`, `npm start`

---

## How to play

    As user:      `a`: left, `s`: down, `d`: right, `w`: up,
                  `q`: pickup, `e`: putdown
    As an admin:  press `space` to create or dispose parcels
                  and numeric keys to modify tiles.

## To start developing your own scripts

- Create an empty npm project `npm init`
- Install the SDK npm package `npm install @unitn-asa/deliveroo-js-sdk`
- Import utilities classes and types from the sdk package
  ```javascript
  // See https://github.com/unitn-ASA/Deliveroo.js/tree/master/packages
  import { DjsConnect, DjsClientSocket } from "@unitn-asa/deliveroo-js-sdk/client";
  ```
- Examples are available at [github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js).

---

## Deliveroo.js SDK Architecture

The SDK provides three main client classes:

### DjsClientSocket
Real-time Socket.io client for game actions and events

### DjsRestClient
HTTP RESTful API for CRUD operations

### DjsConnect
Factory class for authentication and connection

---

```
DjsConnect
    │
    ├─→ DjsClientSocket (WebSocket)
    │       ├─ Game Actions (move, pickup, putdown)
    │       └─ Event Listeners (sensing, messages)
    │
    └─→ DjsRestClient (HTTP)
            └─ Admin Operations
```

---

## Connection & Authentication

Method 1: Hardcoded
```javascript
const socket = DjsConnect( 'http://localhost:8080', 'YOUR_TOKEN' );
```

Method 2: Environment Variables
```bash
# This is file .env
HOST=localhost:8080
TOKEN=your_token_here
# or
NAME=MyAgentName
```
```javascript
import 'dotenv/config'
const socket = DjsConnect(); // reads HOST, TOKEN and NAME from process.env
```

- With a `TOKEN` you reconnect as the **same agent**; with only a `NAME` a **new agent** is created
- `import 'dotenv/config'` loads the `.env` file from the **current directory** into `process.env`

---

## Key Game Actions

All actions return **Promises** for async/await usage:

### Movement
```javascript
const result = await socket.emitMove('up'); // 'right', 'left', 'down'
// Returns: {x, y} on success, false on failure
```

### Pickup Parcels
```javascript
const parcels = await socket.emitPickup();
// Returns: [{id}, ...] the picked up parcels
```

### Drop Parcels
```javascript
const dropped = await socket.emitPutdown(selected);
// selected: array of parcel IDs (or empty / undefined for all)
// Returns: [{id}, ...] the dropped parcels
```

Each action resolves only when the server **acknowledges** it: `await` waits for the action to be completed.

---

## Event Listeners

The API uses Node.js **EventEmitter** pattern:

```javascript
// Game configuration
socket.onConfig( (config) => { /* ... */ });

// Map information
socket.onMap( (width, height, tiles) => { /* ... */ });
socket.onTile( ({x, y, type}) => { /* ... */ });

// Sensing, including myself (self)
socket.onSensing( ({frame, self, positions, agents, parcels, crates, entities}) => { /* ... */ });

// Connection
socket.onConnect( () => { /* ... */ });
socket.onDisconnect( () => { /* ... */ });
```

- `onXxx( cb )` is a typed shortcut for `socket.on( 'xxx', cb )`
- My own agent is `sensing.self`; it is also available as a Promise: `const me = await socket.me`

---

## `demo_EventEmitter.js` – Events and acknowledgements

```javascript
import { EventEmitter } from 'events';
const eventEmitter = new EventEmitter();

eventEmitter.on('start', (start, end, ack) => {
    console.log(`started from ${start} to ${end}`);
    ack();
});

eventEmitter.emit( 'start', 1, 100, ()=>{console.log('message received')} );
```

- `on` registers a **listener**, `emit` triggers all the listeners of that event, passing the arguments
- The last argument is a **callback** used by the listener to **acknowledge** the event
- Socket.io works the same way over the network: `emitMove`, `emitPickup`, ... wrap the acknowledgement callback in a **Promise**

<!-- ---

## Agent Communication

### Direct Messaging
```javascript
socket.emitSay(toId, msg);
// Returns: 'successful'
```

### Broadcast
```javascript
socket.emitShout(msg);
// Sends to all agents
```

### Request-Reply Pattern
```javascript
const reply = await socket.emitAsk(toId, msg);
// Waits for response
```

### Handle Incoming Messages
```javascript
socket.on('msg', (id, name, msg, replyCallback) => {
    console.log(`From ${name}: ${msg}`);
    replyCallback('Got it!');
});
``` -->

---

## Data Structures

```javascript
IOAgent: {
    id: string,
    name: string,
    teamId: string, teamName: string,
    x?: number, y?: number,   // undefined when not known
    score: number
}
IOParcel: {
    id: string,
    x: number, y: number,
    carriedBy?: string,
    reward: number
}
IOTile: {
    x: number, y: number,
    type: '0'|'1'|'2'|'3'|'4'|'5'|'5!'|'6'|'7'|'8'|'9'|'←'|'↑'|'→'|'↓'
    // 0: wall, 1: parcel spawner, 2: delivery, 3: walkable, 4: base,
    // 5: crate sliding, 5!: crate spawner, 6: battery spawner, 7: door,
    // 8: key spawner, 9: double delivery, arrows: one-way tiles
}
```

---

## Complete Agent Example – `es.js`

```javascript
import 'dotenv/config'
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk/client';

const socket = DjsConnect();

let myPosition = { x: 0, y: 0 };

socket.onSensing( ( { self } ) => {
    if ( self?.x != undefined && self?.y != undefined )
        myPosition = { x: self.x, y: self.y };
});
```

- Import from `@unitn-asa/deliveroo-js-sdk/client`: the package root only exports the `DjsSdkClient` and `DjsSdkServer` namespaces
- My position is updated at every sensing event, where `self` is my own agent

---

## Complete Agent Example – Following a path

```javascript
socket.onMap( async (width, height, tiles) => {
    const path = ['right', 'right', 'down', 'down', 'left', 'left', 'up', 'up'];

    for (const direction of path) {
        // Insist on the path: retry the same move until it succeeds (or give up)
        let result = await socket.emitMove(direction);
        for ( let retries = 0; ! result && retries < 10; retries++ ) {
            console.log(`Move ${direction} failed, retrying...`);
            await new Promise(r => setTimeout(r, 100));
            result = await socket.emitMove(direction);
        }
    }

    const picked = await socket.emitPickup();
    console.log( 'Picked up', picked.length, 'parcels' );
});
```

- The agent starts once the **map** is received
- `emitMove` resolves to `false` when the move fails (wall, another agent on the tile, ...): the agent **waits and retries**, then gives up after 10 attempts

---

## REST API Endpoints

Via `DjsRestClient` or direct HTTP calls:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get specific agent |
| GET | `/api/parcels` | List all parcels |
| POST | `/api/tokens` | Generate auth token |
| POST | `/api/agents` | Create new agent |
| PATCH | `/api/configs` | Update configuration |
| DELETE | `/api/parcels/:id` | Remove parcel |

Check API documentation at https://deliveroojs.bears.disi.unitn.it/api-docs/

---

## Example: Handling Failures

When multiple agents compete for resources:

```javascript
async function resilientMove(direction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const result = await socket.emitMove(direction);
        if (result) return result;

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Alternative path or request help
    await socket.emitShout(`Help! Blocked trying to move ${direction}`);
    return null;
}
```

---

## Summary

### Key Concepts
- **Promise-based actions** for all game operations
- **Event-driven architecture** for real-time updates
- **Flexible authentication** via token or name
- **Built-in communication** between agents

---

## Implement an agent that:
- Moves along a predefined path
- Pick the parcel
- Deliver it

What if other agents are moving?
- Dealing with failing actions, by insisting on path.

Next Steps
- Implement basic navigation

---

## `script_move.js` – A starting point

```javascript
import 'dotenv/config'
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect()

async function myFn () {
    let up = await socket.emitMove('up');
    let right = await socket.emitMove('right');
}

myFn ()

socket.onTile( ( {x, y, type} ) => {
    console.log(x, y, type)
} )
```

- `myFn` performs two moves **in sequence**: `right` starts only after `up` is completed
- `up` and `right` hold the result of each move: the new `{x, y}`, or `false` if it failed
- `onTile` prints the tiles as they are received: use the tile `type` to find **delivery** tiles (`'2'`)

---

<!-- _class: lead -->

# Questions?

Code: [https://github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
Deliveroo.js: [https://github.com/unitn-ASA/Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)
