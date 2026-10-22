# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeliverooAgent.js is an educational project for teaching multi-agent systems and AI concepts at the University of Trento. It uses the Deliveroo.js multiplayer simulation platform where autonomous agents navigate a grid, pick up parcels, and deliver them to earn points. The project progresses from reactive agents to reinforcement learning and LLM-based planning.

## Development Commands

### Update Dependencies
```bash
npm install @unitn-asa/deliveroo-js-sdk@latest
```

### Run Simulation
```bash
npm start
```

### Run Individual Mission Agents
```bash
node missionAgents/GoTo.js
node missionAgents/OnePickupAnotherDeliver.js
node missionAgents/deliverExactlyNParcels.js
node missionAgents/DoPutdownAt.js
node missionAgents/BonusGate.js
node missionAgents/QuestionAnswer.js
```

## Architecture

### Core Components

1. **Deliveroo.js SDK** (`@unitn-asa/deliveroo-js-sdk`): Provides the client library for connecting to the simulation environment via WebSocket
2. **PDDL Client** (`@unitn-asa/pddl-client`): Planning and Domain Definition Language integration for complex planning tasks
3. **OpenAI Integration**: LLM-based decision making and planning capabilities
4. **Mission Agents System**: Framework for creating custom game scenarios and reward systems

### Project Structure

```
├── index.js                   # Main entry point for simulation
├── missionAgents/            # Custom mission/agent implementations
│   ├── utils/
│   │   └── observeAsGod.js   # Core utility for agent/parcel tracking
│   ├── GoTo.js               # Coordinate-based mission
│   ├── OnePickupAnotherDeliver.js  # Collaborative delivery mission
│   ├── deliverExactlyNParcels.js   # Precision delivery mission
│   ├── DoPutdownAt.js        # Location-specific delivery mission
│   ├── BonusGate.js          # Checkpoint-based movement mission
│   └── QuestionAnswer.js     # Knowledge-based mission
└── lab[1-8]/                # Progressive learning exercises
```

### Mission Agents Pattern

All mission agents follow a common pattern:

1. **Configuration**: Load environment variables from `../.env`
2. **Mission Definition**: Define `BONUS_REWARD`, target coordinates/conditions, and `PROMPT`
3. **Connection**: Connect using `DjsConnect(HOST, TOKEN)` or hardcoded credentials
4. **Event Handling**: Use `socket.onSensing()` to monitor agent positions and actions
5. **Reward Assignment**: Use `socket.emit('reward', {agentId, points})` to award points
6. **Communication**: Use `socket.emitShout()` to broadcast mission prompts, `socket.emitSay()` for chat messages

### observeAsGod Utility

The most critical utility is `missionAgents/utils/observeAsGod.js`. It provides:

- **Agent tracking**: Tracks all agents with connection status, positions, and scores
- **Parcel lifecycle tracking**: Enhanced parcels with `initiallyPickedUpBy` and `deliveredBy` properties
- **Event listeners**: `onDelivery`, `onPutdown`, `onPickup`, `onMove` callbacks
- **State management**: Maps for `trackedAgents` and `trackedParcels`

Usage pattern:
```javascript
const { me, trackedAgents, trackedParcels } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => { /* handle delivery */ },
    onPutdown: ({agentId, parcels}) => { /* handle putdown */ },
    onPickup: ({agentId, parcels}) => { /* handle pickup */ },
    onMove: ({agentId, x, y}) => { /* handle movement */ }
});
```

### Event-Driven Architecture

- Socket-based event handling with `onSensing`, `onDelivery`, `onMove`
- Asynchronous event processing with `process.nextTick()`
- Callback-based pattern for agent initialization
- Mission achievement tracking to prevent duplicate rewards

### Environment Configuration

Uses `.env` file for configuration:
- `HOST`: Deliveroo.js server URL
- `TOKEN`: Authentication token (ADMIN_TOKEN for admin operations)

## Code Conventions

1. **ES Modules**: Project uses `type: "module"` in package.json
2. **Mission constants**: Define rewards and conditions at file top
3. **Type safety**: Uses JSDoc comments for type definitions
4. **Async initialization**: Agent initialization uses Promise-based patterns
5. **Coordinate checking**: Movement events trigger only when agent reaches integer coordinates (`a.x%1 == 0 && a.y%1 == 0`)
6. **Parcel validation**: Check `reward > 1` to filter expired parcels before processing delivery events

## Key Patterns

### Reward Assignment Pattern
```javascript
const msg = 'Rewarded agent ' + c.name + ' for...';
console.log(msg);
socket.emitSay(me.id, msg);
socket.emit('reward', {agentId: c.id, points: BONUS_REWARD});
```

### Mission Achievement Tracking
```javascript
const missionAchievedAgentIds = [];
// Check and add to prevent duplicate rewards
if (!missionAchievedAgentIds.includes(agent.id)) {
    missionAchievedAgentIds.push(agent.id);
    // Award reward
}
```

### Connection Status Checking
```javascript
// Verify agent is still connected before processing
trackedAgents.get(agentId)?.connected
```

## Progressive Learning Structure

The `lab[1-8]/` directories demonstrate increasing complexity:
- **lab1-3**: Basic reactive agents
- **lab4-5**: Planning and coordination with PDDL
- **lab7**: Reinforcement learning approaches
- **lab8**: LLM-based planning and execution
