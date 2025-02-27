# line-notify-messenger

このプロジェクトは、LINE Notifyの代わりに利用できるボットを提供します。Node.jsを使用してLINE Messaging APIを利用してメッセージを送信します。  
AWS LambdaまたはAzure Functionsをデプロイ先として使用します。  

## 構成

- ハンドラー
  - `src/lambdahandler.ts`: AWS Lambdaのエントリポイント。
  - `src/functions/handler.ts`: Azure Functionsのエントリポイント。
- メインロジック
  - `src/lineNotifyMessengerApp.ts`: LINE Messaging APIからのイベントやHTTPリクエストを処理するロジックを実装しています。
- 実行環境特有のロジック
  - `src/lambdaLineNotifyMessenger.ts`: ILineNotifyMessengerを実装したクラス。AWS Lambda固有のロジックを実装しています。
  - `src/functionsLineNotifyMessenger.ts`: ILineNotifyMessengerを実装したクラス。Azure Functions固有のロジックを実装しています。
- LINE Messaging API関連
  - `src/lineService.ts`: LINE Messaging APIとのインタラクションを管理するサービスクラスを定義しています。メッセージの送信や受信を行うメソッドが含まれています。
- 画像保存
  - `src/s3ImageStorage.ts`: IImageStorageを実装したクラス。Amazon S3に画像をアップロードするサービスクラスを定義しています。
  - `src/blobStorage.ts`: IImageStorageを実装したクラス。Azure Blob Storageに画像をアップロードするサービスクラスを定義しています。
- 画像サイズ変更
  - `src/jimpImageProcessor.ts`: IImageProcessorを実装したクラス。Jimpを使用して画像を処理するサービスクラスを定義しています。
- IaC
  - `bin/line-notify-messenger.ts`: AWS CDKアプリケーションのエントリポイント。スタックを作成し、デプロイするための設定を行います。
  - `lib/lambda-stack.ts`: AWSリソースを定義するCDKスタック。AWS Lambda関数の設定が記述されています。
  - `cdk.json`: CDKアプリケーションの設定ファイル。アプリケーションのエントリポイントやスタックの設定を記述します。
  - `bicep/`: Azureリソースを定義するBicepファイルを格納するディレクトリ。
- その他
  - `src/interfaces`: インターフェースを定義するディレクトリ。
  - `functions/`: Azure Functionsのプロジェクトファイルを格納するディレクトリ。
  - `tests/`: テストファイルを格納するディレクトリ。Jestを使用してテストを実行します。
  - `tsconfig.json`: TypeScriptのコンパイル設定を含むファイル。コンパイラオプションやコンパイル対象のファイルを指定します。
  - `package.json`: npmの設定ファイル。プロジェクトの依存関係やスクリプトをリストしています。
  - `jest.config.js`: Jestの設定ファイル。テストの設定を記述します。

## セットアップ手順

### 共通

1. LINE Messaging APIの設定を行い、チャンネルアクセストークン(長期)を取得してください
2. リポジトリをクローンします。
3. 必要な依存関係をインストールします。

   ```bash
   npm install
   ```

4. ビルドします

   ```bash
   npm run build
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

4. 複数のアプリケーションをデプロイする際は、CDKのスタック名にサフィックスをつけられます。環境変数`APP_SUFFIX`を設定できます。

   bashの場合

   ```bash
   export APP_SUFFIX='xxxx'
   ```

   PowerShellの場合

   ```powershell
   $Env:APP_SUFFIX = 'xxxx'
   ```

   この場合、`npm run deploy`を実行すると、スタック名が`LineNotifyMessengerS3Stack-xxxx`と`LineNotifyMessengerLambdaStack-xxxx`になります。

### Azure (GitHub Actionsでデプロイする場合)

1. 以下のボタンを押して環境を構築します。LINE_CHANNEL_ACCESS_TOKENとAUTHORIZATION_TOKENには、LINE Messaging APIのチャンネルアクセストークンと、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fkenichiro-kimura.github.io%2Fline-notify-messenger%2Fazuredeploy.json)

2. 本リポジトリをForkします。

3. 構築した環境のAzure Functionsから発行プロファイルを取得して、ForkしたリポジトリのGitHub ActionsのSecret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` に登録します。

4. 同じくForkしたリポジトリのActionsのVariables `FUNCTION_NAME` に、Azure Functionsの関数名を登録します。

5. `Build and deploy Node.js project to Azure Function App`ワークフローを実行します

### Azure (VSCodeでデプロイする場合)

1. 以下のボタンを押して環境を構築します。LINE_CHANNEL_ACCESS_TOKENとAUTHORIZATION_TOKENには、LINE Messaging APIのチャンネルアクセストークンと、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fkenichiro-kimura.github.io%2Fline-notify-messenger%2Fazuredeploy.json)

2. 本リポジトリをクローンし、VSCodeで開きます。

3. [「コード プロジェクトをデプロイする」](https://learn.microsoft.com/ja-jp/azure/azure-functions/flex-consumption-how-to?tabs=azure-cli%2Cvs-code-publish&pivots=programming-language-javascript#deploy-your-code-project)に従ってデプロイします。

## 使用方法

1. ボット自体は、何を受け付けても固定のメッセージを返します。
2. {LINE_BOT_URL}/notify に対して、LINE Notifyと同じPOSTリクエストを送信すると、ボットのLINEアカウントのブロードキャストメッセージとして送信されますので、LINE Notifyで使っていたURLを差し替えてそのまま動きます。この動作にはAuthorizationヘッダが必要です。
