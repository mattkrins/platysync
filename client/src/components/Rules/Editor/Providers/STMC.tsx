import { UseFormReturnType } from "@mantine/form";
import { provider } from "../../../../modules/connectors.ts";
import SelectConnector from "../../../Common/SelectConnector.tsx";
import { Text, Slider, Switch } from "@mantine/core";

interface Props { form: UseFormReturnType<Rule>, k: string, provider: provider }
export default function STMC( { form, k }: Props ) {
  return (
    <>
      <SelectConnector clearable
      label="EduHUB Match"
      description="Find and add active CASES codes from EduHUB data."
      {...form.getInputProps(`${k}eduhub`)}
      type="csv"
      //disabled={(form.values.secondaries||[]).length>0}
      //filter={data=>data.filter(c=>c.id==="proxy")  }
      />
      {form.getInputProps(`${k}.eduhub`).value&&<>
      <Text mt="xs">Match Certainty</Text>
      <Text c="dimmed" inline size="xs" >Control how certain the algorithm must be to match.</Text>
      <Slider mt="xs"
      min={0} max={10}
      />
      <Switch mt="md"
      label="Include Inactive"
      description="LEFT, LVNG & DEL accounts will also be matched."
      {...form.getInputProps(`${k}eduhub_inactive`, { type: 'checkbox' })}
      />
      </>}
    </>
  )
}
