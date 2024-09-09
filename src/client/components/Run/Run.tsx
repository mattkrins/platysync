import { ActionIcon, Group, Modal, Stepper, Text } from "@mantine/core";
import { useDisclosure, useFullscreen } from "@mantine/hooks";
import { IconViewportNarrow, IconViewportWide, IconMinimize, IconMaximize, IconX, IconListSearch, IconEqual, IconRun } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import useAPI from "../../hooks/useAPI";
import { useForm } from "@mantine/form";
import Conditions from "../../routes/Rules/Editor/Conditions";
import Evaluate from "./Evaluate";

interface Content {
  rule?: Rule;
  close(): void;
  test?: boolean;
  fullscreen?: boolean;
  maximized?: boolean;
  toggleFS(): void;
  toggleMax(): void;
}

function Content( { rule, close, test, fullscreen, maximized, toggleFS, toggleMax }: Content ) {
  const [active, setActive] = useState(0);
  const form = useForm({ initialValues: rule, validate: {} });
  const { data: evaluated, post: evaluate, loading: l1, reset: r1, error: e1, setData: setEvaluated } = useAPI<response,evalRule>({
    url: `/rule/evaluate`, schema: true,
    default: { primaryResults: [], initActions: [], finalActions: [], columns: [] },
    data: {...rule as Rule, conditions: form.values.conditions, test},
  });
  const close2 = () => { close(); r1(); r2(); setActive(0); if (fullscreen) toggleFS(); };
  const context = useMemo(()=> evaluated.primaryResults.filter(r=>r.checked).map(r=>r.id), [ evaluated.primaryResults ]);
  const initFinalCount = useMemo(()=> [ ...evaluated.initActions, ...evaluated.finalActions ].length, [ evaluated.initActions, evaluated.finalActions ]);
  const count = context.length + initFinalCount;
  const canExecute = count>0;

  const { data: executed, post: execute, loading: l2, reset: r2, error: e2, setData: setExecuted } = useAPI<response,evalRule>({
    url: `/rule/execute`, schema: true,
    default: { primaryResults: [], initActions: [], finalActions: [], columns: [] },
    data: {...rule as Rule, conditions: form.values.conditions, test, context },
  });
  
  const onStepClick = (step: number) => {
    if (active==0 && step==1){ r2(); evaluate(); }
    if (active==1 && step==2){ execute(); }
    if (active==2 && (step==0||step==1)){ r2(); }
    setActive(step);
  }

  return (
  <>
    <Group miw={600} justify="space-between" mb="sm">
      <Text>{test?'Test':'Run'} {rule?.name}</Text>
      <ActionIcon.Group>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleMax}>{maximized?<IconViewportNarrow/>:<IconViewportWide />}</ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleFS}>{fullscreen?<IconMinimize/>:<IconMaximize />}</ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={close2}><IconX/></ActionIcon>
      </ActionIcon.Group>
    </Group>
    <Stepper active={active} onStepClick={onStepClick}>
      <Stepper.Step label="Conditions" description="Modify Conditions" icon={<IconEqual />} ><Conditions form={form} label="Single-run modifications can be added here." compact /></Stepper.Step>
      <Stepper.Step label="Evaluate" description="Find Matches" icon={<IconListSearch />} loading={l1} color={e1?"red":(l1?undefined:(active==1?"lime":undefined))} >
        <Evaluate evaluated={evaluated} setEvaluated={setEvaluated} loading={l1} maximized={maximized||fullscreen} error={e1} />
      </Stepper.Step>
      {!test&&<Stepper.Step label="Execute" description={`Perform ${count} Actions`} icon={<IconRun color={canExecute?undefined:"grey"} />} color={e2?"red":(l2?undefined:"lime")}
      disabled={!canExecute} styles={!canExecute?{step:{cursor:"not-allowed"}}:undefined} loading={l2}
      >
        <Evaluate evaluated={executed} setEvaluated={setExecuted} loading={l2} maximized={maximized||fullscreen} error={e2} execute />
      </Stepper.Step>}
    </Stepper>
  </>)
}

export default function Run( { rule, close, test }: { rule?: Rule, close(): void, test?: boolean } ) {
  const { toggle: toggleFS, fullscreen } = useFullscreen();
  const [maximized, { toggle: toggleMax }] = useDisclosure(false);
  return (
    <Modal fullScreen={fullscreen} size={maximized?"100%":"auto"} opened={!!rule} onClose={()=>null} closeOnClickOutside={false} withCloseButton={false} >
      {rule&&<Content rule={rule} close={close} test={test} fullscreen={fullscreen} maximized={maximized} toggleFS={toggleFS} toggleMax={toggleMax} />}
    </Modal>
  )
}
