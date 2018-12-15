const DEFAULT_HOOKS = {
  tiebreaker: async (rules) => rules[0],
  selected: async (rule, state) => { },
  executed: async (rule, state) => { }
}

module.exports = async (startState, knowledgeBase, actionLibrary, userHooks) => {

  const hooks = Object.assign(DEFAULT_HOOKS, userHooks);

  const rulesByPriority = knowledgeBase.rules
    .reduce((acc, rule) => {
      if (!acc[rule.priority]) {
        acc[rule.priority] = [];
      }
      const actionClass = actionLibrary.getAction(rule.action);
      const action = new actionClass(rule.actionConfig);
      acc[rule.priority].push( { action, rule });
      return acc;
    }, {});

  const orderedPriorities = Object.keys(rulesByPriority).sort((a,b) => a - b);

  let state = startState;

  let priorities = [...orderedPriorities];
  while (priorities.length) {
    let priority = priorities.shift();

    let canExecutePromises = rulesByPriority[priority].map(r => r.action.canExecute(state));
    let canExecute = await Promise.all(canExecutePromises);
    let executable = [];
    for (let i = 0; i < canExecute.length; i++) {
      if (canExecute[i]) {
        executable.push(rulesByPriority[priority][i]);
      }
    }

    if (executable.length) {
      let chosen;
      if (executable.length == 1) {
        chosen = executable[0];
      } else {
        chosen = await hooks.tiebreaker(executable);
      }

      await hooks.selected(chosen.rule, state);
      state = await chosen.action.execute(state);
      await hooks.executed(chosen.rule, state);
      priorities = [...orderedPriorities];
    }
  }

  return state;
};
