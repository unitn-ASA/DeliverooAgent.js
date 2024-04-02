# Implementing the BDI control loop


## `one_move.js`
Implement an agent that:
- when 1 tile away from a parcel, reactively moves on the parcel tile and pick it up


## `blind_move.js`
Implement an agent that:
- moves in the direction of a given target, moving alternatively on x and y in the direction of the target


## `blind_pick.js`
Implement an agent that:
- combines the two from above
- when a parcel is perceived, reactively moves toward it and then pick it up
    - what happens in the case of 2 parcels observed?
    - what happens when another parcel is observed meanwhile moving?
        - what if the other parcel is more valuable (and maybe closer)?
        - or on the opposite if the other parcel is distant and less valuable?


