---
marp: true
theme: default
paginate: true
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  :root {
    --color-primary: #00C853;
    --color-secondary: #6C63FF;
    --color-accent: #FF6D00;
  }
  section {
    font-family: 'Inter', sans-serif;
  }
  h1 {
    color: var(--color-primary);
  }
  h2 {
    color: var(--color-secondary);
  }
  strong {
    color: var(--color-accent);
  }
  code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background: #e8f3ff;
    color: #2c2c2c;
    padding: 15px;
    border-radius: 8px;
  }
---

<!-- _class: lead -->

# First Challenge - April 21st, 2026

Testing your agents togheter in the Deliveroo.js environment, no matter the performance or the final results, the goal of this challenge is to test and improve your agents in an environment with multiple agents.

---

## `The Scenarios`
For this first challenge, we will use only maps with tiles of 3 types:
- `0` black - non walkable tiles 
- `1` green - spawning tiles
- `2` red - delivery tiles
- `3` white - walkable tiles
- `↑`, `↓`, `←`, `→` arrows - cannot be entered in the opposite direction of the arrow (cannot be entered from the neigbour indicated by the arrow)

Only in the very last scenarios we will try some simple map with crates, still this is not the focus of this first challenge:
- no `5` or `5!` tiles
- no crates

---

## `How does it work?`

- To enroll to the challenge we will publish a message on moodle;
- Each team will have the possibility to play with one agent at a time;
- You will execute your agent from your machine, connecting on https://deliveroojs.bears.disi.unitn.it, please check it works for you;
- Each scenario will be played for 3-5 minutes each;
- After each match, only the best teams will be admitted to the next scenario;

This is not mandatory for the course, but it is a good opportunity to test your agents in a more realistic environment and also to have fun together!


