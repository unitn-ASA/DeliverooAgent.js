;; domain file: domain-lights.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (tile ?t) (agent ?a)(crate ?c) (me ?a)
        (at ?agentOrCrate ?tile) (yellow ?t)
        (right ?t1 ?t2) (left ?t1 ?t2)(up ?t1 ?t2)(down ?t1 ?t2)
    )
    
    (:action pushRight
        :parameters (?me ?crate ?myPos ?cratePos ?destPos)
        :precondition (and
            (me ?me) (crate ?crate)
            (at ?me ?myPos) (at ?crate ?cratePos)
            (yellow ?destPos) (right ?myPos ?cratePos) (right ?cratePos ?destPos)
        )
        :effect (and
            (at ?me ?cratePos) (not (at ?me ?myPos))
            (at ?crate ?destPos) (not (at ?crate ?cratePos))
        )
    )
    
    (:action right
        :parameters (?me ?from ?to)
        :precondition (and
            (me ?me)
            (at ?me ?from)
            (right ?from ?to)
        )
        :effect (and
            (at ?me ?to)
			(not (at ?me ?from))
        )
    )
)