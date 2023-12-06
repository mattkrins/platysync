import tests from './routes/tests.js'
import schema from './routes/schema.js'
import rules from './routes/rules.js'
import templates from './routes/templates.js'
import actions from './routes/actions.js'
import settings from './routes/settings.js'
import print from './routes/print.js'

export default function ( route ) {
    route.get("/", (req, res) => { res.send("API endpoint"); });
    print(route);
    settings(route);
    schema(route);
    rules(route);
    templates(route);
    actions(route);
    tests(route);
}