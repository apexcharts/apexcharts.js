import { ExternalObject } from '../native';
export declare function getDbConnection(opts?: {
    directory?: string;
    dbName?: string;
}): ExternalObject<NxDbConnection>;
export declare function removeDbConnections(): void;
