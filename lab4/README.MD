
# Lab 05/04/2023 - BDI control loop

Implement a BDI control loop so that:
- options are generate on the basis of beliefs, best is pushed to the agent as intention 
- given an intention, an plan from the plan set library is used to achieve it
    - non applicable plans are skipped
    - when an applicable plan is found, it is executed
    - if the plan fails next one is tried
    - when no other plan is left in the library set, and all failed, the intention fails
- alternative reasoning could be considered, such as, insist on achieving the intention by looping over possible plans.
- meta-plan: a plan that includes sub-intention
- plans and intention could be stopped at any time from the outside. 



# Lab 11/04/2023 - Intention Revision

## Queue
- when a intention is pushed to the agent, it is queued for achievement.

## Replace
- when an intention is pushed to the agent, current one is immediately terminated and replaced with the new one.

## Revise - to be done
- when an intention is pushed to the agent, queue is resorted based on some utility function
    - overall reward depends also on order of execution of each single intention
- current intention may either be: continued, terminated and forgot, terminated but maintained in the queue.


