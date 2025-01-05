import { HandlerResult } from './server';
export declare function handleRecordOutputsHash(payload: {
    type: string;
    data: {
        outputs: string[];
        hash: string;
    };
}): Promise<HandlerResult>;
export declare function handleOutputsHashesMatch(payload: {
    type: string;
    data: {
        outputs: string[];
        hash: string;
    };
}): Promise<HandlerResult>;
