import { createTheme, MantineProvider, PasswordInput, Select, TextInput, Textarea, MultiSelect } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import { Provider as Redux } from 'react-redux';

import "@mantine/core/styles.css";
import '@mantine/dates/styles.css';
import themeClasses from "./theme.module.css";

import store from "./providers/store";
import AppShell from "./AppShell";
import TemplateProvider from "./context/TemplateProvider";

const inputTheme = {
  classNames: {
    input: themeClasses.input,
  },
};

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  components: {
      TextInput: TextInput.extend(inputTheme),
      PasswordInput: PasswordInput.extend(inputTheme),
      Select: Select.extend(inputTheme),
      Textarea: Textarea.extend(inputTheme),
      NumberInput: Textarea.extend(inputTheme),
      JsonInput: Textarea.extend(inputTheme),
      Autocomplete: Textarea.extend(inputTheme),
      MultiSelect: MultiSelect.extend({ classNames: { pill: themeClasses.pill, ...inputTheme.classNames } }),
  },
});

//function Router2() {
//    const dispatch = useDispatch();
//    const setup = useSelector(isSetup);
//    const [_, setLocation] = useLocation();
//    useEffect(()=>{
//      dispatch(loadApp()).then(setup=> setup ? null : setLocation(`/setup`))
//      .then(()=>dispatch(loadSettings()));
//    }, []);
//    return (
//    <Switch>
//        <Route path="/login" component={Login} />
//        <Route path="/logout" component={Logout} />
//        {!setup&&<Route path="/setup" component={Setup} />}
//        {!setup&&<Route path="/setup/:step" component={Setup} />}
//        <Route path="/schemas" component={Schemas} />
//        <Route><AppLayout/></Route>
//    </Switch>
//    )
//}

function Router() {
    return <AppShell/>
}

export default function App() {

    return (
    <Redux store={store}>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <TemplateProvider>
                <ModalsProvider>
                        <Router/>
                </ModalsProvider>
            </TemplateProvider>
        </MantineProvider>
    </Redux>
    )
}
