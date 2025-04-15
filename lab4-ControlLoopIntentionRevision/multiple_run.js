// import child_process in ES module
import { spawn } from 'child_process';

// Function to spawn child processes
function spawnProcesses() {
    for ( let i = 0; i < 5; i++ ) {
        const name = 'm_'+i;
        
        const childProcess = spawn( `node intention_revision.js -name=${name}`, { shell: true } );

        childProcess.stdout.on('data', data => {
            console.log(`Output from ${name}: ${data}`);
        });

        childProcess.stderr.on('data', data => {
            console.error(`Error from ${name}: ${data}`);
        });

        childProcess.on('close', code => {
            console.log(`Child process ${name} exited with code ${code}`);
        });
    }
}

// Start the processes
spawnProcesses();