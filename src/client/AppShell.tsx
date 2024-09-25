import { Alert, Code, Container, LoadingOverlay, AppShell as Shell } from "@mantine/core";
import Navbar from "./components/Navbar";
import { Redirect, Route, Switch } from "wouter";
import { useDispatch, useSelector } from "./hooks/redux";
import { isLoaded, getError, loadApp, isSetup, loadSettings, loadSchemas, checkVersion } from "./providers/appSlice";
import { useEffect, useState } from "react";
import { IconAccessPointOff } from "@tabler/icons-react";
import Setup from "./routes/Setup2/Setup";
import Login from "./routes/Auth2/Login";
import Logout from "./routes/Auth2/Logout";
import Schemas from "./routes/Schemas/Schemas";
import Settings from "./routes/Settings/Settings";

function AppLoader() {
    return <LoadingOverlay visible={true} loaderProps={{size:"xl"}} />
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

function ShellWrap({ params, section, setSection, Component }: { params: Record<string, string>, section: string, setSection(s: string): void, Component(params: any): JSX.Element }) {
    return (
    <Shell navbar={{ width: 280, breakpoint: 0 }}>
        <Shell.Navbar><Navbar params={params} section={section} setSection={setSection} /></Shell.Navbar>
        <Shell.Main>
            <Component params={params} />
        </Shell.Main>
    </Shell>
    )
}

function Page() {
    return <>page</>
}

export default function AppShell() {
    const dispatch = useDispatch();
    const error = useSelector(getError);
    const loaded = useSelector(isLoaded);
    const setup = useSelector(isSetup);
    const [section, setSection] = useState('schema');
    useEffect(()=>{ dispatch(loadApp()).then(setup=> {
        if (!setup) return;
        dispatch(loadSettings());
        dispatch(loadSchemas());
        dispatch(checkVersion());
    }); }, []);
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
            <Route path="/settings">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Settings} />}
            </Route>
            <Route path="/app/:schema/dictionary">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Page} />}
            </Route>
            <Route path="/app/:schema/files">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Page} />}
            </Route>
        </Route>
        </>}
      </Switch>
)
}