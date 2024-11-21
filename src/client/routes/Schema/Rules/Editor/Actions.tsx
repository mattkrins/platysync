import { Anchor, Box, Divider, Text } from "@mantine/core";
import { availableAction } from "../../../../modules/actions";
import { editorTab } from "./Editor";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Action from "./Action";
import ActionButton from "../../../../components/ActionButton";
import useRule from "../../../../hooks/useRule";
import { operation } from "./operations";

export default function Actions({ form, setTab }: editorTab) {
    const add = (type: string) => (c: operation) => form.insertListItem(type, { id: c.name, enabled: true, ...c.initialValues });
    const { sourceProConnectors } = useRule(form.values);
    const ruleTypes = sourceProConnectors.map(c=>c.id);
    return (
    <Box>
        <Divider my="xs" label={<ActionButton add={add("initActions")} label="Initial Action" allowedProviders={ruleTypes} />} labelPosition="right" />
        <DragDropContext onDragEnd={(result) => {
            const { destination, source } = result;
            if (!destination) return;
            if (destination.droppableId === source.droppableId) {
                if (source.index === destination.index) return;
                return form.reorderListItem(destination.droppableId, { from: source.index, to: destination? destination.index : 0 })
            }
            const clone = structuredClone(form.values[source.droppableId as "initActions"][source.index]);
            form.removeListItem(source.droppableId, source.index);
            form.insertListItem(destination.droppableId, clone, destination.index);
        } } >
            {form.values.initActions.length<=0&&<Text size="xs" c="dimmed" >Initial actions are executed at the begining of rules unconditionally.</Text>}
            <Droppable droppableId="initActions" direction="vertical" type="action" >
                {(provided) => (
                <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                    {(form.values.initActions||[]).map((action, index)=>
                    <Action key={`init${index}`} type="initActions" index={index} action={action} form={form} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            <Divider my="xs" label={<ActionButton add={add("iterativeActions")} label="Iterative Action" disabled={!form.values.primary} allowedProviders={ruleTypes} />} labelPosition="right" />
            {!form.values.primary ? <Text size="xs" c="dimmed" >Select a <Anchor onClick={()=>setTab("settings")} >primary data source</Anchor> to execute iterative actions for each row, entry, user, etc.</Text>:
            form.values.iterativeActions.length<=0&&
            <Text size="xs" c="dimmed" >Iterative actions are executed for each row, entry, user, etc.
            {form.values.conditions.length>0&&<> if they pass {form.values.conditions.length} <Anchor onClick={()=>setTab("conditions")} >conditional</Anchor> checks.</>}</Text>}
            <Droppable droppableId="iterativeActions" direction="vertical" type="action" >
                {(provided) => (
                <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                    {form.values.iterativeActions.map((action, index)=>
                    <Action key={`iterative${index}`} type="iterativeActions" index={index} action={action} form={form} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            <Divider my="xs" label={<ActionButton add={add("finalActions")} label="Final Action" allowedProviders={ruleTypes} />} labelPosition="right" />
            {form.values.finalActions.length<=0&&<Text size="xs" c="dimmed" >Final actions are executed at the end of rules if all iterative actions succeeded.</Text>}
            <Droppable droppableId="finalActions" direction="vertical" type="action" >
                {(provided) => (
                <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                    {(form.values.finalActions||[]).map((action, index)=>
                    <Action key={`final${index}`} type="finalActions" index={index} action={action} form={form} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
        </DragDropContext>
    </Box>
  )
}
