/// <reference types="node" />
import { Any } from "./google/protobuf/any";
export interface CloudEvent {
    /** Required Attributes */
    id: string;
    /** URI-reference */
    source: string;
    specVersion: string;
    type: string;
    /** Optional & Extension Attributes */
    attributes: {
        [key: string]: CloudEvent_CloudEventAttributeValue;
    };
    data?: {
        $case: "binaryData";
        binaryData: Buffer;
    } | {
        $case: "textData";
        textData: string;
    } | {
        $case: "protoData";
        protoData: Any;
    };
}
export interface CloudEvent_AttributesEntry {
    key: string;
    value: CloudEvent_CloudEventAttributeValue | undefined;
}
export interface CloudEvent_CloudEventAttributeValue {
    attr?: {
        $case: "ceBoolean";
        ceBoolean: boolean;
    } | {
        $case: "ceInteger";
        ceInteger: number;
    } | {
        $case: "ceString";
        ceString: string;
    } | {
        $case: "ceBytes";
        ceBytes: Buffer;
    } | {
        $case: "ceUri";
        ceUri: string;
    } | {
        $case: "ceUriRef";
        ceUriRef: string;
    } | {
        $case: "ceTimestamp";
        ceTimestamp: Date;
    };
}
export interface CloudEventBatch {
    events: CloudEvent[];
}
export declare const CloudEvent: {
    fromJSON(object: any): CloudEvent;
    toJSON(message: CloudEvent): unknown;
};
export declare const CloudEvent_AttributesEntry: {
    fromJSON(object: any): CloudEvent_AttributesEntry;
    toJSON(message: CloudEvent_AttributesEntry): unknown;
};
export declare const CloudEvent_CloudEventAttributeValue: {
    fromJSON(object: any): CloudEvent_CloudEventAttributeValue;
    toJSON(message: CloudEvent_CloudEventAttributeValue): unknown;
};
export declare const CloudEventBatch: {
    fromJSON(object: any): CloudEventBatch;
    toJSON(message: CloudEventBatch): unknown;
};
