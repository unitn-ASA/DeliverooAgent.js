const config = require("./config");
const timer = require("./src/timer");
const DeliverooApi = require("./src/DeliverooApi");

const socket = new DeliverooApi( config.host, config.token )


socket.on("you", ({id, name, x, y, score}) => {
    // console.log("you", {id, name, x, y, score})
});


async function agentLoop () {

    var direction_index = [ Math.floor(Math.random()*4) ]

    function getDirection () {
        if (direction_index > 3)
            direction_index = direction_index % 4;
        return [ 'up', 'right', 'down', 'left' ][ direction_index ];
    }

    while ( true ) {

        await socket.move( getDirection() )

        .then( async () => {

            // console.log( 'moved', getDirection() )

            await timer(100); // wait 0.1 sec
            
            await socket.putdown();
            
            await timer(100); // wait 0.1 sec

            await socket.pickup();
    
            direction_index += [0,1,3][ Math.floor(Math.random()*3) ]; // may change direction but not going back

        } )

        .catch( async () => {

            // console.log( 'failed move', getDirection() )

            direction_index += Math.floor(Math.random()*4); // change direction if failed going straigth

        } );
            
        await timer(100); // wait 0.1 sec; if stucked do not block the program in infinite loop

    }
}

agentLoop()