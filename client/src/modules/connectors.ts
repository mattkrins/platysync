import { IconBinaryTree2, IconFileTypeCsv, IconSchool, IconNetwork, TablerIconsProps } from "@tabler/icons-react";
import STMC from "../components/Rules/Editor/Providers/STMC";
import { UseFormReturnType } from "@mantine/form";

export interface provider {
    id: string;
    name: string;
    icon: (props: TablerIconsProps) => JSX.Element;
    color: string;
    proxy?: true;
    Config?: (props: { form: UseFormReturnType<Rule>, provider: provider, k: string }) => JSX.Element;
}

export const providers: {
    [name: string]: provider
} = {
  ldap: {
      id: 'ldap',
      name: "Lightweight Directory Access Protocol (LDAP)",
      icon: IconBinaryTree2,
      color: 'blue'
  },
  //aad: {
  //    id: 'aad',
  //    name: "Azure Active Directory (Azure AD)",
  //    Icon: IconTopologyRing,
  //    color: 'indigo'
  //},
  //aad: {
  //    id: 'canvas',
  //    name: "Canvas (Instructure)",
  //    Icon: IconCircleDashed,
  //    color: 'red'
  //},
  csv: {
      id: 'csv',
      name: "Comma-Separated Values (CSV)",
      icon: IconFileTypeCsv,
      color: 'teal'
  },
  stmc: {
      id: 'stmc',
      name: "eduSTAR Management Centre (STMC)",
      icon: IconSchool,
      color: 'yellow',
      Config: STMC
  },
  proxy: {
      id: 'proxy',
      name: "Corporate Proxy Server",
      icon: IconNetwork,
      color: 'orange'
  },
};
export default providers;