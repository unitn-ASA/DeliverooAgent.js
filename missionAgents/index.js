/**
 * Mission Agents Index
 * Exports all mission agents for centralized execution
 */

// Type definitions for mission agent options
/** @typedef {Object} BonusGateOptions
 * @property {number} [bonus] - Bonus reward value (default: 100)
 * @property {string} [prompt] - Custom mission prompt
 * @property {Array<{x:number, y:number}>} [coordinates] - Target coordinates array
 */

/** @typedef {Object} GoToOptions
 * @property {number} [bonus] - Bonus reward value (default: -1000)
 * @property {string} [prompt] - Custom mission prompt
 * @property {Array<{x:number, y:number}>} [coordinates] - Target coordinates array
 */

/** @typedef {Object} OnePickupAnotherDeliverOptions
 * @property {number} [bonus] - Bonus reward value (default: 500)
 * @property {string} [prompt] - Custom mission prompt
 */

/** @typedef {Object} DeliverExactlyNParcelsOptions
 * @property {number} [bonus] - Bonus reward value (default: 500)
 * @property {number} [parcels] - Number of parcels required (default: 3)
 * @property {string} [prompt] - Custom mission prompt
 */

/** @typedef {Object} DoPutdownAtOptions
 * @property {number} [bonus] - Bonus reward value (default: 100)
 * @property {string} [prompt] - Custom mission prompt
 * @property {Array<{x:number, y:number}>} [coordinates] - Target coordinates array
 */

/** @typedef {Object} QuestionAnswerOptions
 * @property {number} [bonus] - Bonus reward value (default: 500)
 * @property {string} [prompt] - Custom mission prompt
 * @property {string} [question] - Question to ask
 * @property {Array<string>} [answers] - Correct answers array
 */

// Export each mission agent as a function that can be executed with parameters
export const missionAgents = {
    /**
     * Bonus Gate Mission
     * Awards bonus points when agents pass through specific coordinates
     * @param {BonusGateOptions} options - Configuration options
     */
    BonusGate: async (options = {}) => {
        const { bonus = 100, prompt, coordinates } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/BonusGate.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (prompt) args.push('--prompt', prompt);
        if (coordinates) args.push('--coordinates', JSON.stringify(coordinates));

        return spawn('node', args, { stdio: 'inherit' });
    },

    /**
     * Go To Mission
     * Awards bonus points when agents reach specific coordinates (one-time per agent)
     * @param {GoToOptions} options - Configuration options
     */
    GoTo: async (options = {}) => {
        const { bonus = -1000, prompt, coordinates } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/GoTo.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (prompt) args.push('--prompt', prompt);
        if (coordinates) args.push('--coordinates', JSON.stringify(coordinates));

        return spawn('node', args, { stdio: 'inherit' });
    },

    /**
     * One Pickup Another Deliver Mission
     * Awards bonus when different agents do pickup and delivery
     * @param {OnePickupAnotherDeliverOptions} options - Configuration options
     */
    OnePickupAnotherDeliver: async (options = {}) => {
        const { bonus = 500, prompt } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/OnePickupAnotherDeliver.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (prompt) args.push('--prompt', prompt);

        return spawn('node', args, { stdio: 'inherit' });
    },

    /**
     * Deliver Exactly N Parcels Mission
     * Awards bonus for delivering exact number of parcels
     * @param {DeliverExactlyNParcelsOptions} options - Configuration options
     */
    deliverExactlyNParcels: async (options = {}) => {
        const { bonus = 500, parcels = 3, prompt } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/deliverExactlyNParcels.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (parcels) args.push('--parcels', parcels.toString());
        if (prompt) args.push('--prompt', prompt);

        return spawn('node', args, { stdio: 'inherit' });
    },

    /**
     * Do Putdown At Mission
     * Awards bonus for delivering at specific coordinates (one-time per agent)
     * @param {DoPutdownAtOptions} options - Configuration options
     */
    DoPutdownAt: async (options = {}) => {
        const { bonus = 100, prompt, coordinates } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/DoPutdownAt.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (prompt) args.push('--prompt', prompt);
        if (coordinates) args.push('--coordinates', JSON.stringify(coordinates));

        return spawn('node', args, { stdio: 'inherit' });
    },

    /**
     * Question Answer Mission
     * Awards bonus for answering questions correctly
     * @param {QuestionAnswerOptions} options - Configuration options
     */
    QuestionAnswer: async (options = {}) => {
        const { bonus = 500, prompt, question, answers } = options;
        const { spawn } = await import('child_process');
        const args = ['missionAgents/QuestionAnswer.js'];

        if (bonus) args.push('--bonus', bonus.toString());
        if (prompt) args.push('--prompt', prompt);
        if (question) args.push('--question', question);
        if (answers) args.push('--answers', JSON.stringify(answers));

        return spawn('node', args, { stdio: 'inherit' });
    }
};

/**
 * Run all mission agents with default or custom configurations
 * @param {Object} configurations - Configuration object with agent names as keys and their options as values
 */
export const runAllMissionAgents = async (configurations = {}) => {
    const processes = [];

    console.log('Starting all mission agents...');

    // Default configurations for each mission
    const defaults = {
        BonusGate: {
            bonus: 100,
            coordinates: [
                { x: 11, y: 12 },
                { x: 12, y: 12 },
                { x: 13, y: 12 }
            ]
        },
        GoTo: {
            bonus: -1000,
            coordinates: [
                { x: 11, y: 12 },
                { x: 12, y: 12 },
                { x: 13, y: 12 }
            ]
        },
        OnePickupAnotherDeliver: {
            bonus: 500
        },
        deliverExactlyNParcels: {
            bonus: 500,
            parcels: 3
        },
        DoPutdownAt: {
            bonus: 100,
            coordinates: [
                { x: 11, y: 12 },
                { x: 12, y: 12 },
                { x: 13, y: 12 }
            ]
        },
        QuestionAnswer: {
            bonus: 500,
            question: 'What is the capital of Italy?',
            answers: ['rome']
        }
    };

    // Merge defaults with provided configurations
    const configs = { ...defaults, ...configurations };

    // Launch each mission agent
    for (const [agentName, agentFunction] of Object.entries(missionAgents)) {
        const config = configs[agentName] || {};
        console.log(`Launching ${agentName} with config:`, config);

        try {
            const process = await agentFunction(config);
            processes.push({ name: agentName, process });
        } catch (error) {
            console.error(`Failed to launch ${agentName}:`, error);
        }
    }

    console.log(`All ${processes.length} mission agents launched.`);
    return processes;
};

export default missionAgents;
