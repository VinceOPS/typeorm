import { getMetadataArgsStorage } from "../..";
import { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs";
import { ColumnOptions } from "../options/ColumnOptions";

/**
 * ReturnedColumn decorator used to mark a column as being part of
 */
export function ReturnedColumn(options: ColumnOptions = {}): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().returnedColumns.push({
            target: object.constructor,
            propertyName: propertyName,
            options: options,
        } as ColumnMetadataArgs);
    };
}
