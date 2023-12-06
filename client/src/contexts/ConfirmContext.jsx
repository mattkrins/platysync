import { createContext, useContext, useState ,useEffect } from 'react'
import { Button, Header, Icon, Modal } from 'semantic-ui-react'

const Context = createContext({});
export const useConfirmer = () => useContext(Context);
export default Context;

const defaults = {
  icon: "question circle outline",
  title: "Confirm Action",
  content: "Are you sure you want to perform this action?"
}
export function ContextProvider(props) {
    const [ options, setOptions ] = useState(defaults);
    const [ open, setOpen ] = useState(false);
    const close = () => {setOpen(false); setOptions(defaults); }
    const confirm = (opt={}) => {
        setOptions({...options, ...opt});
        setOpen(true);
    }
    return (
        <Context.Provider value={{ options, confirm, close, open: ()=> setOpen(true) }}>
            {
                open && <Modal
                basic
                onClose={close}
                onOpen={() => setOpen(true)}
                open={open}
                size='small'
                >
                <Header icon>
                  <Icon name={options.icon} />
                  {options.title}
                </Header>
                <Modal.Content>
                  <p>
                    {options.content}
                  </p>
                </Modal.Content>
                <Modal.Actions>
                  <Button basic color='red' inverted onClick={() => {
                    if (options.catch) options.catch(options);
                    if (options.finally) options.finally(options);
                    if (!options.hold) close();
                  }}>
                    <Icon name='remove' /> No
                  </Button>
                  <Button color='green' inverted onClick={() => {
                    if (options.then) options.then(options);
                    if (options.finally) options.finally(options);
                    if (!options.hold) close();
                  }}>
                    <Icon name='checkmark' /> Yes
                  </Button>
                </Modal.Actions>
              </Modal>
            }
            {props.children}
        </Context.Provider>
      );
}
