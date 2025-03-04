import { PreviewComponentProps } from "../../models";
import React from "react";
import { EnumValuesChip } from "./CustomChip";


export function NumberPreview({
                                  name,
                                  value,
                                  property,
                                  size
                              }: PreviewComponentProps<number>): React.ReactElement {

    if (property.config?.enumValues) {
        const enumKey = value;
        const enumValues = property.config.enumValues;
        return <EnumValuesChip
            enumKey={enumKey}
            enumValues={enumValues}
            small={size !== "regular"}/>;
    } else {
        return <>{value}</>;
    }
}
