import { ActionIcon, Group, Modal, Stepper, Text, Notification } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import Conditions from "../Editor/Conditions";
import { useForm } from "@mantine/form";
import { IconEqual, IconListSearch, IconMaximize, IconMinimize, IconRun,IconViewportNarrow, IconViewportWide, IconX } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI";
import SchemaContext from "../../../providers/SchemaContext";
import { useDisclosure, useFullscreen } from "@mantine/hooks";
import Evaluate from "./Evaluate";
import Status from "../RunModal/Status";

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

    const { data: evaluated, post: evaluate, loading: l1, reset: r1, error: e1, setData: setEvaluated } = useAPI({
        url: `/schema/${schema?.name}/rules/match`,
        default: { evaluated: [] },
        data: {...rule, conditions: form.values.conditions},
    });
    const checkedCount: number = evaluated.evaluated.filter((r: {checked: boolean})=>r.checked).length;

    const close2 = () => { close(); r1(); setActive(0); if (fullscreen) toggleFS(); };

    useEffect(()=>{
       if (active==1) evaluate();
       if (active==0) r1();
    }, [ active ]);

    const taken = (form.values.secondaries||[]).map(s=>s.primary);
    const sources = [form.values.primary, ...taken];

    return (
        <Modal fullScreen={fullscreen} size={maximized?"100%":"auto"} opened={!!rule} onClose={()=>null} closeOnClickOutside={false} withCloseButton={false} >
            <Group justify="space-between" mb="sm">
                <Text>Run {rule?.name}</Text>
                <ActionIcon.Group>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleMax}>{maximized?<IconViewportNarrow/>:<IconViewportWide />}</ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleFS}>{fullscreen?<IconMinimize/>:<IconMaximize />}</ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={close2}><IconX/></ActionIcon>
                </ActionIcon.Group>
            </Group>
            <Stepper active={active} onStepClick={setActive}>
                <Stepper.Step label="Conditions" color={form.values.conditions.length===0?"red":undefined} description="Modify Conditions" icon={<IconEqual />} >
                    <Conditions form={form} label="Add single-run modifications here."  sources={sources}  />
                </Stepper.Step>
                <Stepper.Step
                label="Evaluate"
                description="Find Matches"
                color={e1&&"red"}
                loading={l1}
                icon={<IconListSearch color={form.values.conditions.length===0?"gray":undefined} />}
                allowStepSelect={form.values.conditions.length>0&&!e1}
                styles={form.values.conditions.length===0?{step:{cursor:"not-allowed"}}:undefined}
                >
                    {e1?<Notification icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error!">
                        {e1}
                    </Notification>:(l1?<Group justify="center" ><Status resultant={false} /></Group>:<Evaluate evaluated={evaluated.evaluated} setEvaluated={setEvaluated} />)
                    }
                </Stepper.Step>
                <Stepper.Step
                label="Execute"
                description={`Perform ${checkedCount} Actions`}
                icon={<IconRun color={checkedCount===0?"gray":undefined} />}
                allowStepSelect={checkedCount>0}
                styles={checkedCount===0?{step:{cursor:"not-allowed"}}:undefined}
                >
                Execute
                </Stepper.Step>
                <Stepper.Completed>
                    Completed, click back button to get to previous step
                </Stepper.Completed>
            </Stepper>
        </Modal>
    )
}
