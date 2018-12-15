const ActionLibrary = require('../ActionLibrary');
const fs = require('fs');
const path = require('path');

describe('ActionLibrary', () => {

  class StubAction {
    constructor() {
    }
    async canExecute(state) {
      return true;
    }
    async execute(state) {
      return state;
    }
  }

  test("added actions can be retrieved", () => {
    const lib = new ActionLibrary();
    lib.addAction("Foo", StubAction);
    expect(lib.getAction("Foo")).toBe(StubAction);
  });

  test("adding a second action with a given ID throws an error", () => {
    const lib = new ActionLibrary();
    lib.addAction("Foo", StubAction);
    expect(() => lib.addAction("Foo", StubAction)).toThrow();
  });

  test("fetching an ID that doesn't exist throws an error", () => {
    const lib = new ActionLibrary();
    expect(() => lib.getAction("Foo")).toThrow();
  });

  test("can load all actions from a directory", async () => {
    expect.assertions(3);
    const dirPath = fs.realpathSync(path.join(__dirname,'fixtureActions'));
    const lib = new ActionLibrary();
    await lib.addActionsFromDir(dirPath);
    expect(lib.getAction("AppendA")).toBeInstanceOf(Function);
    expect(lib.getAction("AppendB")).toBeInstanceOf(Function);
    expect(lib.getAction("AppendC")).toBeInstanceOf(Function);
  });


});
