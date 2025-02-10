# my-line-bot

このプロジェクトは、Node.jsを使用してLINE Messaging APIを利用したボットを構築するためのものです。AWS Lambdaをデプロイ先とし、DynamoDBをデータ保存に使用します。

## 構成

- `src/handler.ts`: AWS Lambdaのエントリポイント。LINE Messaging APIからのイベントを処理する関数を定義しています。
- `src/lineService.ts`: LINE Messaging APIとのインタラクションを管理するサービスクラスを定義しています。メッセージの送信や受信を行うメソッドが含まれています。
- `infrastructure/bin/my-line-bot.ts`: AWS CDKアプリケーションのエントリポイント。スタックを作成し、デプロイするための設定を行います。
- `infrastructure/lib/lineBotStack.ts`: AWSリソースを定義するCDKスタック。AWS Lambda関数やDynamoDBテーブルの設定が記述されています。
- `tsconfig.json`: TypeScriptのコンパイル設定を含むファイル。コンパイラオプションやコンパイル対象のファイルを指定します。
- `package.json`: npmの設定ファイル。プロジェクトの依存関係やスクリプトをリストしています。

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

ボットを使用するには、LINE Messaging APIの設定を行い、必要なトークンを取得してください。その後、ボットを起動し、メッセージの送受信を行います。