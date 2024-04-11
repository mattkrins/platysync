import { ActionIcon, Group, Modal, Stepper, Text, Notification } from "@mantine/core";
import { useContext, useEffect, useMemo, useState } from "react";
import Conditions from "../Editor/Conditions";
import { useForm } from "@mantine/form";
import { IconEqual, IconListSearch, IconMaximize, IconMinimize, IconRun,IconViewportNarrow, IconViewportWide, IconX } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI2";
import SchemaContext from "../../../providers/SchemaContext2";
import { useDisclosure, useFullscreen } from "@mantine/hooks";
import Evaluate from "./Evaluate";
import Status from "./Status";

interface result {template?: object, success?: boolean, error?: string, warning?: string, data?: { [k:string]: string }}
interface evaluated { id: string, display?: string, actions: { name: string, result: result }[], actionable: boolean, checked?: boolean }

export default function RunModal( { rule, close, test }: { rule?: Rule, close: ()=>void, test?: boolean } ) {
    const { name } = useContext(SchemaContext);
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

    const { data: evaluated, post: evaluate, loading: l1, reset: r1, error: e1, setData: setEvaluated } = useAPI<response>({
        url: `/schema/${name}/engine`,
        default: { evaluated: [], initActions: [], finalActions: [] },
        data: {...rule, conditions: form.values.conditions, test},
    });
    
    const checked = useMemo(()=> (evaluated.evaluated as evaluated[]).filter(r=>r.checked).map(r=>r.id), [ evaluated.evaluated ]);
    const checkedCount = checked.length;

    const { data: executed, post: execute, loading: l2, reset: r2, error: e2, setData: setExecuted } = useAPI<response>({
        url: `/schema/${name}/engine/execute`,
        default: { evaluated: [], initActions: [], finalActions: [] },
        data: {...rule, conditions: form.values.conditions, evaluated: checked  },
    });

    const close2 = () => { close(); r1(); setActive(0); if (fullscreen) toggleFS(); };

    const onStepClick = (step: number) => {
        if (active==0 && step==1){ evaluate(); r2(); }
        if (active==1 && step==2){ execute(); }
        setActive(step);
    }

    const taken = (form.values.secondaries||[]).map(s=>s.primary);
    const sources = [form.values.primary, ...taken];

    return (
        <Modal fullScreen={fullscreen} size={maximized?"100%":"auto"} opened={!!rule} onClose={()=>null} closeOnClickOutside={false} withCloseButton={false} >
            <Group justify="space-between" mb="sm">
                <Text>{test?'Test':'Run'} {rule?.name}</Text>
                <ActionIcon.Group>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleMax}>{maximized?<IconViewportNarrow/>:<IconViewportWide />}</ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleFS}>{fullscreen?<IconMinimize/>:<IconMaximize />}</ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={close2}><IconX/></ActionIcon>
                </ActionIcon.Group>
            </Group>
            <Stepper active={active} onStepClick={onStepClick}>
                <Stepper.Step label="Conditions" color={form.values.conditions.length===0?"red":undefined} description="Modify Conditions" icon={<IconEqual />} >
                    <Conditions form={form} label="Add single-run modifications here." allow={sources}  />
                </Stepper.Step>
                <Stepper.Step
                label="Evaluate"
                description="Find Matches"
                color={e1&&"red"}
                loading={l1}
                icon={<IconListSearch color={form.values.conditions.length===0?"gray":undefined} />}
                allowStepSelect={form.values.conditions.length>0}
                styles={form.values.conditions.length===0?{step:{cursor:"not-allowed"}}:undefined}
                >
                    {e1?<Notification icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error!">
                        {e1}
                    </Notification>:(l1?<Group justify="center" ><Status resultant={false} /></Group>:
                    <Evaluate
                    evaluated={evaluated.evaluated}
                    setEvaluated={setEvaluated}
                    initActions={evaluated.initActions}
                    finalActions={evaluated.finalActions}
                    executed={test}
                    />)
                    }
                </Stepper.Step>
                {!test&&<Stepper.Step miw={180}
                label="Execute"
                description={`Perform ${checkedCount} Actions`}
                loading={l2}
                icon={<IconRun color={checkedCount===0?"gray":undefined} />}
                allowStepSelect={checkedCount>0}
                styles={checkedCount===0?{step:{cursor:"not-allowed"}}:undefined}
                >
                    {e2?<Notification icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error!">
                        {e2}
                    </Notification>:(l2?<Group justify="center" ><Status resultant={false} /></Group>:
                    <Evaluate
                    evaluated={executed.evaluated}
                    setEvaluated={setExecuted}
                    initActions={executed.initActions}
                    finalActions={executed.finalActions}
                    executed
                    />)
                    }
                </Stepper.Step>}
                <Stepper.Completed>
                    Completed, click back button to get to previous step
                </Stepper.Completed>
            </Stepper>
        </Modal>
    )
}
