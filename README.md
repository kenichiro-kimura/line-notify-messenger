# line-notify-messenger

このプロジェクトは、LINE Notifyの代わりに利用できるボットを提供します。Node.jsを使用してLINE Messaging APIを利用してメッセージを送信します。  
AWS Lambdaをデプロイ先として使用します。  

## 構成

- `src/handler.ts`: AWS Lambdaのエントリポイント。LINE Messaging APIからのイベントを処理する関数を定義しています。
- `src/lineService.ts`: LINE Messaging APIとのインタラクションを管理するサービスクラスを定義しています。メッセージの送信や受信を行うメソッドが含まれています。
- `src/s3ImageStorage.ts`: S3に画像をアップロードするサービスクラスを定義しています。画像のアップロードやURLの取得を行うメソッドが含まれています。
- `src/jimpImageProcessor.ts`: Jimpを使用して画像を処理するサービスクラスを定義しています。画像のリサイズやフィルター処理を行うメソッドが含まれています。
- `src/interfaces`: インターフェースを定義するディレクトリ。型定義を分離して管理します。
- `bin/line-notify-messenger.ts`: AWS CDKアプリケーションのエントリポイント。スタックを作成し、デプロイするための設定を行います。
- `lib/lambda-stack.ts`: AWSリソースを定義するCDKスタック。AWS Lambda関数の設定が記述されています。
- `tsconfig.json`: TypeScriptのコンパイル設定を含むファイル。コンパイラオプションやコンパイル対象のファイルを指定します。
- `package.json`: npmの設定ファイル。プロジェクトの依存関係やスクリプトをリストしています。
- `tests/`: テストファイルを格納するディレクトリ。Jestを使用してテストを実行します。
- `jest.config.js`: Jestの設定ファイル。テストの設定を記述します。
- `cdk.json`: CDKアプリケーションの設定ファイル。アプリケーションのエントリポイントやスタックの設定を記述します。

## セットアップ手順

### 共通

1. LINE Messaging APIの設定を行い、チャンネルアクセストークン(長期)を取得してください
2. リポジトリをクローンします。
3. 必要な依存関係をインストールします。

   ```bash
   npm install
   ```

### AWS

1. 環境変数`LINE_CHANNEL_ACCESS_TOKEN`に、LINE Messaging APIのチャンネルアクセストークンを設定します。

   bashの場合

   ```bash
   export LINE_CHANNEL_ACCESS='YOUR_CHANNEL_ACCESS_TOKEN'
   ```

   PowerShellの場合

   ```powershell
   $Env:LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN'
   ```

2. 環境変数`AUTHORIZATION_TOKEN`に、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   bashの場合

   ```bash
   export AUTHORIZATION_TOKEN='YOUR_AUTHORIZATION_TOKEN'
   ```

   PowerShellの場合

   ```powershell
   $Env:AUTHORIZATION_TOKEN = 'YOUR_AUTHORIZATION_TOKEN'
   ```

3. AWS CDKを使用してスタックをデプロイします。

   ```bash
   npm run deploy
   ```

### Azure (GitHub Actionsでデプロイする場合)

1. 以下のボタンを押して環境を構築します。lineAccessTokenとauthorizedTokenには、LINE Messaging APIのチャンネルアクセストークンと、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fkenichiro-kimura.github.io%2Fline-notify-messenger%2Fazuredeploy.json)

2. 本リポジトリをForkします。

3. 構築した環境のAzure Functionsから発行プロファイルを取得して、ForkしたリポジトリのGitHub ActionsのSecret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` に登録します。

4. 同じくForkしたリポジトリのActionsのVariables `FUNCTION_NAME` に、Azure Functionsの関数名を登録します。

5. `Build and deploy Node.js project to Azure Function App`ワークフローを実行します

### Azure (VSCodeでデプロイする場合)

1. 以下のボタンを押して環境を構築します。lineAccessTokenとauthorizedTokenには、LINE Messaging APIのチャンネルアクセストークンと、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fkenichiro-kimura.github.io%2Fline-notify-messenger%2Fazuredeploy.json)

2. 本リポジトリをクローンし、VSCodeで開きます。

3. [「コード プロジェクトをデプロイする」](https://learn.microsoft.com/ja-jp/azure/azure-functions/flex-consumption-how-to?tabs=azure-cli%2Cvs-code-publish&pivots=programming-language-javascript#deploy-your-code-project)に従ってデプロイします。

## 使用方法

1. ボット自体は、何を受け付けても固定のメッセージを返します。
2. {LINE_BOT_URL}/notify に対して、LINE Notifyと同じPOSTリクエストを送信すると、ボットのLINEアカウントのブロードキャストメッセージとして送信されますので、LINE Notifyで使っていたURLを差し替えてそのまま動きます。この動作にはAuthorizationヘッダが必要です。
