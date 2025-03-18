/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * AWS Lambda用のmultipart/form-dataパーサーの型定義
 * マルチパートリクエストをパースするためのモジュールです
 */
declare module 'aws-lambda-multipart-parser' {
    /**
     * イベントからフォームデータをパースしてJavaScriptオブジェクトに変換します
     * 
     * @param event - AWS Lambdaハンドラーが受け取るイベントオブジェクト
     * @param spotText - テキストコンテンツを単一のエントリとして処理するかどうかのフラグ
     * @returns パースされたフォームデータを含むオブジェクト
     *          - ファイルの場合: {fieldname: {filename, contentType, content}, ...}
     *          - テキストの場合: {fieldname: value, ...}
     */
    export function parse(event: any, spotText: boolean): any;
}