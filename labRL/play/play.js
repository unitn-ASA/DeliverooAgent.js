/**
 * Deliveroo.js agent based on pre-trained dqn model.
 */

// import { fileURLToPath } from 'url';
// import path from 'path';
// import fs from 'fs';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

import * as tfn from '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';

import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
  'http://localhost:8080',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyNmY1Y2NmYTNhIiwibmFtZSI6ImdvZCIsImlhdCI6MTcwODAxMzcxOX0.BbUbNZqLBS168A4WtDLcrPqRqkhHfrU-MP5uoZ6aUvc',
  '1ec8cd',
);

const LOCAL_MODEL_URL = './dqn/model.json';

const ALL_ACTIONS = ['left', 'right', 'up', 'down', 'pick', 'drop'];


var width=10, height=10, tiles = [];
var layerArrayObstacles = Array.from({ length: width }, () => Array(height).fill(1));
// var layerTensorObstacles;
client.onMap( async (_width, _height, _tiles) => {

  width = _width;
  height = _height;
  tiles = _tiles;

  layerArrayMe = Array.from({ length: width }, () => Array(height).fill(0));
  layerArrayParcels = Array.from({ length: width }, () => Array(height).fill(0));
  layerArrayObstacles = Array.from({ length: width }, () => Array(height).fill(1));

  tiles.forEach( ({x,y,delivery}) => {
    layerArrayObstacles[x][y] = 0;
  } );
  // layerTensorObstacles = tf.tensor2d( layerArrayObstacles, [ width, height ] );

} );



var x=0, y=0;
var layerArrayMe = Array.from({ length: width }, () => Array(height).fill(0));
// var layerTensorMe;
client.onYou( async ( me ) => {
  layerArrayMe[ x ][ y ] = 0;
  x = Math.ceil( me.x );
  y = Math.ceil( me.y );
  try {
    layerArrayMe[ x ][ y ] = 1;
  } catch (e) {}
  // layerTensorMe = tf.tensor2d(  layerArrayMe, [ width, height ] );
} );



var layerArrayParcels = Array.from({ length: width }, () => Array(height).fill(0));
  client.onParcelsSensing( async (parcels) => {
  let goal =  parcels[0];
  if ( goal && goal.x % 1 == 0 && goal.y % 1 == 0) {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        layerArrayParcels[i][j] = 0;
      }
    }
    // console.log( `Goal: ${goal.x},${goal.y}` );
    layerArrayParcels[ goal.x ][ goal.y ] = 1;
  }
  // parcels.forEach( ({x,y}) => {
  //   layerArrayParcels[x][y] = 1;
  // } );
} );



function getStateTensor () {
  // console.log( 'layerArrayMe', layerArrayMe );
  // console.log( 'layerArrayParcels', layerArrayParcels.toString() );
  // console.log( 'layerArrayObstacles', layerArrayObstacles );
  let tensor = tf.tensor4d( [[ layerArrayMe, layerArrayParcels, layerArrayObstacles ]], [ 1, 3, width, height ] );
  return tensor;
}



let qNet;
// Load dqn model
async function loadDqnModel () {

  // const modelPath = path.resolve(__dirname, LOCAL_MODEL_URL);
  // console.log( `Loading model from ${modelPath}` );

  const handler = tfn.io.fileSystem(LOCAL_MODEL_URL);
  const qNet = await tf.loadLayersModel(handler);

  console.log( `Loaded model from ${LOCAL_MODEL_URL}` );
  
  // Warm up qNet.
  for (let i = 0; i < 3; ++i) {
    qNet.predict(getStateTensor());
  }

  // Start playing
  while (true) {
    await step(qNet);
    // await new Promise(resolve => setTimeout(resolve, 100));
    sendImage(width, height, [layerArrayMe, layerArrayParcels, layerArrayObstacles]);
  }

}
loadDqnModel();






let cumulativeReward = 0;
let bestAction = 'left';

/**
 * Play a game for one step.
 *
 * - Use the current best action to forward one step in the game.
 * - Accumulate to the cumulative reward.
 * - Determine if the game is over and update the UI accordingly.
 * - If the game has not ended, calculate the current Q-values and best action.
 * - Render the game in the canvas.
 */
async function step(qNet) {

  await client.pickup();
  // act and get back reward and done
  let ack;
  // if ( bestAction == 'pick' ) {
  //   ack = await client.pickup();
  // }
  // else if ( bestAction == 'drop' ) {
  //   ack = await client.putdown();
  // }
  // else {
    ack = await client.move( bestAction );
    if ( ack && ack.hasOwnProperty( 'x' ) && ack.hasOwnProperty( 'y' ) ) {
      layerArrayMe[ x ][ y ] = 0;
      x = Math.ceil( ack.x );
      y = Math.ceil( ack.y );
      layerArrayMe[ x ][ y ] = 1;
    }
  // }
  const reward = ack ? -1 : -10;
  const done = false;
  cumulativeReward += reward;

  console.log( `${bestAction} ${(ack ? ack.x+','+ack.y : false)}, cReward=${cumulativeReward.toFixed(1)}` );
  
  if (done) {
    console.log('Game over. Final reward:', cumulativeReward);
    cumulativeReward = 0;
  }
  
  /** Calculate the current Q-values and the best action. */
  tf.tidy(() => {
    const stateTensor = getStateTensor();
    const predictOut = qNet.predict(stateTensor);
    // const currentQValues = predictOut.dataSync();
    // console.log( 'Q-values:', currentQValues );
    bestAction = ALL_ACTIONS[predictOut.argMax(-1).dataSync()[0]];
  });
  
}





import { createCanvas } from 'canvas';

function createImage(width, height, matrix3d) {
  const canvas = createCanvas(width*10, height*10);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if ( matrix3d[0][i][j] == 1 ) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(i*10, height*9-j*10, 10, 10);
      }
      else if ( matrix3d[2][i][j] == 1 ) {
        ctx.fillStyle = 'black';
        ctx.fillRect(i*10, height*9-j*10, 10, 10);
      }
      else if ( matrix3d[1][i][j] == 1 ) {
        ctx.fillStyle = 'green';
        ctx.fillRect(i*10, height*9-j*10, 10, 10);
      }
      else {
        ctx.fillStyle = 'white';
        ctx.fillRect(i*10+1, height*9-j*10+1, 8, 8);
      }
    }
  }

  return canvas;
}

function sendImage(width, height, matrix3d) {
  // console.log( 'Sending draw' );
  // client.socket.emit( 'draw', createImage().toBuffer('image/png') );
  client.socket.emit( 'draw', createImage(width, height, matrix3d).toDataURL('image/png') );
}

// setInterval( () => {
//   console.log( 'Sending draw' );
//   client.socket.emit( 'draw', createImage().toDataURL('image/png') );
// }, 1000 );