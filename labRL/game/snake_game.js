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

import {assertPositiveInteger, getRandomInteger} from '../train/utils.js';

const DEFAULT_WIDTH = 10;
const DEFAULT_HEIGHT = 10;
const DEFAULT_NUM_OBSTACLES = 10;

// TODO(cais): Tune these parameters.
export const MOVE_REWARD = -0.2;
export const GOAL_REWARD = 100;
export const OBSTACLE_REWARD = -10;

export const ACTION_UP = 0;
export const ACTION_DOWN = 1;
export const ACTION_LEFT = 2;
export const ACTION_RIGHT = 3;
export const ACTION_PICK = 4;
export const ACTION_DROP = 5;

export const ALL_ACTIONS = [ACTION_UP, ACTION_DOWN, ACTION_LEFT, ACTION_RIGHT]//, ACTION_PICK, ACTION_DROP];
export const NUM_ACTIONS = ALL_ACTIONS.length;

/**
 * Generate a random action among all possible actions.
 */
export function getRandomAction() {
  return getRandomInteger(0, NUM_ACTIONS);
}

/**
 * Mountain car system simulator.
 *
 * There are two state variables in this system:
 *
 *   - position: The x-coordinate of location of the car.
 *   - velocity: The velocity of the car.
 *
 * The system is controlled through three distinct actions:
 *
 *   - leftward acceleration.
 *   - rightward acceleration
 *   - no acceleration
 */
export class SnakeGame {
  /**
   * Constructor of MountainCar.
   *
   * @param {object} args Configurations for the game. Fields include:
   *   - width {number} width of the board (positive integer).
   *   - height {number} height of the board (positive integer).
   *   - numObstacles {number} number of obstacles on the map.
   */
  constructor( args = {} ) {
    
    let { width = DEFAULT_WIDTH,
          height = DEFAULT_HEIGHT,
          numObstacles = DEFAULT_NUM_OBSTACLES } = args
    
    this.width = width;
    this.height = height;
    this.numObstacles = numObstacles;

    this.frameCount = 0;

    this.x = 0;
    this.y = 0;
    this.meLayer = Array( this.width ).fill(0).map( () => Array( this.height ).fill(0) );
    
    // this.parcelsLayer = Array( this.width ).fill(0).map( () => Array( this.height ).fill(0) );
    // this.depositsLayer = Array( this.width ).fill(0).map( () => Array( this.height ).fill(0) );

    this.goalX = 0;
    this.goalY = 0;
    this.goalLayer = Array( this.width ).fill(0).map( () => Array( this.height ).fill(0) );

    this.numObstacles = numObstacles;
    this.obstaclesLayer = Array( this.width ).fill(0).map( () => Array( this.height ).fill(0) );

    this.reset();
  }

  setMe( x, y ) {
    if ( this.x >= 0 && this.x < this.width && this.y >= 0 && this.y < this.height )
      this.meLayer[ this.x ][ this.y ] = 0;
    this.x = x;
    this.y = y;
    if ( this.x >= 0 && this.x < this.width && this.y >= 0 && this.y < this.height )
      this.meLayer[ this.x ][ this.y ] = 1;
  }

  setGoal( x, y ) {
    this.goalLayer[ this.goalX ][ this.goalY ] = 0;
    this.goalX = x;
    this.goalY = y;
    this.goalLayer[ this.goalX ][ this.goalY ] = 1;
  }

  clearObstacles() {
    for ( let x = 0; x < this.width; x++ )
      for ( let y = 0; y < this.height; y++ )
        this.obstaclesLayer[ x ][ y ] = 0;
  }

  addObstacle( x, y ) {
    if ( x == this.x && y == this.y )
      return;
    if ( x == this.goalX && y == this.goalY )
      return;
    this.obstaclesLayer[ x ][ y ] = 1;
  }

  /**
   * Set the state of the mountain car system randomly.
   */
  reset() {
    this.clearObstacles();
    for ( let i = 0; i < this.numObstacles; i++ ) {
      let x = Math.floor( Math.random() * this.width );
      let y = Math.floor( Math.random() * this.height );
      this.addObstacle( x, y );
    }
    while ( true ) {
      let goalX = Math.floor( Math.random() * this.width );
      let goalY = Math.floor( Math.random() * this.height );
      if ( this.obstaclesLayer[ goalX ][ goalY ] == 0 ) {
        this.setGoal(goalX,goalY);
        break;
      }
    }
    while ( true ) {
      let x = Math.floor( Math.random() * this.width );
      let y = Math.floor( Math.random() * this.height );
      if ( this.obstaclesLayer[ x ][ y ] == 0 ) {
        this.setMe(x,y);
        break;
      }
    }
    this.frameCount = 0;
  }

  /**
   * Get current state as a tf.Tensor of shape [1, 3, w, h].
   * @returns {tf.Tensor4D} The current state.
   */
  getStateTensor() {
    return tf.tensor4d([ [ this.meLayer, this.goalLayer, this.obstaclesLayer ] ], [1, 3, this.width, this.height], 'bool');
  }

  getState() {
    return [ this.meLayer, this.goalLayer, this.obstaclesLayer ];
  }

  getManhattanDistance() {
    return Math.abs( this.x - this.goalX ) + Math.abs( this.y - this.goalY );
  }

  /**
   * Update the mountain car system using an action.
   * @param {number} actionName Only the sign of `action` matters.
   *   Action is an integer, in [-1, 0, 1]
   *   A value of 1 leads to a rightward force of a fixed magnitude.
   *   A value of -1 leads to a leftward force of the same fixed magnitude.
   *   A value of 0 leads to no force applied.
   * @returns {bool} Whether the simulation is done.
   */
  step(action) {
    this.frameCount++;

    var actionName = [ "left", "right", "up", "down", "pick", "drop" ] [ action ];

    if ( actionName == 'right' )
      this.setMe( this.x+1, this.y);
    else if ( actionName == 'left' )
      this.setMe( this.x-1, this.y);
    else if ( actionName == 'up' )
      this.setMe( this.x, this.y+1);
    else if ( actionName == 'down' )
      this.setMe( this.x, this.y-1);
    
    let done = false;
    let reward = MOVE_REWARD;
    let exit_status = "running";

    if ( this.x > this.width - 1 || this.y > this.height - 1 || this.x < 0 || this.y < 0 ) {
      done = true;
      reward = OBSTACLE_REWARD;
      exit_status = "out_of_bounds";
    }
    else if ( this.obstaclesLayer[ this.x ][ this.y ] == 1 ) {
      done = true;
      reward = OBSTACLE_REWARD;
      exit_status = "hit_obstacle";
    }
    else if ( this.frameCount > 100 ) {
      done = true;
      exit_status = "timeout";
    }
    else if ( this.x == this.goalX && this.y == this.goalY ) {
      done = true;
      reward = GOAL_REWARD;
      exit_status = "goal_reached";
    }

    // process.stdout.write( `${this.frameCount} ${exit_status = "goal_reached} \r` );
    // if ( done ) {
    //   console.log( '' );
    // }

    return { done, reward, exit_status };
  }

}







