// import child_process in ES module
import { spawn } from 'child_process';

const marco = { id: 'e083aa6f59e', name: 'marco',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUwODNhYTZmNTllIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNzE2Mjg2NTA2fQ.grMI3zVziSg6troUw8HXi9wAvLSNil0OrBcA_Uz00V0'
};

const paolo = { id: '1d74b61b883', name: 'paolo',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFkNzRiNjFiODgzIiwibmFtZSI6InBhb2xvIiwiaWF0IjoxNzE2Mjg4ODU0fQ.CZJuyCTpDG7RKBbvQksSK0YHZ9sTmm3H9IwOAal1Tlk'
};

// Start the processes
spawnProcesses( marco, paolo ); // I am marco and team mate is paolo
spawnProcesses( paolo, marco ); // I am paolo and team mate is marco

// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // marco e083aa6f59e
    const childProcess = spawn(
        `node 7pickup \
        host="http://rtibdi.disi.unitn.it:8080" \
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


