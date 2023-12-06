import { Combobox, InputBase, useCombobox } from '@mantine/core';
import { useEffect, useState } from 'react';

interface Props {
    selectable?: string[];
    onChange?(value: string): void;
    value?: string;
    createLabel?(search: string): string;
}
export function SelectCreatable({ selectable = [], value: v2 = '', onChange, createLabel }: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const deduplicated = v2 ? [...selectable, v2].filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  }) : selectable
  const [data, setData] = useState(deduplicated);
  const [value, setValue] = useState<string | null>(v2||null);
  const [search, setSearch] = useState(v2||'');
  useEffect(()=>{
    setSearch(v2)
  }, [v2])

  const exactOptionMatch = data.some((item) => item === search);
  const filteredOptions = exactOptionMatch
    ? data
    : data.filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()));

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === '$create') {
          setData((current) => [...current, search]);
          setValue(search);
          if (onChange) onChange(search);
        } else {
          setValue(val);
          if (onChange) onChange(val);
        }

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(v2||value || '');
          }}
          placeholder="Search value"
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      {(data.length>0||search.length>0)&&<Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">{createLabel?createLabel(search):` + Create ${search}`}</Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>}
    </Combobox>
  );
}