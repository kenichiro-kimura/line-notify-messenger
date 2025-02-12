# line-notify-messenger

このプロジェクトは、LINE Notifyの代わりに利用できるボットを提供します。Node.jsを使用してLINE Messaging APIを利用してメッセージを送信します。  
AWS Lambdaをデプロイ先として使用します。  

## 構成

- `src/handler.ts`: AWS Lambdaのエントリポイント。LINE Messaging APIからのイベントを処理する関数を定義しています。
- `src/lineService.ts`: LINE Messaging APIとのインタラクションを管理するサービスクラスを定義しています。メッセージの送信や受信を行うメソッドが含まれています。
- `bin/line-notify-messenger.ts`: AWS CDKアプリケーションのエントリポイント。スタックを作成し、デプロイするための設定を行います。
- `lib/lambda-stack.ts`: AWSリソースを定義するCDKスタック。AWS Lambda関数の設定が記述されています。
- `tsconfig.json`: TypeScriptのコンパイル設定を含むファイル。コンパイラオプションやコンパイル対象のファイルを指定します。
- `package.json`: npmの設定ファイル。プロジェクトの依存関係やスクリプトをリストしています。
- `tests/`: テストファイルを格納するディレクトリ。Jestを使用してテストを実行します。
- `jest.config.js`: Jestの設定ファイル。テストの設定を記述します。
- `cdk.json`: CDKアプリケーションの設定ファイル。アプリケーションのエントリポイントやスタックの設定を記述します。

## セットアップ手順

1. リポジトリをクローンします。
2. 必要な依存関係をインストールします。
   ```
   npm install
   ```
3. AWS CDKを使用してスタックをデプロイします。
   ```
   npm run deploy
   ```

## 使用方法

1. LINE Messaging APIの設定を行い、必要なトークンを取得して、Lambdaの環境変数`LINE_CHANNEL_ACCESS_TOKEN`に設定してください
2. Lambdaの環境変数AUTHORIZATION_TOKENに、LINE Notifyで使っていたトークンを設定してください
3. ボット自体は、何を受け付けても固定のメッセージを返します。
4. {LINE_BOT_URL}/notify に対して、LINE Notifyと同じPOSTリクエストを送信すると、ボットのLINEアカウントのブロードキャストメッセージとして送信されますので、LINE Notifyで使っていたURLを差し替えてそのまま動きます。この動作にはAuthorizationヘッダが必要です。
