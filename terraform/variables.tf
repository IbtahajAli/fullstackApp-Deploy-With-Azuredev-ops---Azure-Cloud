variable "location" {
  type    = string
  default = "East US"
}

variable "sql_admin_login" {
  type    = string
  default = "sqladmin"
}

variable "sql_password" {
  type      = string
  sensitive = true
}