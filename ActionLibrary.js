class ActionLibrary {
  constructor() {
    this.actions = {};
  }

  addAction(id, actionClass) {
    if (this.actions[id]) {
      throw `Second action added with ID ${id}`;
    }
    this.actions[id] = actionClass;
  }

  getAction(id) {
    if (!this.actions[id]) {
      throw `No action with ID ${id}`;
    }
    return this.actions[id];
  }

}


module.exports = ActionLibrary;
