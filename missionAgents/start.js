
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// // 26c2_1
// const args = ['GoTo.js',
//     '--prompt', 'Go to one of these coordinates to receive a bonus of 1000pti una tantum.',
//     '--unatantum', true,
//     '--bonus', '1000',
//     '--coordinates', JSON.stringify([
//         { x: 19, y: 19},
//         { x: 20, y: 19 },
//         { x: 21, y: 19 }
//     ])
// ];


// // 26c2_2
// const args = ['DeliverAt.js',
//     '--prompt', 'Deliver a package in 1,1 to get a 1000pts bonus una tantum.',
//     '--unatantum', true,
//     '--bonus', '1000',
//     '--coordinates', JSON.stringify([
//         { x: 1, y: 1 }
//     ])
// ];



// // 26c2_3
// const args = ['QuestionAnswer.js',
//     '--prompt', 'Calculate (5*(5+3)/2)+2 to get a bonus una tantum.',
//     '--bonus', '10000',
//     '--answers', '22'
// ];



// // 26c2_4
// const args = ['GoTo.js',
//     '--prompt', 'Do not go through tiles (13,15) (14,15) (15,15) (16,15) or you will be penalized.',
//     '--unatantum', false,
//     '--bonus', '-1000',
//     '--coordinates', JSON.stringify([
//         { x: 13, y: 15 },
//         { x: 14, y: 15 },
//         { x: 15, y: 15 },
//         { x: 16, y: 15 }
//     ])
// ];



// // 26c2_5
// const args = ['deliverExactlyNParcels.js',
//     '--prompt', 'Deliver exactly three packages at a time.',
//     '--bonus', '100',
//     '--parcels', '3'
// ];



// // 26c2_6
// const args = ['DeliverAt.js',
//     '--prompt', 'Do never deliver in (15,32) (16,32) (15,31) (16,31).',
//     '--unatantum', false,
//     '--bonus', '-500',
//     '--coordinates', JSON.stringify([
//         { x: 15, y: 32 },
//         { x: 16, y: 32 },
//         { x: 15, y: 31 },
//         { x: 16, y: 31 }
//     ])
// ];



// 26c2_7
const args = ['DeliverLessValueThan.js',
    '--prompt', 'Every time you deliver parcels for a total amount of reward lower or equal to 10, you get a bonus.',
    '--bonus', '1000',
    '--threshold', '10'
];



// // 26c2_8
// const args = ['OnePickupAnotherDeliver.js',
//     '--prompt', 'If you pick up a parcel and another agent delivers it, you both receive a bonus.',
//     '--bonus', '500'
// ];



// // 26c2_9
// const args = ['RedLightGreenLight.js',
//     '--prompt', 'All agents prepare to stop at red light and wait for the green light message before moving again, as in a “red light, green light” game. For every movement you will receive a penalty.',
//     '--bonus', '-10',
// ];



// // 26c2_10
// const args = ['---.js',
//     '--prompt', 'Move both agents to the neighborhood of position (19,5) within a maximum distance of 3, and have them wait for each other. You will receive 500pts.',
//     '--bonus', '500',
// ];



spawn('node', args, {
    stdio: 'inherit',
    cwd: __dirname  // Set working directory to where start.js is located
});
