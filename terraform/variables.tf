variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "sql_admin_login" {
  description = "SQL admin username"
  type        = string
  default     = "sqladmin"
}

variable "sql_password" {
  description = "SQL admin password"
  type        = string
  sensitive   = true
}

# Backend storage account key
variable "storage_account_key" {
  description = "Access key for the tfstate storage account"
  type        = string
  sensitive   = true
}

# Service Principal credentials for provider
variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "client_id" {
  description = "Service Principal app/client ID"
  type        = string
}

variable "client_secret" {
  description = "Service Principal client secret"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
}