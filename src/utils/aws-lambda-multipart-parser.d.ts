/* eslint-disable  @typescript-eslint/no-explicit-any */
declare module 'aws-lambda-multipart-parser' {
    export function parse(event: any, spotText: boolean): any;
}