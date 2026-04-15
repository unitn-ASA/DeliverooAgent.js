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

# Implement a BDI control loop so that:
- options are generated on the basis of beliefs, after filtering, one is selected so that the agent has the intent to achieve it
- a plan from the plan-library is used to achieve it
    - non applicable plans are skipped
    - when an applicable plan is found, it is executed
    - if the plan fails next one is tried
    - when no other plan is left in the library set (all failed) the intention fails
- alternative reasoning could be considered, such as, insist on achieving by looping over possible plans
- sub-plan: a plan could rely on other plans
- plans could be stopped at any time from the outside

---

# Intention Revision

- **Queue** - when an option is selected, it is queued for achievement.

- **Replace** - when an option is selected, current one is immediately terminated and replaced with the new one.

- **Revise** - to be done - when an option is selected, options are resorted based on some utility function - overall reward depends also on order of execution of each single intention - current plan may either be: (i) continued, or (ii) terminated and forgotten, or (iii) terminated but maintained in the queue.


