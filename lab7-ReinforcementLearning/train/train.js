/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as fs from 'fs';

import * as argparse from 'argparse';
import shelljs from 'shelljs';
const {mkdir} = shelljs;

// The value of tf (TensorFlow.js-Node module) will be set dynamically
// depending on the value of the --gpu flag below.
/** @type {typeof import('@tensorflow/tfjs-node')} */
let tf;

import {SnakeGameAgent} from './agent.js';
import {copyWeights} from './dqn.js';
import {SnakeGame} from '../game/snake_game.js';

class MovingAverager {
  constructor(bufferLength) {
    this.buffer = [];
    for (let i = 0; i < bufferLength; ++i) {
      this.buffer.push(null);
    }
  }

  append(x) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  average() {
    return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }

  sum() {
    return this.buffer.reduce((x, prev) => x + prev);
  }

  count(fn) {
    return this.buffer.filter(fn).length;
  }
}

/**
 * Train an agent to play the snake game.
 *
 * @param {SnakeGameAgent} agent The agent to train.
 * @param {number} batchSize Batch size for training.
 * @param {number} gamma Reward discount rate. Must be a number >= 0 and <= 1.
 * @param {number} learnigRate
 * @param {number} cumulativeRewardThreshold The threshold of moving-averaged
 *   cumulative reward from a single game. The training stops as soon as this
 *   threshold is achieved.
 * @param {number} maxNumFrames Maximum number of frames to train for.
 * @param {number} syncEveryFrames The frequency at which the weights are copied
 *   from the online DQN of the agent to the target DQN, in number of frames.
 * @param {string} savePath Path to which the online DQN of the agent will be
 *   saved upon the completion of the training.
 * @param {string} logDir Directory to which TensorBoard logs will be written
 *   during the training. Optional.
 */
export async function train(
    agent, batchSize, gamma, learningRate, cumulativeRewardThreshold,
    maxNumFrames, syncEveryFrames, savePath, logDir) {
  let summaryWriter;
  if (logDir != null) {
    summaryWriter = tf.node.summaryFileWriter(logDir);
  }

  // Load saved model if it exists and copy weights to the agent's networks.
  if (fs.existsSync(savePath+'/model.json')) {
    const handler = tf.io.fileSystem(savePath+'/model.json');
    const qNet = await tf.loadLayersModel(handler);
    copyWeights(agent.targetNetwork, qNet);
    copyWeights(agent.onlineNetwork, qNet);
    console.log(`Loaded DQN from ${savePath}`);
  }

  // Warm up the replay buffer with random actions.
  for (let i = 0; i < agent.replayBufferSize; ++i) {
    let {action, cumulativeReward, done} = agent.playStep();
    process.stdout.write(`Warming up replay buffer... ${i}/${agent.replayBufferSize}\r`);
  }
  console.log('');

  // Moving averager: cumulative reward across 100 most recent 100 episodes.
  const rewardAverager100 = new MovingAverager(100);
  // Moving averager: distance to goal across 100 most recent 100 episodes.
  const distanceAverager100 = new MovingAverager(100);
  // Moving averager: goal_reached count across 100 most recent 100 episodes.
  const goalReachedAverager100 = new MovingAverager(100);

  const optimizer = tf.train.adam(learningRate);
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  let averageReward100Best = -Infinity;
  console.log('Training whenever game is done...');
  while (true) {
    // agent.trainOnReplayBatch(batchSize, gamma, optimizer); // Train at every step
    const {cumulativeReward, done, exit_status} = agent.playStep();
    if (done) {
      agent.trainOnReplayBatch(batchSize, gamma, optimizer); // Train when game is done
      const t = new Date().getTime();
      const frames = agent.frameCount - frameCountPrev;
      const framesPerSecond = frames / (t - tPrev) * 1e3;
      tPrev = t;
      frameCountPrev = agent.frameCount;

      rewardAverager100.append(cumulativeReward);
      distanceAverager100.append(agent.game.getManhattanDistance());
      goalReachedAverager100.append(exit_status === 'goal_reached' ? 1 : 0);
      const averageReward100 = rewardAverager100.average();
      const averageDistance100 = distanceAverager100.average();
      const averageGoalReached100 = goalReachedAverager100.sum();

      // printing on same line
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(
        `Frame #${agent.frameCount}: ` +
        `avgReward100=${averageReward100.toFixed(1)}; ` +
        `avgDistanceToGoal100=${averageDistance100.toFixed(1)}; ` +
        `wins100=${averageGoalReached100} ` +
        `(epsilon=${agent.epsilon.toFixed(3)}) ` +
        `(${framesPerSecond.toFixed(1).padStart(5, '0')} frames/s) ` +
        `@${exit_status} #${frames.toString().padStart(3, '0')}`
      );
      
      if (summaryWriter != null) {
        summaryWriter.scalar(
            'cumulativeReward100', averageReward100, agent.frameCount);
        summaryWriter.scalar('distanceToGoal100', averageDistance100, agent.frameCount);
        summaryWriter.scalar('epsilon', agent.epsilon, agent.frameCount);
        summaryWriter.scalar(
            'framesPerSecond', framesPerSecond, agent.frameCount);
      }
      if (averageReward100 >= cumulativeRewardThreshold ||
          agent.frameCount >= maxNumFrames) {
        // TODO(cais): Save online network.
        break;
      }
      if (averageReward100 > averageReward100Best) {
        averageReward100Best = averageReward100;
        if (savePath != null) {
          if (!fs.existsSync(savePath)) {
            mkdir('-p', savePath);
          }
          await agent.onlineNetwork.save(`file://${savePath}`);
          console.log(`Saved DQN to ${savePath}`);
        }
      }
    }
    if (agent.frameCount % syncEveryFrames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork);
      console.log('Sync\'ed weights from online network to target network');
    }
  }
}

export function parseArguments() {
  const parser = new argparse.ArgumentParser({
    description: 'Training script for a DQN that plays the snake game'
  });
  parser.addArgument('--gpu', {
    action: 'storeTrue',
    help: 'Whether to use tfjs-node-gpu for training ' +
    '(requires CUDA GPU, drivers, and libraries).'
  });
  parser.addArgument('--height', {
    type: 'int',
    defaultValue: 10,
    help: 'Height of the game board.'
  });
  parser.addArgument('--width', {
    type: 'int',
    defaultValue: 10,
    help: 'Width of the game board.'
  });
  parser.addArgument('--numFruits', {
    type: 'int',
    defaultValue: 1,
    help: 'Number of fruits present on the board at any given time.'
  });
  parser.addArgument('--initLen', {
    type: 'int',
    defaultValue: 2,
    help: 'Initial length of the snake, in number of squares.'
  });
  parser.addArgument('--cumulativeRewardThreshold', {
    type: 'float',
    defaultValue: 100,
    help: 'Threshold for cumulative reward (its moving ' +
    'average) over the 100 latest games. Training stops as soon as this ' +
    'threshold is reached (or when --maxNumFrames is reached).'
  });
  parser.addArgument('--maxNumFrames', {
    type: 'float',
    defaultValue: 1e8,
    help: 'Maximum number of frames to run durnig the training. ' +
    'Training ends immediately when this frame count is reached.'
  });
  parser.addArgument('--replayBufferSize', {
    type: 'int',
    defaultValue: 1e2,
    help: 'Length of the replay memory buffer.'
  });
  parser.addArgument('--epsilonInit', {
    type: 'float',
    defaultValue: 0.5,
    help: 'Initial value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonFinal', {
    type: 'float',
    defaultValue: 0.01,
    help: 'Final value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonDecayFrames', {
    type: 'int',
    defaultValue: 1e5,
    help: 'Number of frames of game over which the value of epsilon ' +
    'decays from epsilonInit to epsilonFinal'
  });
  parser.addArgument('--batchSize', {
    type: 'int',
    defaultValue: 64,
    help: 'Batch size for DQN training.'
  });
  parser.addArgument('--gamma', {
    type: 'float',
    defaultValue: 0.99,
    help: 'Reward discount rate.'
  });
  parser.addArgument('--learningRate', {
    type: 'float',
    defaultValue: 1e-3,
    help: 'Learning rate for DQN training.'
  });
  parser.addArgument('--syncEveryFrames', {
    type: 'int',
    defaultValue: 1e3,
    help: 'Frequency at which weights are sync\'ed from the online network ' +
    'to the target network.'
  });
  parser.addArgument('--savePath', {
    type: 'string',
    defaultValue: './models/dqn',
    help: 'File path to which the online DQN will be saved after training.'
  });
  parser.addArgument('--logDir', {
    type: 'string',
    defaultValue: null,
    help: 'Path to the directory for writing TensorBoard logs in.'
  });
  return parser.parseArgs();
}

async function main() {
  const args = parseArguments();
  if (args.gpu) {
    tf = await import('@tensorflow/tfjs-node-gpu');
  } else {
    tf = await import('@tensorflow/tfjs-node');
  }
  console.log(`args: ${JSON.stringify(args, null, 2)}`);

  const game = new SnakeGame({
    height: args.height,
    width: args.width,
    numFruits: args.numFruits,
    initLen: args.initLen
  });
  const agent = new SnakeGameAgent(game, {
    replayBufferSize: args.replayBufferSize,
    epsilonInit: args.epsilonInit,
    epsilonFinal: args.epsilonFinal,
    epsilonDecayFrames: args.epsilonDecayFrames,
    learningRate: args.learningRate
  });

  await train(
      agent, args.batchSize, args.gamma, args.learningRate,
      args.cumulativeRewardThreshold, args.maxNumFrames,
      args.syncEveryFrames, args.savePath, args.logDir);
}


main();
