import {
    ArrayProperty,
    EntitySchema,
    NumberProperty,
    Property,
    ReferenceProperty,
    StringProperty,
    TimestampProperty
} from "../models";
import React, { useCallback, useEffect, useState } from "react";
import { TableInput } from "./fields/TableInput";
import { TableSelect } from "./fields/TableSelect";
import { NumberTableInput } from "./fields/TableNumberInput";
import { TableSwitch } from "./fields/TableSwitch";
import { TableDateField } from "./fields/TableDateField";
import { ErrorBoundary } from "../components";
import { PreviewComponent } from "../preview";
import { CellStyleProps } from "./styles";
import { TableReferenceField } from "./fields/TableReferenceField";

import firebase from "firebase/app";
import "firebase/firestore";
import { getPreviewSizeFrom } from "../preview/util";
import { useClearRestoreValue } from "../hooks";
import deepEqual from "deep-equal";
import { isReadOnly } from "../models/utils";
import TableCell from "./TableCell";
import { AnySchema } from "yup";


export interface PropertyTableCellProps<T, S extends EntitySchema<Key>, Key extends string> {
    name: string;
    selected: boolean;
    value: T;
    select: (cellRect: DOMRect | undefined) => void;
    openPopup: () => void;
    setPreventOutsideClick: (value: boolean) => void;
    focused: boolean;
    setFocused: (value: boolean) => void;
    property: Property<T>;
    height: number;
    width: number;
    validation: AnySchema;
    onValueChange?: (params: OnCellChangeParams<T>) => void
}

/**
 * Props passed in a callback when the content of a cell in a table has been edited
 */
export type OnCellChangeParams<T> = { value: T, name: string, setError: (e: Error) => void };

const PropertyTableCell = <T, S extends EntitySchema<Key>, Key extends string>({
                                                                                   selected,
                                                                                   focused,
                                                                                   name,
                                                                                   setPreventOutsideClick,
                                                                                   setFocused,
                                                                                   onValueChange,
                                                                                   select,
                                                                                   openPopup,
                                                                                   value,
                                                                                   property,
                                                                                   validation,
                                                                                   size,
                                                                                   align,
                                                                                   width,
                                                                                   height
                                                                               }: PropertyTableCellProps<T, S, Key> & CellStyleProps) => {

    const [internalValue, setInternalValue] = useState<any | null>(value);

    useClearRestoreValue<T>({
        property,
        value: internalValue,
        setValue: setInternalValue
    });

    const [error, setError] = useState<Error | undefined>();

    const customField = Boolean(property.config?.field);
    const customPreview = Boolean(property.config?.preview);
    const readOnly = isReadOnly(property);
    const disabledTooltip: string | undefined = typeof property.disabled === "object" ? property.disabled.disabledMessage : undefined;
    let disabled = Boolean(property.disabled);

    const onBlur = () => {
        setFocused(false);
    };

    useEffect(
        () => {
            if (value !== internalValue) {
                validation
                    .validate(value)
                    .then(() => {
                        setError(undefined);
                    })
                    .catch((e) => {
                        console.error(e);
                        setError(e);
                    });
                setInternalValue(value);
            }
        },
        [value]
    );

    useEffect(
        () => {
            if (!deepEqual(value, internalValue)) {
                validation
                    .validate(internalValue)
                    .then(() => {
                        setError(undefined);
                        if (onValueChange)
                            onValueChange({ value: internalValue, name, setError });
                    })
                    .catch((e) => {
                        console.error(e);
                        setError(e);
                    });
            }
        },
        [internalValue]
    );

    const updateValue = useCallback(
        (newValue: any | null) => {

            let updatedValue: any;
            if (newValue === undefined) {
                updatedValue = null;
            } else {
                updatedValue = newValue;
            }
            setInternalValue(updatedValue);
        },
        []
    );

    let innerComponent: JSX.Element | undefined;
    let allowScroll = false;
    let showExpandIcon = false;

    if (!readOnly && !customField && (!customPreview || selected)) {
        if (selected && property.dataType === "number") {
            const numberProperty = property as NumberProperty;
            if (numberProperty.config?.enumValues) {
                innerComponent = <TableSelect name={name as string}
                                              multiple={false}
                                              disabled={disabled}
                                              focused={focused}
                                              valueType={"number"}
                                              enumValues={numberProperty.config.enumValues}
                                              error={error}
                                              onBlur={onBlur}
                                              internalValue={internalValue as string | number}
                                              updateValue={updateValue}
                                              setPreventOutsideClick={setPreventOutsideClick}
                />;
            } else {
                innerComponent = <NumberTableInput
                    align={align}
                    error={error}
                    focused={focused}
                    disabled={disabled}
                    onBlur={onBlur}
                    value={internalValue as number}
                    updateValue={updateValue}
                />;
                allowScroll = true;
            }
        } else if (selected && property.dataType === "string") {
            const stringProperty = property as StringProperty;
            if (stringProperty.config?.enumValues) {
                innerComponent = <TableSelect name={name as string}
                                              multiple={false}
                                              focused={focused}
                                              disabled={disabled}
                                              valueType={"string"}
                                              enumValues={stringProperty.config.enumValues}
                                              error={error}
                                              onBlur={onBlur}
                                              internalValue={internalValue as string | number}
                                              updateValue={updateValue}
                                              setPreventOutsideClick={setPreventOutsideClick}
                />;
            } else if (!stringProperty.config?.storageMeta && !stringProperty.config?.markdown) {
                const multiline = !!stringProperty.config?.multiline;
                innerComponent = <TableInput error={error}
                                             disabled={disabled}
                                             multiline={multiline}
                                             focused={focused}
                                             value={internalValue as string}
                                             updateValue={updateValue}
                />;
                allowScroll = true;
            }
        } else if (property.dataType === "boolean") {
            innerComponent = <TableSwitch error={error}
                                          disabled={disabled}
                                          focused={focused}
                                          internalValue={internalValue as boolean}
                                          updateValue={updateValue}
            />;
        } else if (property.dataType === "timestamp") {
            innerComponent = <TableDateField name={name as string}
                                             error={error}
                                             disabled={disabled}
                                             focused={focused}
                                             internalValue={internalValue as Date}
                                             updateValue={updateValue}
                                             property={property as TimestampProperty}
                                             setPreventOutsideClick={setPreventOutsideClick}
            />;
            allowScroll = true;
        } else if (property.dataType === "reference") {
            innerComponent = <TableReferenceField name={name as string}
                                                  internalValue={internalValue as firebase.firestore.DocumentReference}
                                                  updateValue={updateValue}
                                                  disabled={disabled}
                                                  size={size}
                                                  property={property as ReferenceProperty}
                                                  setPreventOutsideClick={setPreventOutsideClick}
            />;
            allowScroll = true;
        } else if (property.dataType === "array") {
            const arrayProperty = (property as ArrayProperty);
            if (!arrayProperty.of) {
                throw Error(`You need to specify an 'of' prop (or specify a custom field) in your array property ${name}`);
            }
            if (arrayProperty.of.dataType === "string" || arrayProperty.of.dataType === "number") {
                if (selected && arrayProperty.of.config?.enumValues) {
                    innerComponent = <TableSelect name={name as string}
                                                  multiple={true}
                                                  disabled={disabled}
                                                  focused={focused}
                                                  valueType={arrayProperty.of.dataType}
                                                  enumValues={arrayProperty.of.config.enumValues}
                                                  error={error}
                                                  onBlur={onBlur}
                                                  internalValue={internalValue as string | number}
                                                  updateValue={updateValue}
                                                  setPreventOutsideClick={setPreventOutsideClick}
                    />;
                    allowScroll = true;
                }
            } else if (arrayProperty.of.dataType === "reference") {
                innerComponent = <TableReferenceField name={name as string}
                                                      disabled={disabled}
                                                      internalValue={internalValue as firebase.firestore.DocumentReference[]}
                                                      updateValue={updateValue}
                                                      size={size}
                                                      property={property as ArrayProperty}
                                                      setPreventOutsideClick={setPreventOutsideClick}
                />;
                allowScroll = false;
            }
        }
    }

    if (!innerComponent) {
        allowScroll = false;
        showExpandIcon = selected && !innerComponent && !disabled && !readOnly;
        innerComponent = (
            <ErrorBoundary>
                <PreviewComponent
                    width={width}
                    height={height}
                    name={name as string}
                    value={internalValue}
                    property={property}
                    size={getPreviewSizeFrom(size)}
                />
            </ErrorBoundary>
        );
    }

    return (
        <TableCell
            select={select}
            selected={selected}
            focused={focused}
            disabled={disabled || readOnly}
            disabledTooltip={disabledTooltip ?? "Disabled"}
            size={size}
            error={error}
            align={align}
            allowScroll={allowScroll}
            showExpandIcon={showExpandIcon}
            openPopup={!disabled ? openPopup : undefined}
        >

            {innerComponent}

        </TableCell>
    );

};

export default React.memo<PropertyTableCellProps<any, any, any> & CellStyleProps>(PropertyTableCell) as React.FunctionComponent<PropertyTableCellProps<any, any, any> & CellStyleProps>;


