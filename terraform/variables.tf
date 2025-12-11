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