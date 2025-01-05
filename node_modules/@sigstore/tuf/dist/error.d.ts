type TUFErrorCode = 'TUF_INIT_CACHE_ERROR' | 'TUF_FIND_TARGET_ERROR' | 'TUF_REFRESH_METADATA_ERROR' | 'TUF_DOWNLOAD_TARGET_ERROR' | 'TUF_READ_TARGET_ERROR';
export declare class TUFError extends Error {
    code: TUFErrorCode;
    cause: any | undefined;
    constructor({ code, message, cause, }: {
        code: TUFErrorCode;
        message: string;
        cause?: any;
    });
}
export {};
