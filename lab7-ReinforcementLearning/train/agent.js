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

import * as tf from '@tensorflow/tfjs';

import {createDeepQNetwork} from './dqn.js';
import {getRandomAction, SnakeGame, NUM_ACTIONS, ALL_ACTIONS} from '../game/snake_game.js';
import {ReplayMemory} from './replay_memory.js';
import { assertPositiveInteger } from './utils.js';

/**
 * Agent for playing the snake game.
 * @property {tf.Model} onlineNetwork The online DQN (Deep Q-Network) model.
 * @property {tf.Model} targetNetwork The target DQN model.
 */
export class SnakeGameAgent {
  /**
   * Constructor of SnakeGameAgent.
   *
   * @param {SnakeGame} game A game object.
   * @param {object} config The configuration object with the following keys:
   *   - `replayBufferSize` {number} Size of the replay memory. Must be a
   *     positive integer.
   *   - `epsilonInit` {number} Initial value of epsilon (for the epsilon-
   *     greedy algorithm). Must be >= 0 and <= 1.
   *   - `epsilonFinal` {number} The final value of epsilon. Must be >= 0 and
   *     <= 1.
   *   - `epsilonDecayFrames` {number} The # of frames over which the value of
   *     `epsilon` decreases from `episloInit` to `epsilonFinal`, via a linear
   *     schedule.
   *   - `learningRate` {number} The learning rate to use during training.
   */
  constructor(game, config) {
    assertPositiveInteger(config.epsilonDecayFrames);

    this.game = game;

    this.epsilonInit = config.epsilonInit;
    this.epsilonFinal = config.epsilonFinal;
    this.epsilonDecayFrames = config.epsilonDecayFrames;
    this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
        this.epsilonDecayFrames;

    this.onlineNetwork =
        createDeepQNetwork(game.width, game.height, NUM_ACTIONS);
    this.targetNetwork =
        createDeepQNetwork(game.width, game.height, NUM_ACTIONS);
    // Freeze taget network: it's weights are updated only through copying from
    // the online network.
    this.targetNetwork.trainable = false;

    this.optimizer = tf.train.adam(config.learningRate);

    this.replayBufferSize = config.replayBufferSize;
    this.replayMemory = new ReplayMemory(config.replayBufferSize);
    this.frameCount = 0;
    this.reset();
  }

  reset() {
    this.cumulativeReward_ = 0;
    this.game.reset();
  }

  /**
   * Play one step of the game.
   *
   * @returns {number | null} If this step leads to the end of the game,
   *   the total reward from the game as a plain number. Else, `null`.
   */
  playStep() {
    this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
        this.epsilonFinal :
        this.epsilonInit + this.epsilonIncrement_  * this.frameCount;
    this.frameCount++;

    // The epsilon-greedy algorithm.
    const state = this.game.getStateTensor();
    let action;
    if (Math.random() < this.epsilon) {
      // Pick an action at random.
      action = getRandomAction();
    } else {
      // Greedily pick an action based on online DQN output.
      tf.tidy(() => {
        action = ALL_ACTIONS[
            this.onlineNetwork.predict(state).argMax(-1).dataSync()[0]];
      });
    }

    const {reward, done, exit_status} = this.game.step(action);
    const nextState = this.game.getStateTensor();
    
    this.replayMemory.append([state, action, reward, done, nextState]);

    this.cumulativeReward_ += reward;

    const output = {
      action,
      cumulativeReward: this.cumulativeReward_,
      done,
      exit_status
    };
    if (done) {
      this.reset();
    }
    return output;
  }

  /**
   * Perform training on a randomly sampled batch from the replay buffer.
   *
   * @param {number} batchSize Batch size.
   * @param {number} gamma Reward discount rate. Must be >= 0 and <= 1.
   * @param {tf.train.Optimizer} optimizer The optimizer object used to update
   *   the weights of the online network.
   */
  trainOnReplayBatch(batchSize, gamma, optimizer) {
    // Get a batch of examples from the replay buffer.
    const batch = this.replayMemory.sample(batchSize);

    // batch.forEach( ([state, action, reward, done, nextState]) => {
    //   console.log(state);
    //   console.log(action);
    // } );

    const lossFunction = () => tf.tidy(() => {

      const stateTensor = tf.concat(batch.map(example => example[0]));
      const actionTensor = tf.tensor1d(batch.map(example => example[1]), 'int32');
      const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
      const doneMask = tf.scalar(1).sub( tf.tensor1d(batch.map(example => example[3])).asType('float32') );
      const nextStateTensor = tf.concat(batch.map(example => example[4]));


      // Predicted Q value for each action in the state. 
      const qs = this.onlineNetwork.apply(stateTensor, {training: true})
          .mul(tf.oneHot(actionTensor, NUM_ACTIONS)).sum(-1);

      // The Q value of the next state is the maximum Q value of the next state
      const nextMaxQTensor = this.targetNetwork.predict(nextStateTensor).max(-1);
      
      // The target Q value is the reward from the action plus the discounted
      const targetQs = rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));

      // Calculate the loss function. Mean squared error is used here.
      return tf.losses.meanSquaredError(targetQs, qs);
    });

    // Calculate the gradients of the loss function with repsect to the weights of the online DQN.
    const grads = tf.variableGrads(lossFunction);

    // Use the gradients to update the online DQN's weights.
    optimizer.applyGradients(grads.grads);
    tf.dispose(grads);
    
    // TODO(cais): Return the loss value here?
  }
}
