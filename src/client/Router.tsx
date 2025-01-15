import { Alert, Code, Container, Drawer, Group, LoadingOverlay, AppShell, Text } from "@mantine/core";
import Navbar from "./components/Navbar";
import { Redirect, Route, Switch } from "wouter";
import { useDispatch, useSelector } from "./hooks/redux";
import { isLoaded, getError, loadApp, isSetup, loadSettings, loadSchemas, checkVersion } from "./providers/appSlice";
import { useEffect, useState } from "react";
import { IconAccessPointOff } from "@tabler/icons-react";
import classes from './Router.module.css';
import Setup from "./routes/General/Setup/Setup";
import Login from "./routes/General//Auth/Login";
import Logout from "./routes/General//Auth/Logout";
import Schemas from "./routes/Schemas/Schemas";
import Settings from "./routes/General/Settings/Settings";
import SDictionary from "./routes/Schema/Dictionary/Dictionary";
import SSecrets from "./routes/Schema/Secrets/Secrets";
import Files from "./routes/Schema/Files/Files";
import Dictionary from "./routes/General/Dictionary/Dictionary";
import Secrets from "./routes/General/Secrets/Secrets";
import Connectors from "./routes/Schema/Connectors/Connectors";
import TemplateExplorer from "./components/TemplateExplorer";
import Rules from "./routes/Schema/Rules/Rules";
import Editor from "./routes/Schema/Rules/Editor/Editor";
import Schedules from "./routes/Schema/Schedules/Schedules";
import { useTemplater } from "./context/TemplateContext";
import Blueprints from "./routes/Schema/Blueprints/Blueprints";
import Users from "./routes/General/Users/Users";
import Logs from "./routes/General/Logs/Logs";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ShellWrap({ params, section, setSection, Component }: { params: Record<string, string>, section: string, setSection(s: string): void, Component(params: any): JSX.Element }) {
    const { close, opened } = useTemplater();
    return (
    <AppShell navbar={{ width: 280, breakpoint: 0 }}>
        <AppShell.Navbar><Navbar params={params} section={section} setSection={setSection} /></AppShell.Navbar>
        <AppShell.Main className={classes.main} >
            <Drawer zIndex={300} position="right" size="lg" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}} title={<Group><Text>Template Explorer</Text></Group>} >
                {opened&&<TemplateExplorer/>}
            </Drawer>
            <Component params={params} />
        </AppShell.Main>
    </AppShell>
    )
}

export default function Router() {
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
            <Route path="/users">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Users} />}
            </Route>
            <Route path="/logs">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Logs} />}
            </Route>
            <Route path="/dictionary">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Dictionary} />}
            </Route>
            <Route path="/secrets">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Secrets} />}
            </Route>
            <Route path="/app/:schema/dictionary">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={SDictionary} />}
            </Route>
            <Route path="/app/:schema/secrets">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={SSecrets} />}
            </Route>
            <Route path="/app/:schema/blueprints">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Blueprints} />}
            </Route>
            <Route path="/app/:schema/files">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Files} />}
            </Route>
            <Route path="/app/:schema/connectors">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Connectors} />}
            </Route>
            <Route path="/app/:schema/rules">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Rules} />}
            </Route>
            <Route path="/app/:schema/rules/edit">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Editor} />}
            </Route>
            <Route path="/app/:schema/rules/edit/:rule">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Editor} />}
            </Route>
            <Route path="/app/:schema/schedules">
                {(params)=><ShellWrap params={params as Record<string, string>} section={section} setSection={setSection} Component={Schedules} />}
            </Route>
        </Route>
        </>}
      </Switch>
)
}