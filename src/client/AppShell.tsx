import { AppShell as Shell } from "@mantine/core";
import Navbar from "./Navbar";
import { Link, Route, Switch, useLocation, useParams, useRoute } from "wouter";


function Def() {
    return <>Default</>
}

function Test() {
    return <>Test</>
}

function NavTest({}) {
    const [isActive] = useRoute("/rules");
    return <>isActive: {String(isActive)}</>
}

export default function AppShell() {
    const [location, navigate] = useLocation();
    const params = useParams();
    const [isActive] = useRoute("/rules");

    return (
      <Switch>
        <Route path="/" component={Def} />
        <Route path="/setup" component={Test} />
        <Route>
            {(params) =>
            <Shell navbar={{ width: 256, breakpoint: 0 }}>
                <Shell.Navbar p="md" ><Navbar/></Shell.Navbar>
                <Shell.Main>
                    isActive: {String(isActive)}<br/>
                    {JSON.stringify(params)}<br/>
                    location: {location}<br/>
                    <Route path="/rules">
                        {(params) => <>rules! <Link href="/rules/test" >child</Link></>}
                    </Route>
                    <Route path="/rules/:name">
                    {(params) => <>rules, {params.name}!</>}
                    </Route>
                    <Route path="/users/:name">
                        {(params) => <>Hello, {params.name}!</>}
                    </Route>
                </Shell.Main>
            </Shell>
            }

        </Route>
      </Switch>
)
}