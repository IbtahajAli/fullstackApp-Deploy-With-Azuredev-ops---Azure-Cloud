variable "location" {
  description = "Azure region"
  type        = string
  # CHANGED from "East US" to "East US 2" to bypass the restriction
  default     = "East US 2"
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