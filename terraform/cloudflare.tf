terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
}

# KV名前空間の作成
resource "cloudflare_workers_kv_namespace" "groups" {
  account_id = var.cloudflare_account_id
  title      = "line-notify-messenger-groups"
}

# R2バケットの作成
resource "cloudflare_r2_bucket" "images" {
  account_id = var.cloudflare_account_id
  name       = "line-notify-messenger-images"
  location   = "APAC"
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.groups.id
}

output "r2_bucket_name" {
  value = cloudflare_r2_bucket.images.name
}