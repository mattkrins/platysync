import { UseFormReturnType } from "@mantine/form";
import SelectConnector from "../../../Common/SelectConnector.tsx";
import { Text, Slider, Switch } from "@mantine/core";

interface Props { form: UseFormReturnType<Rule>, name: string }
export default function STMC( { form, name }: Props ) {
  return (
    <>
      <SelectConnector clearable
      label="EduHUB Match"
      description="Find and add active CASES codes from EduHUB data."
      {...form.getInputProps(`config.${name}.match`)}
      type="csv"
      />
      {form.getInputProps(`config.${name}.match`).value&&<>
      <Text mt="xs">Match Certainty</Text>
      <Text c="dimmed" inline size="xs" >Control how certain the algorithm must be to match.</Text>
      <Slider mt="xs"
      min={0} max={10}
      />
      <Switch mt="md"
      label="Include Inactive"
      description="LEFT, LVNG & DEL accounts will also be matched."
      {...form.getInputProps(`config.${name}.inactive`, { type: 'checkbox' })}
      />
      </>}
    </>
  )
}
