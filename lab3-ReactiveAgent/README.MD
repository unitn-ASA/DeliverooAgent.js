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

# Implementing the BDI control loop

Implementing the BDI control loop for the Deliveroo.js environment

---

## `one_move.js`
Implement an agent that:
- when 1 tile away from a parcel, reactively moves on the parcel tile and pick it up

---

## `blind_move.js`
Implement an agent that:
- moves in the direction of a given target, moving alternatively on x and y in the direction of the target

---

## `blind_pick.js`
Implement an agent that:
- combines the two from above
- when a parcel is perceived, reactively moves toward it and then pick it up
    - what happens in the case of 2 parcels observed?
    - what happens when another parcel is observed meanwhile moving?
        - what if the other parcel is more valuable (and maybe closer)?
        - or on the opposite if the other parcel is distant and less valuable?


