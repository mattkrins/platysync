import { UseFormReturnType } from "@mantine/form";
import SelectConnector from "../../../Common/SelectConnector.tsx";
import { Switch, Box } from "@mantine/core";

interface Props { form: UseFormReturnType<Rule>, name: string }
export default function STMC( { form, name }: Props ) {
  return (
    <Box>
      <SelectConnector clearable withinPortal={true}
      label="EduHUB Match"
      description="Find and add active CASES codes from EduHUB data."
      {...form.getInputProps(`config.${name}.match`)}
      type="csv" 
      />
      {form.getInputProps(`config.${name}.match`).value&&<>
      <Switch mt="md"
      label="Include Inactive"
      description="LEFT, LVNG & DEL accounts will also be matched."
      {...form.getInputProps(`config.${name}.inactive`, { type: 'checkbox' })}
      />
      </>}
    </Box>
  )
}
