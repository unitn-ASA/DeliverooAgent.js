
# Lab 05/04/2023 - Plan Revision

Implement a BDI control loop so that:
- given an intention, an plan from the plan set library is used to achieve it
    - non applicable plans are skipped
    - when an applicable plan is found, it is executed
    - if the plan fails next one is tried
    - when no other plan is left in the library set, and all failed, the intention fails
- alternative reasoning could be considered, such as, insist on achieving the desire by looping over possible plans.
- a plan can push to the agent a sub-desire
- plans and intention could be stopped at any time from the outside. 



# Lab 11/04/2023 - Intention Revision

## Queue
- when a desire is pushed to the agent, it is queued for achievement.

## Replace
- when a desire is pushed to the agent, current intention is immediately terminated and replaced with the intention to achieve the new desire.

## Revise
- when a desire is pushed to the agent, queue of desires is immediately resorted based on some priority metric
- then, current intention may be continue or being replaced.


