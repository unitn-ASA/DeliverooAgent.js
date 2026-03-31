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
---

<!-- _class: lead -->

# Deliveroojs APIs
## Lab 1: Introduction to Agent Development

Building autonomous agents for the Deliveroo environment

---

## Learning Objectives

In this lab, you will implement an agent that can:

- **Navigate** along a predefined path
- **Pick up** parcels from the environment
- **Deliver** parcels to their destinations

### Challenge: Multi-Agent Scenarios
What happens when other agents are moving?

- Handle **failing actions** gracefully
- Implement **retry logic** for blocked paths
- Coordinate with other agents in shared spaces

---

## Deliveroo SDK Architecture

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

### Two Authentication Methods

```javascript
// Method 1: Token-based
const socket = DjsConnect( 'localhost:8080', 'YOUR_TOKEN' } );
```

### Environment Variables
```bash
HOST=localhost:8080
TOKEN=your_token_here
# or
NAME=MyAgentName
```

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
// Returns: [{id, x, y, carriedBy, reward}, ...]
```

### Drop Parcels
```javascript
const dropped = await socket.emitPutdown(selected);
// selected: array of parcel IDs (or undefined for all)
```

---

## Event Listeners

The API uses Node.js **EventEmitter** pattern:

```javascript
// Agent identity
socket.on('you', (id, name, x, y, score) => { /* ... */ });

// Map information
socket.on('map', (width, height, tiles) => { /* ... */ });
socket.on('tile', (x, y, delivery) => { /* ... */ });

// Sensing
socket.on('agentsSensing', (agents) => { /* ... */ });
socket.on('parcelsSensing', (parcels) => { /* ... */ });

// Connection
socket.on('connect', () => { /* ... */ });
socket.on('disconnect', () => { /* ... */ });
```

---

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
```

---

## Data Structures

```javascript
IOAgent: {
    id: string,
    name: string,
    teamId: string,
    x: number, y: number,
    score: number,
    penalty: number
}
IOParcel: {
    id: string,
    x: number, y: number,
    carriedBy?: string,
    reward: number
}
IOTile: {
    x: number, y: number,
    type: '0'|'1'|'2'|'3'|'4'|'5'|'←'|'↑'|'→'|'↓'
    // 0: wall, 1: spawner, 2: delivery, 3: walkable, 4: base
}
```

---

## Complete Agent Example

```javascript
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk';

const socket = DjsConnect('localhost:8080');

let myPosition = { x: 0, y: 0 };

socket.on('you', (id, name, x, y) => {
    myPosition = { x, y };
});

socket.on('map', async (width, height, tiles) => {
    // Move along predefined path
    const path = ['right', 'right', 'down', 'down', 'left', 'left', 'up', 'up'];

    for (const direction of path) {
        const result = await socket.emitMove(direction);
        if (!result) {
            console.log(`Move ${direction} failed, retrying...`);
            await new Promise(r => setTimeout(r, 100));
            // Retry logic here
        }
    }

    // Pickup parcels
    await socket.emitPickup();
});
```

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

---

## Handling Failures

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

