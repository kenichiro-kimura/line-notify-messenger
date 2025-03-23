# line-notify-messenger

このプロジェクトは、LINE Notifyの代わりに利用できるボットを提供します。Node.jsを使用してLINE Messaging APIを利用してメッセージを送信します。  
AWS LambdaまたはAzure Functionsをデプロイ先として使用します。  

## 構成

- エントリポイント
  - `src/lambdahandler.ts`: AWS Lambdaのエントリポイント。
  - `src/functions/HttpTrigger.ts`: Azure Functionsのエントリポイント。
- メインロジック
  - `src/core/LineNotifyMessengerApp.ts`: LINE Messaging APIからのイベントやHTTPリクエストを処理するロジックを実装しています。
  - `src/services/groupService.ts`: グループIDを管理するサービスクラスを定義しています。グループIDの保存や取得を行うメソッドが含まれています。
  - `src/services/httpResponseService.ts`: HTTPレスポンスを生成するサービスクラスを定義しています。HTTPステータスコードやメッセージを指定してレスポンスを生成するメソッドが含まれています。
  - `src/services/messageService.ts`: メッセージ送信のサービスクラスを定義しています。実際のメッセージの生成や送信を行うメソッドは`lineService`クラスに含まれます。
  - `src/handlers/requestHandler.ts`: HTTPリクエストを処理するクラスを定義しています。
- 実行環境特有のロジック
  - `src/handlers/lambdaHttpRequestHandler.ts`: IHttpRequestHandlerを実装したクラス。AWS Lambda固有のロジックを実装しています。
  - `src/handlers/functionsHttpRequestHandler.ts`: IHttpRequestHandlerを実装したクラス。Azure Functions固有のロジックを実装しています。
- LINE Messaging API関連
  - `src/services/lineService.ts`: LINE Messaging APIとのインタラクションを管理するサービスクラスを定義しています。メッセージの送信や受信を行うメソッドが含まれています。
- 画像保存
  - `src/repositories/s3ImageStorage.ts`: IImageStorageを実装したクラス。Amazon S3に画像をアップロードするサービスクラスを定義しています。
  - `src/repositories/blobStorage.ts`: IImageStorageを実装したクラス。Azure Blob Storageに画像をアップロードするサービスクラスを定義しています。
- 画像サイズ変更
  - `src/utils/jimpImageProcessor.ts`: IImageProcessorを実装したクラス。Jimpを使用して画像を処理するサービスクラスを定義しています。
- グループID保存
  - `src/repositories/dynamoGroupRepository.ts`: IGroupRepositoryを実装したクラス。Amazon DynamoDBにグループIDを保存するリポジトリクラスを定義しています。
  - `src/repositories/tableStorageGroupRepository.ts`: IGroupRepositoryを実装したクラス。Azure Table StorageにグループIDを保存するリポジトリクラスを定義しています。
- 送信モード
  - `src/strategies/sendModeStrategy.ts`: ISendModeStrategyを実装したクラス。送信モードを取得する手段をストラテジークラスを定義しています。環境変数から取得するEnvironmentSendModeStrategyが実装されていて、これがデフォルトで利用されます。他の手段で取得する場合はここで実装し、`LineNotifyMessengerApp`クラスのコンストラクタでDIします。
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

[AWS CloudShell](https://aws.amazon.com/jp/cloudshell/)で作業すると楽です。独自の環境で実施される場合は、Node.js(>=20)と[AWS Cloud Development Kit](https://aws.amazon.com/jp/cdk/)をインストールしておいてください。

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

4. 複数のアプリケーションをデプロイする際は、CDKのスタック名にサフィックスをつけることができます。環境変数`APP_SUFFIX`を設定できます。
   bashの場合

   ```bash
   export APP_SUFFIX='xxxx'
   ```

   PowerShellの場合

   ```powershell
   $Env:APP_SUFFIX = 'xxxx'
   ```

   この場合、`npm run deploy`を実行すると、スタック名が`LineNotifyMessengerS3Stack-xxxx`と`LineNotifyMessengerLambdaStack-xxxx`になります。

### Azure

1. 以下のボタンを押して環境を構築します。LINE_CHANNEL_ACCESS_TOKENとAUTHORIZATION_TOKENには、LINE Messaging APIのチャンネルアクセストークンと、これまで使っていたLINE NotifyのAuthorizationヘッダの値を設定します。

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fkenichiro-kimura.github.io%2Fline-notify-messenger%2Fazuredeploy.json)

2. 本リポジトリをForkします。

3. 構築した環境のAzure Functionsから発行プロファイルを取得して、ForkしたリポジトリのGitHub ActionsのSecret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` に登録します。

4. 同じくForkしたリポジトリのActionsのVariables `FUNCTION_NAME` に、Azure Functionsの関数名を登録します。

5. `Build and deploy Node.js project to Azure Function App`ワークフローをGitHubのページから手動で実行します。[GitHubの公式ドキュメント](https://docs.github.com/ja/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow)を参照して下さい。

### cloudflare

1. LINE_CHANNEL_ACCESS_TOKENとAUTHORIZATION_TOKENとSEND_MODを環境変数に設定します。
2. cloudflareのダッシュボードから、cloudflare R2を使えるようにします
3. cloudflareのダッシュボードから、デプロイ用のAPIトークンを作成します
4. `cd terraform`でterraformディレクトリに移動します。
5. `terraform.tfvars.template`をコピーして`terraform.tfvars`を作成し、`cloudflare_api_token`と`cloudflare_account_id`を設定します。
6. `terraform init`で初期化します。
7. `terraform apply`でデプロイします。
8. `cd ../`で元のディレクトリに戻ります。
9. `npm run update-config`で設定ファイルを更新します。
10. `npm run cloudflare-build`でビルドします。
11. `npm run cloudflare-deploy`でデプロイします。
12. cloudflareのダッシュボードからシークレットにLINE_CHANNEL_ACCESS_TOKENとAUTHORIZATION_TOKENを設定します。

## 使用方法

1. デプロイしたボットのエンドポイント(AWS Lambdaの場合はcdkのOutputsで出てきたLambda関数URL、Azure Functionsの場合は {Funcitonsのホスト名}/api/HttpTrigger)を、LINE公式アカウントのWebhook URLに設定します。
2. ボット自体は、何を受け付けても固定のメッセージを返します。
3. {エンドポイントURL}/notify に対して、LINE Notifyと同じPOSTリクエストを送信すると、ボットのLINEアカウントのブロードキャストメッセージまたは所属グループへのメッセージとして送信されますので、LINE Notifyで使っていたURLを差し替えてそのまま動きます。この動作にはAuthorizationヘッダが必要です。
4. デフォルトではBOTは友達全員に対してメッセージをブロードキャストします。ボットをグループに所属させても、そのグループに向かってメッセージは送信されません。これまでのLINE Notifyのようにグループに向かってメッセージを送信するには、AWS/Azureにデプロイしたバックエンドの環境変数「SEND_MODE」を「group」にします。
5. グループ送信モードで使う場合は、ボットアカウントをグループに招待してください。既にボットがグループに入っている場合は、そのグループ内で適当なメッセージを送信してください。これにより、ボットが所属グループを記録し、そこにのメッセージを送信できるようになります。

## これまでのLINE Notifyからの移行手順抜粋

1. 公式アカウントを作成し、LINE Messaging APIのチャンネルアクセストークンを取得する
2. 本ドキュメントに従ってデプロイし、Lambda/Functionsのエンドポイントを取得する
3. Lambda/Functionsの環境変数「SEND_MODE」を「group」に設定する
4. 公式アカウントにエンドポイントを設定する
5. これまで使っていたLINE Notifyのグループに、作成した公式アカウントを招待する
6. これまでLINE Notifyへ送っていたプログラムのURLを、`作成したエンドポイント/notify`に変更する
