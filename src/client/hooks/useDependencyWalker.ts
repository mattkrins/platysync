import { useSelector } from "react-redux";
import { getConnectors, getActions, getRules } from "../providers/schemaSlice";

export default function useDependencyWalker(
    searchName: string,
    testStr: (str: string | undefined, substring: string) => boolean,
    extendedTests?: (name: string, connectors: Connector[], actions: ActionConfig[], rules: Rule[]) => string|undefined
    ) {
    const connectors = useSelector(getConnectors);
    const actions = useSelector(getActions);
    const rules = useSelector(getRules);
    return () => {
        for (const { id, name, path } of connectors||[]) {    
            switch (id) {
                case "csv": { if (testStr(path as string, searchName)) return `csv connector: '${name}' path`; break; }
                case "folder": { if (testStr(path as string, searchName)) return `folder connector: '${name}' path`; break; }
                default: continue;
            }
        }
        const testAction = (name: string, action: Action, append: string) => {
            for (const key of Object.keys(action)) {
                const value = action[key as keyof Action];
                if (!value) continue;
                switch (typeof value) {
                    case "string": { if (testStr(value, searchName)) return `${append} '${name}' ${key}`; break; }
                    case "object": {
                        if (!Array.isArray(value)) continue;
                        for (const object of value) {
                            switch (typeof object) {
                                case "string": { if (testStr(object, searchName)) return `${append} '${name}' ${key}`; break; }
                                case "object": {
                                    for (const k of Object.keys(object)) {
                                        const v = object[k];
                                        if (testStr(v, searchName)) return `${append} '${name}' ${key}`;
                                    }
                                    break;
                                }
                                default: continue;
                            }
                        }
                        break;
                    }
                    default: continue;
                }
            }
        }
        for (const { name, config } of actions||[]) {
            const test = testAction(name, config, "action config");
            if (test) return test;
        }
        for (const rule of rules||[]) {
            if (testStr(rule.display, searchName)) return `rule '${rule.name}' display`;
            for (const condition of rule.conditions||[]) {
                if (testStr(condition.key, searchName)) return `rule '${rule.name}' condition key`;
                if (testStr(condition.value, searchName)) return `rule '${rule.name}' condition value`;
            }
            for (const column of rule.columns||[]) {
                if (testStr(column.value, searchName)) return `rule '${rule.name}' column value`;
            }
            for (const action of rule.initActions||[]) {
                const test = testAction(action.name, action, `rule '${rule.name}' init action`);
                if (test) return test;
            }
            for (const action of rule.iterativeActions||[]) {
                const test = testAction(action.name, action, `rule '${rule.name}' iterative action`);
                if (test) return test;
            }
            for (const action of rule.finalActions||[]) {
                const test = testAction(action.name, action, `rule '${rule.name}' final action`);
                if (test) return test;
            }
        }
        if (extendedTests){
            const test = extendedTests(searchName, connectors, actions, rules);
            if (test) return test;
        }
    }
}