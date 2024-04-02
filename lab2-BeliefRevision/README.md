# More on Belief Revision

## `no_memory.js`
Implement an agent that:
- perceive other agents and overwrite previously perceived agents beliefset
- print all perceived agents as `${name}(${x},${y})`


## `memory.js`
Implement an agent that:
- perceive agents and create a new entry in the beliefset including the timestamp about perceiving time
- print, for each perceived agent, perception history as `${id}@${Date.now()-start}:${x},${y} @${previousTime}:${x},${y} ...`


## `uncertainty.js`
Implement belief revision so that:
- say Hello to agents that are met for the first time:
    `console.log( 'Hello', a.name )`
- for agents already met in the past:
    - case 1: I was seeing him also last time
        - But he moved:
            `console.log( 'You are moving', a.name )`
        - Or he did not moved:
            `console.log( 'You are still in same place as before' )`
    - case 2: I see him again after some time
        - Seems that he moved:
            `console.log( 'Welcome back, seems that moved', a.name )`
        -  As far as I remember he is still here:
            `console.log( 'Welcome back, seems you are still here as before', a.name )`
- I am perceiving (eventually no one is around me) and seems that I am not seeing him anymore
    - He just went off, right now:
        `console.log( 'Bye', a.name )`
    - It's already a while since last time I saw him:
        `console.log( 'Its a while that I don\'t see', a.name, 'I remember him in', a.x, a.y )`
    - I'm back where I remember I saw him last time:
        `console.log( 'I remember', a.name, 'was within 3 tiles from here. Forget him.' )`


