# Mission Agents

A collection of mission agents for the Deliveroo.js multiplayer simulation platform. These agents create custom game scenarios with specific objectives, reward systems, and bonus mechanics for teaching multi-agent systems and AI concepts.

## Overview

Mission agents act as game moderators that:
- Connect to the Deliveroo.js simulation with admin privileges
- Define custom missions with specific objectives
- Monitor agent behavior and actions
- Award bonus/penalty points for mission completion
- Communicate mission prompts to agents via chat

## Available Mission Agents

### GoTo (`GoTo.js`)
Agents receive bonuses/penalties for reaching specific coordinates.

**Arguments:**
- `--bonus`: Reward value (default: -1000)
- `--prompt`: Custom mission prompt
- `--unatantum`: One-time bonus per agent (default: true)
- `--coordinates`: Target coordinates as JSON array

**Example:**
```bash
node GoTo.js \
  --prompt 'Go to one of these coordinates to receive a bonus of 1000pts una tantum.' \
  --bonus 1000 \
  --unatantum true \
  --coordinates '[{"x": 19, "y": 19}, {"x": 20, "y": 19}, {"x": 21, "y": 19}]'
```

### DeliverAt (`DeliverAt.js`)
Agents receive bonuses for delivering parcels at specific locations.

**Arguments:**
- `--bonus`: Reward value (default: 100)
- `--prompt`: Custom mission prompt
- `--unatantum`: One-time bonus per agent (default: true)
- `--coordinates`: Target delivery coordinates as JSON array

**Example:**
```bash
node DeliverAt.js \
  --prompt 'Deliver a package at (1,1) to get a 1000pts bonus una tantum.' \
  --bonus 1000 \
  --coordinates '[{"x": 1, "y": 1}]'
```

### QuestionAnswer (`QuestionAnswer.js`)
Agents receive bonuses for answering questions correctly via chat.

**Arguments:**
- `--bonus`: Reward value (default: 500)
- `--prompt`: Custom mission prompt
- `--question`: Question to ask agents
- `--answers`: Correct answers (space-separated, case-insensitive)

**Example:**
```bash
node QuestionAnswer.js \
  --prompt 'Calculate (5*(5+3)/2)+2 to get a bonus una tantum.' \
  --bonus 10000 \
  --question 'What is (5*(5+3)/2)+2?' \
  --answers '22 twenty-two'
```

### deliverExactlyNParcels (`deliverExactlyNParcels.js`)
Agents receive bonuses for delivering exactly N parcels at a time.

**Arguments:**
- `--bonus`: Reward value (default: 100)
- `--prompt`: Custom mission prompt
- `--parcels`: Exact number of parcels to deliver (default: 3)

**Example:**
```bash
node deliverExactlyNParcels.js \
  --prompt 'Deliver exactly three packages at a time.' \
  --bonus 100 \
  --parcels 3
```

### DeliverLessValueThan (`DeliverLessValueThan.js`)
Agents receive bonuses for delivering parcels with total reward below a threshold.

**Arguments:**
- `--bonus`: Reward value (default: 1000)
- `--prompt`: Custom mission prompt
- `--threshold`: Maximum total reward value (default: 10)

**Example:**
```bash
node DeliverLessValueThan.js \
  --prompt 'Deliver parcels with total reward ≤ 10 to get a bonus.' \
  --bonus 1000 \
  --threshold 10
```

### OnePickupAnotherDeliver (`OnePickupAnotherDeliver.js`)
Collaborative mission where both the pickup agent and delivery agent receive bonuses.

**Arguments:**
- `--bonus`: Reward value for each agent (default: 500)
- `--prompt`: Custom mission prompt

**Example:**
```bash
node OnePickupAnotherDeliver.js \
  --prompt 'If you pick up a parcel and another agent delivers it, you both receive a bonus.' \
  --bonus 500
```

### RedLightGreenLight (`RedLightGreenLight.js`)
"Red light, green light" style game where agents must stop on red light and wait for green light.

**Arguments:**
- `--bonus`: Penalty for moving during red light (default: -10)
- `--prompt`: Custom mission prompt

**Example:**
```bash
node RedLightGreenLight.js \
  --prompt 'All agents prepare to stop at red light and wait for the green light message before moving again. For every movement you will receive a penalty.' \
  --bonus -10
```

## Running Mission Agents

### Individual Execution
Run a single mission agent directly:

```bash
# From missionAgents directory
node GoTo.js --bonus 1000 --coordinates '[{"x": 19, "y": 19}]'

# From any directory
node /path/to/DeliverooAgent.js/missionAgents/QuestionAnswer.js --bonus 1000 --answers '22'
```

### Using start.js
Use `start.js` to launch pre-configured mission scenarios:

```bash
# From missionAgents directory
node start.js

# From utils directory (or any directory)
node ../start.js
```

Edit `start.js` to configure which mission to run and its parameters.

## Environment Setup

### Required Environment Variables
Create a `.env` file in the project root:

```env
HOST=http://localhost:8080/
ADMIN_TOKEN=your_admin_token_here
```

### Dependencies
Install required packages:

```bash
npm install @unitn-asa/deliveroo-js-client@latest
npm install argparse dotenv
```

## Architecture

### observeAsGod Utility
The core utility (`utils/observeAsGod.js`) provides:

- **Agent Tracking**: Monitor all agents with connection status, positions, and scores
- **Parcel Lifecycle Tracking**: Enhanced parcels with `initiallyPickedUpBy` and `deliveredBy` properties
- **Event Listeners**: Callbacks for `onDelivery`, `onPutdown`, `onPickup`, `onMove`
- **Reward System**: Simplified reward assignment via `emitReward` function

**Usage:**
```javascript
const { me, trackedAgents, trackedParcels, emitReward } = await observeAsGod(socket, {
    onDelivery: ({agentId, parcels}) => { /* handle delivery */ },
    onPutdown: ({agentId, parcels}) => { /* handle putdown */ },
    onPickup: ({agentId, parcels}) => { /* handle pickup */ },
    onMove: ({agentId, x, y}) => { /* handle movement */ }
});
```

### Common Patterns

#### 1. Mission Achievement Tracking
Prevent duplicate rewards by tracking which agents have completed missions:

```javascript
const missionAchievedAgentIds = [];
if (!missionAchievedAgentIds.includes(agent.id)) {
    missionAchievedAgentIds.push(agent.id);
    emitReward(agent.id, BONUS_REWARD);
}
```

#### 2. Coordinate-Based Missions
Check if agent reaches target coordinates:

```javascript
const onTargetCoordinates = (agent) => {
    return COORDINATES.some(coord => 
        agent.x === coord.x && agent.y === coord.y
    );
};
```

#### 3. Chat-Based Interactions
Monitor agent chat messages for mission completion:

```javascript
socket.onMsg(async (agentId, agentName, msg) => {
    if (ANSWERS.includes(String(msg).toLowerCase())) {
        emitReward(agentId, BONUS_REWARD);
    }
});
```

## Troubleshooting

### Connection Issues
If agents can't connect to the server:
1. Verify `HOST` and `ADMIN_TOKEN` in `.env`
2. Ensure Deliveroo.js server is running
3. Check firewall/network settings

### Module Not Found Errors
If you get `Cannot find module` errors:
1. Ensure you're running from the correct directory
2. Check that `start.js` sets `cwd: __dirname` in spawn options
3. Verify all dependencies are installed

## Project Structure

```
missionAgents/
├── README.md                    # This file
├── start.js                     # Mission launcher with pre-configured scenarios
├── utils/
│   └── observeAsGod.js          # Core utility for agent/parcel tracking
├── GoTo.js                      # Coordinate-based mission
├── DeliverAt.js                 # Location-specific delivery mission
├── QuestionAnswer.js           # Knowledge-based mission
├── deliverExactlyNParcels.js    # Precision delivery mission
├── DeliverLessValueThan.js      # Low-value delivery mission
├── OnePickupAnotherDeliver.js   # Collaborative delivery mission
└── RedLightGreenLight.js        # Stop-and-go movement mission
```

## Contributing

When adding new mission agents:

1. Follow the existing pattern and structure
2. Use `ArgumentParser` for command-line arguments
3. Import and use `observeAsGod` for agent tracking
4. Implement proper mission achievement tracking
5. Add documentation to this README
6. Test with various agent configurations

## License

Educational project for University of Trento Autonomous Software Agents course.
