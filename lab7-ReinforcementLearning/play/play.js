/**
 * Deliveroo.js agent based on pre-trained dqn model.
 */

import * as tfn from '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';

import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
  'http://localhost:8080',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1OTBkNTA3MWI1IiwibmFtZSI6ImdvZCIsImlhdCI6MTcxNjkyNDcwNX0.-8ZdtFC9khWjQGITZ0Xm3aMVlUXtq3w2A6hU8emKk8I'
);

const LOCAL_MODEL_URL = './dqn/model.json';

const ALL_ACTIONS = ['left', 'right', 'up', 'down', 'pick', 'drop'];


var width=10, height=10, tiles = [];
var layerArrayObstacles = Array.from({ length: width }, () => Array(height).fill(1));
// var layerBufferObstacles = tf.buffer( [ width, height ], 'boolean', [true] );
client.onMap( async (_width, _height, _tiles) => {

    width = _width;
    height = _height;
    tiles = _tiles;

    layerArrayMe = Array.from({ length: width }, () => Array(height).fill(0));
    layerArrayParcels = Array.from({ length: width }, () => Array(height).fill(0));
    layerArrayObstacles = Array.from({ length: width }, () => Array(height).fill(1));

    tiles.forEach( ({x,y,delivery}) => {
        layerArrayObstacles[x][y] = 0;
        // layerBufferObstacles.set( false, x, y );
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
var goal = {x:0, y:0};
client.onParcelsSensing( async (parcels) => {
  
    // filter parcels
    parcels = parcels
        // not carried
        .filter( ({carriedBy}) => !carriedBy )
        // sort by distance, closest first
        .sort( (a,b) => {
        let distA = Math.abs( a.x - x ) + Math.abs( a.y - y );
        let distB = Math.abs( b.x - x ) + Math.abs( b.y - y );
        return distA - distB;
        } );
    
    // take the closest
    if ( parcels.length > 0 )
        goal = parcels[0]

    if ( goal && goal.x % 1 == 0 && goal.y % 1 == 0) {

        // clear parcels
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                layerArrayParcels[i][j] = 0;
            }
        }
        // set goal
        layerArrayParcels[ goal.x ][ goal.y ] = 1;
        // console.log( `Goal: ${goal.x},${goal.y}` );
    }

} );


function getLayers10x10 () {
    let min_x = Math.max( x-5, 0 );
    let min_y = Math.max( y-5, 0 );
    let max_x = Math.min( min_x + 9, width - 1 );
    let max_y = Math.min( min_y + 9, height - 1 );
    min_x = max_x - 9;
    min_y = max_y - 9;
    return [
        layerArrayMe.slice(min_x, max_x+1).map( row => row.slice(min_y, max_y+1) ),
        layerArrayParcels.slice(min_x, max_x+1).map( row => row.slice(min_y, max_y+1) ),
        layerArrayObstacles.slice(min_x, max_x+1).map( row => row.slice(min_y, max_y+1) )
        // layerBufferObstacles.toTensor().slice([min_x, min_y], [max_x+1, max_y+1])
    ]
}



function getStateTensor () {
    let tensor = tf.tensor4d(
        [ getLayers10x10() ],
        [ 1, 3, 10, 10 ]
    );
    return tensor;
}




// Load dqn model
async function loadDqnModel () {

    const handler = tfn.io.fileSystem(LOCAL_MODEL_URL);
    const qNet = await tf.loadLayersModel(handler);

    console.log( `Loaded model from ${LOCAL_MODEL_URL}` );
    
    // Warm up qNet.
    for (let i = 0; i < 3; ++i) {
        qNet.predict(getStateTensor());
    }

    // Start playing
    while (true) {
        console.log('Step');
        await step(qNet);
        // await new Promise(resolve => setTimeout(resolve, 100));
        sendImage(10, 10, getLayers10x10());
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

    // always pick up
    await client.pickup();
    
    // do bestAction and get back reward and done
    let ack = await client.move( bestAction );
    if ( ack && ack.hasOwnProperty( 'x' ) && ack.hasOwnProperty( 'y' ) ) {
        layerArrayMe[ x ][ y ] = 0;
        x = Math.ceil( ack.x );
        y = Math.ceil( ack.y );
        layerArrayMe[ x ][ y ] = 1;
    }
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