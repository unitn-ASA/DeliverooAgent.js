// import child_process in ES module
import { spawn } from 'child_process';

const marco = { id: 'd26d57', name: 'marco',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQyNmQ1NyIsIm5hbWUiOiJtYXJjbyIsInRlYW1JZCI6ImM3ZjgwMCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQwMDA3NjIwfQ.1lfKRxSSwj3_a4fWnAV44U1koLrphwLkZ9yZnYQDoSw'
};

const paolo = { id: '74daed', name: 'paolo',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0ZGFlZCIsIm5hbWUiOiJwYW9sbyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ3NzMzMTczfQ.DkbA4ADLmiWhf-EHVH27QVWN7VmT6tazJ96VVjthTGg'
};

// Start the processes
spawnProcesses( marco, paolo ); // I am marco and team mate is paolo
spawnProcesses( paolo, marco ); // I am paolo and team mate is marco

// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // marco e083aa6f59e
    const childProcess = spawn(
        `node 7pickup \
        host="https://deliveroojs.rtibdi.disi.unitn.it" \
        token="${me.token}" \
        teamId="${teamMate.id}" `,
        { shell: true }
    );

    childProcess.stdout.on('data', data => {
        console.log(me.name, '>', data.toString());
    });

    childProcess.stderr.on('data', data => {
        console.error(me.name, '>', data.toString());
    });

    childProcess.on('close', code => {
        console.log(`${me.name}: exited with code ${code}`);
    });

};


