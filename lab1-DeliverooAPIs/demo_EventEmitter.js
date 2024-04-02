const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

eventEmitter.on('start', (start, end, ack) => {
    console.log(`started from ${start} to ${end}`);
    ack();
});

eventEmitter.emit( 'start', 1, 100, ()=>{console.log('message received')} );