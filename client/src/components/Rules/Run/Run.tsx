import { ActionIcon, Group, Modal, Stepper, Text } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import Conditions from "../Editor/Conditions";
import { useForm } from "@mantine/form";
import { IconEqualNot, IconListSearch, IconMaximize, IconMinimize, IconRun,IconViewportNarrow, IconViewportWide, IconX } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI";
import SchemaContext from "../../../providers/SchemaContext";
import Progress from "../RunModal/Progress";
import { useDisclosure, useFullscreen } from "@mantine/hooks";
import Evaluate from "./Evaluate";

export default function RunModal( { rule, close }: { rule?: Rule, close: ()=>void } ) {
    const { schema } = useContext(SchemaContext);
    const { toggle: toggleFS, fullscreen } = useFullscreen();
    const [maximized, { toggle: toggleMax }] = useDisclosure(false);
    const [active, setActive] = useState(0);

    const initialValues = {
        secondaries: [],
        conditions: [],
        actions: []
      } as unknown as Rule;
    const form = useForm({ initialValues, validate: {} });
    useEffect(()=>{
        form.reset();
        if (rule) {form.setValues(rule as never)}
    }, [ rule ]);


    const { data: matchResults, post: evaluate, loading: l1, reset: r1, setData: setMatchResults } = useAPI({
        url: `/schema/${schema?.name}/rules/match`,
        default: { matches: [] },
        data: {...rule, conditions: form.values.conditions},
    });

    const close2 = () => { close(); setActive(0) };

    useEffect(()=>{
       if (active==1) evaluate();
    }, [ active ]);

    return (
        <Modal fullScreen={fullscreen} size={maximized?"100%":"auto"} opened={!!rule} onClose={close2} closeOnClickOutside={false} withCloseButton={false} >
            <Group justify="space-between" mb="sm">
            <Text>Run {rule?.name}</Text>
            <ActionIcon.Group>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleMax}>{maximized?<IconViewportNarrow/>:<IconViewportWide />}</ActionIcon>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleFS}>{fullscreen?<IconMinimize/>:<IconMaximize />}</ActionIcon>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={close2}><IconX/></ActionIcon>
            </ActionIcon.Group>
            </Group>
            <Stepper active={active} onStepClick={setActive}>
                <Stepper.Step label="Conditions" description="Modify Conditions" icon={<IconEqualNot />} >
                    <Conditions showLDAP={false} form={form} label="Add single-run modifications here."  />
                </Stepper.Step>
                <Stepper.Step label="Evaluate" color="red" description="Find Matches" loading={l1} icon={<IconListSearch />} allowStepSelect={form.values.conditions.length>0} >
                <Evaluate/>
                <Group justify="center" ><Progress resultant={false} /></Group>
                </Stepper.Step>
                <Stepper.Step label="Execute" description="Perform Actions" icon={<IconRun />} allowStepSelect={false} >
                Execute
                </Stepper.Step>
                <Stepper.Completed>
                    Completed, click back button to get to previous step
                </Stepper.Completed>
            </Stepper>
        </Modal>
    )
}
