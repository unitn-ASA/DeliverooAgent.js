// import child_process in ES module
import { spawn } from 'child_process';

// Function to spawn child processes
function spawnProcesses() {
    
    for (let i = 0; i < 60; i++) {
        const childProcess = spawn(
            'node ddos_one.js',
            { shell: true }
        );

        // childProcess.stdout.on('data', data => {
        //     console.log(`Output from ${i}: ${data}`);
        // });

        // childProcess.stderr.on('data', data => {
        //     console.error(`Error from ${i}: ${data}`);
        // });

        // childProcess.on('close', code => {
        //     console.log(`Child process ${i} exited with code ${code}`);
        // });
    }

}
// Start the processes
spawnProcesses();