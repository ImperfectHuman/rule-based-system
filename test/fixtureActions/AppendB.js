class AppendB {
  constructor(config) {
    this.numExecutions = config.numExecutions || 1;
  }
  async canExecute(state) {
    return this.numExecutions > 0;
  }
  async execute(state) {
    this.numExecutions -= 1;
    state.msg = state.msg ? `${state.msg}B` : 'B';
    return state;
  }
}

module.exports = AppendB;
