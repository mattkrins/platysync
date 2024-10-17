import { Drawer, Group, Text } from '@mantine/core'
import { useTemplate } from '../context/TemplateContext';

export default function TemplateExplorer() {
    const { close, opened, input } = useTemplate();
    const focusInput = () => {
        if (!input) return;
        input.focus();
        input.value = `${input.value} TEST`;
    }
    return (
    <Drawer zIndex={300} position="right" size="lg" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}} title={<Group><Text>Template Explorer</Text></Group>} >
        <button onClick={()=>focusInput()}>test</button>
    </Drawer>
    )
}
