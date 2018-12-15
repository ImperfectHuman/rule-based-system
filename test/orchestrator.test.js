const fs = require('fs');
const path = require('path');

const orchestrator = require("../orchestrator");
const ActionLibrary = require("../ActionLibrary");

const FIXTURE_ACTION_PATH = fs.realpathSync(path.join(__dirname,'fixtureActions'));

describe("orchestrator", () => {

  var actions;
  beforeEach(async () => {
    actions = new ActionLibrary();
    await actions.addActionsFromDir(FIXTURE_ACTION_PATH);
  });

  describe("Rule selection and processing", () => {

    test("With no rules the initial state is returned", async () => {
      expect.assertions(1);

      const startState = {
        alpha: 32,
        bravo: "Lorem ipsum dolor sit amet"
      };

      const expectedState = Object.assign(startState);
      const endState = await orchestrator(startState, { rules: [ ] }, actions);
      expect(endState).toEqual(expectedState);
    });

    test("Processing stops when there are no executable rules", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 1, action: "AppendA" }
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "A" });
    });

    test("Processing continues until there are no executable rules", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 1, action: "AppendA" },
        { priority: 1, action: "AppendA" },
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "AA" });
    });

    test("action config is passed into action", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 1, action: "AppendA", actionConfig: { numExecutions: 5 } }
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "AAAAA" });
    });

    test("Highest priority rule is executed by preference", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 1, action: "AppendA", actionConfig: { numExecutions: 2 } },
        { priority: 2, action: "AppendB", actionConfig: { numExecutions: 3 } }
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "AABBB" });
    });

    test("Highest priority rule is executed by preference, regardless of order", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 2, action: "AppendB", actionConfig: { numExecutions: 3 } },
        { priority: 1, action: "AppendA", actionConfig: { numExecutions: 2 } }
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "AABBB" });
    });

    test("Default tie breaker picks first input rule at that priority", async () => {
      expect.assertions(1);

      const rules = [
        { priority: 1, action: "AppendA" },
        { priority: 2, action: "AppendB" },
        { priority: 2, action: "AppendC" }
      ];

      const endState = await orchestrator({}, { rules }, actions);
      expect(endState).toEqual({ msg: "ABC" });
    });

  });

  describe("hooks", () => {

    describe("tiebreaker hook", () => {
      test("Provided tie breaker used instead of default", async () => {
        expect.assertions(1);

        const rules = [
          { priority: 1, action: "AppendA" },
          { priority: 2, action: "AppendB" },
          { priority: 2, action: "AppendC" }
        ];

        const hooks = {
          tiebreaker: rules => rules[rules.length - 1]
        };

        const endState = await orchestrator({}, { rules }, actions, hooks);
        expect(endState).toEqual({ msg: "ACB" });
      });
    });

    describe("selected hook", () => {
      test("Provided selection hook is called with pre-execution state", async () => {
        expect.assertions(1);

        const rules = [
          { priority: 1, action: "AppendA" },
          { priority: 2, action: "AppendB" },
          { priority: 3, action: "AppendC" }
        ];

        const calls = [];

        const hooks = {
          selected: (rule, state) => calls.push([rule, state.msg])
        };

        await orchestrator({}, { rules }, actions, hooks);
        expect(calls).toEqual([
          [ rules[0], undefined ],
          [ rules[1], "A" ],
          [ rules[2], "AB" ]
        ]);
      });
    });

    describe("executed hook", () => {
      test("Provided executed hook is called with post-execution state", async () => {
        expect.assertions(1);

        const rules = [
          { priority: 1, action: "AppendA" },
          { priority: 2, action: "AppendB" },
          { priority: 3, action: "AppendC" }
        ];

        const calls = [];

        const hooks = {
          executed: (rule, state) => calls.push([rule, state.msg])
        };

        await orchestrator({}, { rules }, actions, hooks);
        expect(calls).toEqual([
          [ rules[0], "A" ],
          [ rules[1], "AB" ],
          [ rules[2], "ABC" ]
        ]);
      });
    });

  });


});
