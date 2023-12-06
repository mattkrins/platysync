import { useState } from 'react';
import { Modal, Header } from 'semantic-ui-react'

const useModal = (options = {}) => {
    const [ isOpen, shouldShow ] = useState(false);
    const close = (before) => { if (before) before(); shouldShow(false); }
    const open = (before) => { if (before) before(); shouldShow(true); }
    const Dialog = ({ children, name, icon, actions, ...props })=>{
        return isOpen && <Modal
            open={isOpen}
            dimmer="blurring"
            centered={false}
            size="fullscreen"
            {...options}
            {...props}
            onOpen={() => { if (props.onOpen) props.onOpen();  shouldShow(true); }}
            onClose={() => { if (props.onClose) props.onClose();  shouldShow(false); }}
        >
        <Header icon={icon||options.icon} content={name||options.name} ></Header>
        <Modal.Content>{children}</Modal.Content>
        {actions}
        </Modal>
    }
    return {Modal: Dialog, open, close}
};

export default useModal;

