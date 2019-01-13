# rule-based-system

With a complex system to manage we can often break it up into individual rules,
and combine those in order to provide the overall behaviour. Doing so is
flexible, because by changing the priority order of those rules you can change
the algorithmic behaviour of the system as a whole. This has the potential to
simplify a complex system's logic.

They can also be useful if you want to provide an interface that gives nuanced
control of your system's behaviour to an expert user. They are then able to
dynamically adjust it (within the bounds of the available actions) as
circumstances demand, without needing to wait for a developer to come along.

Use cases might include:

* A system that uses knowledge about a user to offer suggestions.
  * Diagnostic tools, like program troubleshooting dialogs or medical symptom
    checkers that build a profile of your symptoms to suggest possible causes
    and solutions
  * Targeted advertising or sales website recommendations systems.
* A system that varies processing based on your order
  * Following different regulations for domestic or international shipping.
  * Billing customers on different payment plans.
* A system that has a lot of similar decision trees
  * A computer game with many different AI routines (e.g "cowardly",
   "aggressive", "explorer", "trader").
  * A layout manager that composes its output differently based on what items
    are available at a given time.

## Design

This framework of a rule-based system is split up into several parts:

* An initial state which is taken, and updated by the system through its
  processing.
* A set of actions, which update the state when run.
* A knowledge base, which is a set of rules the system uses to process the state.
* Rules that pair a priority with an action.
* An orchestrator function which ties all these items together, and coordinates
  processing.

You will need to provide the initial state, actions, and knowledge base of
rules, as they are specific to your system.

## API

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119.

### Action

For your system to be useful the actions will have to be tailored to it. All
actions are passed to the `orchestrator` using an `ActionLibrary` (see below).

An `Action` is a class that MUST have the following methods:

* A constructor that takes an action-specific `config` object, which MAY be
  specified by the `Rule` in the `KnowledgeBase`. If not specified `undefined`
  will be passed in instead. The `Action` SHOULD treat this object as read-only.
* `async canExecute(state)` - a function that accepts the state of the
  system and returns `true` or `false` to indicate if the action's preconditions
  are met, and therefore if the action can be performed. This MAY be called very
  frequently, so it SHOULD return following the minimum possible processing.
* `async execute(state)` - a function that accepts the state of the
  system and performs some processing. It MUST return the new state of the
  system after it has processed. It is RECOMMENDED that you decide up-front if
  `execute` functions are allowed to modify the input state that is provided,
  apply that decision consistently, and document it appropriately for future
  maintainers.

### Rule

A `Rule` is an object that MUST have properties:

* `priority` - An integer greater than `0` indicating the priority of the `Rule`
  relative to others. Lower numbers are higher priority - so priority `1` is the
  highest priority a `Rule` may be assigned.
* `action` - A string indicating the string identifier of an `Action`.
* `actionConfig` (optional) - An object passed to the specified rule during
  construction. This is intended to allow rule re-use where there may be minor
  variations (e.g. different messages to give to a user in a "display" action).

### KnowledgeBase

The `KnowledgeBase` is the set of rules used during processing. It's passed into
the `orchestrator` when asking it to process, and is queried to load the rules
of the system.

The knowledge base MUST have the following property:

* `rules` - an Array of `Rule` objects.

It is NOT RECOMMENDED to pass a reference to the `rules` to the system to allow
it to be updated by an `Action`, as this could lead to a chaotic system. Using
the state and `action.canExecute(state)` is likely simpler to understand and
maintain for most purposes.

### ActionLibrary

In order to process a `Rule` the `Action` needs to be fetched. The `ActionLibrary`
you pass to the `orchestrator` does this, providing `Action` classes as required.

`ActionLibrary` has the following methods:

* `addAction(id, actionClass)` - Adds an `Action`, associating it with the given
  identifier to allow it to be referenced from a `Rule`.
* `getAction(id)` - a function that accepts an action identifier
  and returns the class implementing that action. If an `Action` is requested
  that cannot be loaded this MUST either throw an error (which will halt
  processing) or provide a substitute `Action` to be used instead.

### orchestrator

The orchestrator is an `async` function used to invoke the processing of the
starting state through the rules in the knowledge base.

```
const endState = await orchestrator(startState, knowledgeBase, actionLibrary, hooks);
```

Arguments:
* `startState` - the initial state for the system.
* `knowledgeBase` - the `KnowledgeBase` to use.
* `actionLibrary` - the `ActionLibrary` to use.
* `hooks` - an object providing hooks to alter the behaviour of the system (e.g.
  to add logging of system behaviour)

The `hooks` object MAY be omitted. If present it MAY have any of the following
properties: `tiebreaker`, `selected`, `executed`

#### Hooks

##### async tiebreaker(rules)

A function which takes an Array of rules of equal priority and determines which
of them to use. It MUST return the index of the desired rule.

The default tiebreaker returns an arbitrary rule in the rules list.

Advanced users of this system could implement additional `Rule` properties to
allow tie-breaking based on heuristics such as the cost of an action, picking
the most (or least) frequently used action, the most recently updated item, etc.

##### async selected(rule, state)

A function which is called when the specified `Rule` is determined to be the
highest priority executable rule, but prior to it being executed on the given
state.

##### async executed(rule, state)

A function that is called after the specified `Rule` has been executed,
resulting in the given state.
