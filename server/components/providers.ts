import CSV from "./providers/CSV";
import { base_provider } from "./providers/base";

export const providers: { [id: string]: typeof base_provider } = {
    csv: CSV,
};
