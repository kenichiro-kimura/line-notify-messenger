# CONTRIBUTING

## 別環境向け実装を追加する方法

- AWS Lambda/Azure Functions以外の環境向けの実装を追加する場合、以下の手順に従って実装を追加してください。
  - 実行環境特有のロジック
    - 主にHTTPの入出力など環境特有の処理について、`src/interfaces/httpRequestHandler.ts`を実装したクラスを作成してください。
  - 画像保存
    - 画像を保存するサービスとして、`src/interfaces/imageStorage.ts`を実装したクラスを作成してください。
  - グループID保存
    - グループIDを保存するサービスとして`src/interfaces/groupRepository.ts`を実装したクラスを作成してください。
  - エンドポイントの作成
    - `src/lambdahandler.ts`や`src/functions/HttpTrigger.ts`を参考に、環境固有のエンドポイントを作成してください。基本的には必要な環境変数をチェックしたら、IHttpRequestHandler/IImageStorage/IGroupRepositoryを実装したクラスをDIして`LineNotifyMessengerApp`のインスタンスを作成し、`processRequest()`メソッドを呼んでください。
  - IaCとCI/CDの追加
    - 可能であれば環境を構築するためのIaCならびにデプロイするためのワークフローファイルを追加してください。難しい場合は、READMEに手動でのデプロイ手順を追加してください。
  - テストの追加
    - 可能であれば作成したクラスに対してテストを書き、`tests/`ディレクトリに追加してください。

## バグの報告、修正の提案

- バグの報告や修正の提案は、GitHubのIssueで受け付けていますので、Issueを作成してください。
- バグの報告の際は、再現手順や環境情報を記載してください。
- 修正の提案の際は、修正内容や修正理由を記載してください。
- pull requestを送っていただくのは大歓迎です。できればIssueを先に作成し、そこからpull requestを送っていただけると幸いです。
