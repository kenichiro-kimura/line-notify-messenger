const fs = require('fs');
const { execSync } = require('child_process');

// Terraformの出力を取得
const terraformOutput = JSON.parse(
  execSync('cd terraform && terraform output -json').toString()
);

// .dev.vars ファイルの内容を作成
const devVarsContent = `LINE_CHANNEL_ACCESS_TOKEN=${process.env.LINE_CHANNEL_ACCESS_TOKEN || "your-channnel-access-token"}
AUTHORIZATION_TOKEN=${process.env.AUTHORIZATION_TOKEN}
SEND_MODE=${process.env.SEND_MODE || "group"}
`;

// .dev.vars ファイルに書き込み
fs.writeFileSync('.dev.vars', devVarsContent);

// wrangler.toml.templateファイルを読み込み、${{PROD_R2_BUCKET_NAME}}"を置換
const wranglerTomlTemplate = fs.readFileSync('wrangler.toml.template').toString();
const wranglerToml = wranglerTomlTemplate
  .replace('${R2_BUCKET_NAME}', terraformOutput.r2_bucket_name.value)
  .replace('${KV_NAMESPACE_ID}', terraformOutput.kv_namespace_id.value)
  .replace('${SEND_MODE}', process.env.SEND_MODE || "group");

  fs.writeFileSync('wrangler.toml', wranglerToml);

console.log('.dev.vars file and wrangler.toml has been updated with Terraform outputs');