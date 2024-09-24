import { Alert, Center, Code, Container, Loader, AppShell as Shell } from "@mantine/core";
import Navbar from "./components/Navbar";
import { Link, Redirect, Route, Switch } from "wouter";
import { useDispatch, useSelector } from "./hooks/redux";
import { isLoaded, getError, loadApp, isSetup, loadSettings, getUser, loadSchemas } from "./providers/appSlice";
import { useEffect } from "react";
import { IconAccessPointOff } from "@tabler/icons-react";
import Setup from "./routes/Setup2/Setup";
import Login from "./routes/Auth2/Login";
import Logout from "./routes/Auth2/Logout";
import Schemas from "./routes/Schemas/Schemas";

function AppLoader() {
    return <Container my="20%"><Center><Loader size={100} color="gray" type="dots" /></Center></Container>
}

function LoadFailed({ error }: { error: Error }) {
    return (
    <Container my="20%">
        <Alert variant="filled" color="red" title="Failed to load PlatySync" icon={<IconAccessPointOff/>}>
            {error.message?error.message:<>Server did not respond to client request.</>}<br/>
            <Code>{JSON.stringify(error)}</Code>
        </Alert>
    </Container>
    )
}

function SetupRedirect() {
    return <Redirect to="/" />
}

export default function AppShell() {
    const dispatch = useDispatch();
    const error = useSelector(getError);
    const loaded = useSelector(isLoaded);
    const setup = useSelector(isSetup);
    useEffect(()=>{
      dispatch(loadApp()).then(setup=> {
        if (!setup) return;
        dispatch(loadSettings());
        dispatch(loadSchemas());
      })
    }, []);

    if (error) return <LoadFailed error={error} />;  
    if (!loaded) return <AppLoader/>;
    return (
      <Switch>
        <Route path="/" component={Schemas} />
        {!setup?
        <Route>
            <Route path="/setup" component={Setup} />
            <Route path="/setup/:step" component={Setup} />
        </Route>:<>
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        <Route path="/setup" component={SetupRedirect} />
        <Route>
            <Shell navbar={{ width: 280, breakpoint: 0 }}>
                <Shell.Navbar><Navbar/></Shell.Navbar>
                <Shell.Main>
                    <Route path="/:schema/rules">
                        {(params) => <>rules! <Link href="/rules/test" >child</Link></>}
                    </Route>
                    <Route path="/:schema/rules/:name">
                    {(params) => <>rules, {params.name}!</>}
                    </Route>
                    <Route path="/:schema/users/:name">
                        {(params) => <>Hello, {params.name}!</>}
                    </Route>
                </Shell.Main>
            </Shell>
        </Route>
        </>}
      </Switch>
)
}