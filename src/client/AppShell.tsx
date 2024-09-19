import { AppShell as Shell } from "@mantine/core";
import Navbar from "./components/Navbar";
import { Link, Route, Switch, useLocation } from "wouter";
import { useDispatch, useSelector } from "./hooks/redux";
import { isSetup } from "./providers/appSlice";


function Def() {
    return <>Default</>
}

function Test() {
    return <>Test</>
}

export default function AppShell() {
    const dispatch = useDispatch();
    const setup = useSelector(isSetup);
    //const [_, setLocation] = useLocation();
    //useEffect(()=>{
    //  dispatch(loadApp()).then(setup=> setup ? null : setLocation(`/setup`))
    //  .then(()=>dispatch(loadSettings()));
    //}, []);


    return (
      <Switch>
        <Route path="/" component={Def} />
        <Route path="/setup" component={Test} />
        <Route>
            <Shell navbar={{ width: 280, breakpoint: 0 }}>
                <Shell.Navbar><Navbar/></Shell.Navbar>
                <Shell.Main>
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
        </Route>
      </Switch>
)
}