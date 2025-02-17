import {
    buildPropertyFrom,
    EntitySchema,
    FilterValues,
    Property
} from "../models";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import {
    Box,
    Button,
    IconButton,
    Popover,
    Table,
    TableBody,
    TableCell as MuiTableCell,
    TableRow,
    Tooltip,
    withStyles
} from "@material-ui/core";
import FilterListIcon from "@material-ui/icons/FilterList";
import React from "react";
import { Form, Formik } from "formik";
import ClearIcon from "@material-ui/icons/Clear";
import StringNumberFilterField from "./filters/StringNumberFilterField";
import BooleanFilterField from "./filters/BooleanFilterField";


const TableCell = withStyles({
    root: {
        borderBottom: "none"
    }
})(MuiTableCell);

interface FilterPopupProps<S extends EntitySchema<Key>, Key extends string> {
    schema: S;

    filterValues?: FilterValues<S, Key>;

    /**
     * Properties that can be filtered
     */
    filterableProperties: Key[];

    onFilterUpdate(filterValues?: FilterValues<S, Key>): void;
}

export default function FilterPopup<S extends EntitySchema<Key>, Key extends string>({
                                                                                         schema,
                                                                                         filterValues,
                                                                                         onFilterUpdate,
                                                                                         filterableProperties
                                                                                     }: FilterPopupProps<S, Key>) {

    function createFilterFields() {

        return (
            <Table size="small">
                <TableBody>
                    {
                        filterableProperties.map((key, index) => {
                            const property = buildPropertyFrom(schema.properties[key as string], {}, undefined);
                            return (
                                <TableRow
                                    key={`filter_table_${key}_${index}`}>
                                    <TableCell
                                        key={`filter-cell-title-${key}`}
                                        component="th"
                                        align={"right"}
                                        width={80}
                                    >
                                        {property.title}
                                    </TableCell>
                                    <TableCell
                                        key={`filter-cell-field-${key}`}
                                        component="th"
                                    >
                                        {createFilterField(key as string, property)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        );
    }

    const cleanedInitialValues: FilterValues<S, Key> = filterValues || {};

    return (
        <PopupState variant="popover" popupId="collection-filter">
            {(popupState) => {

                function setFilters(filterValues?: FilterValues<S, Key>) {
                    if (!filterValues) {
                        onFilterUpdate(undefined);
                    } else {
                        const filters = { ...filterValues };
                        Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
                        onFilterUpdate(filters);
                    }
                    popupState.close();
                }

                const clearSetFiltersView = (
                    <Tooltip title="Clear filter">
                        <IconButton
                            style={{ height: "fit-content" }}
                            size={"small"}
                            aria-label="filter clear"
                            onClick={() => onFilterUpdate(undefined)}>
                            <ClearIcon fontSize={"small"}/>
                        </IconButton>
                    </Tooltip>
                );

                return (
                    <Box display={"flex"}
                         alignItems={"center"}
                         ml={.5}
                         mr={1}>

                        <Tooltip title="Filter list">
                            <IconButton
                                color={filterValues ? "primary" : undefined}
                                aria-label="filter list"  {...bindTrigger(popupState)} >
                                <FilterListIcon/>
                            </IconButton>
                        </Tooltip>

                        {filterValues && clearSetFiltersView}

                        <Popover
                            {...bindPopover(popupState)}
                            elevation={2}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left"
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "left"
                            }}
                        >
                            <Box p={2}>
                                <Formik
                                    initialValues={cleanedInitialValues}
                                    onSubmit={setFilters}
                                >
                                    {({
                                          values,
                                          resetForm,
                                          errors,
                                          touched,
                                          handleChange,
                                          handleBlur,
                                          handleSubmit,
                                          isSubmitting
                                      }) => {
                                        const reset = (e: any) => {
                                            resetForm();
                                            setFilters(undefined);
                                        };
                                        return (
                                            <Form
                                                onSubmit={handleSubmit}
                                                onReset={() => onFilterUpdate(undefined)}
                                                noValidate>
                                                {createFilterFields()}
                                                <Box display="flex"
                                                     justifyContent="flex-end"
                                                     m={2}
                                                     mt={3}>
                                                    <Box mr={1}>
                                                        <Button
                                                            disabled={!filterValues && !Object.keys(values).length}
                                                            color="primary"
                                                            type="reset"
                                                            aria-label="filter clear"
                                                            onClick={reset}>Clear</Button>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        type="submit">Ok</Button>
                                                </Box>
                                            </Form>
                                        );
                                    }}
                                </Formik>
                            </Box>
                        </Popover>
                    </Box>
                );
            }}
        </PopupState>
    );
}

function createFilterField(key: string, property: Property): JSX.Element {

    if (property.dataType === "number" || property.dataType === "string") {
        return <StringNumberFilterField name={key} property={property}/>;
    } else if (property.dataType === "array" && property.of) {
        if (property.of.dataType === "number" || property.of.dataType === "string")
            return <StringNumberFilterField name={key} property={property}/>;
    } else if (property.dataType === "boolean") {
        return <BooleanFilterField name={key} property={property}/>;
    }

    return (
        <div>{`Currently the field ${property.dataType} is not supported`}</div>
    );
}

