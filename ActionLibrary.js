const util = require('util');
const fs = require('fs');
const path = require('path');

const readdir = util.promisify(fs.readdir);

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

  async addActionsFromDir(dirPath) {
    const files = await readdir(dirPath);
    const self = this;
    files.filter(f => f.endsWith('.js'))
         .forEach(f => {
            const p = path.join(dirPath, f);
            const id = f.slice(0,-3);
            const c = require(p);
            self.addAction(id, c);
         });
  }

  getAction(id) {
    if (!this.actions[id]) {
      throw `No action with ID ${id}`;
    }
    return this.actions[id];
  }

}


module.exports = ActionLibrary;
