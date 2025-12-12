# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "devops-rg"
  location = var.location
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "devopsacr123" # Must be globally unique
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Azure Kubernetes Service
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "devops-aks"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  dns_prefix          = "devopsaks"

  default_node_pool {
    name       = "default"
    node_count = 2
    vm_size    = "Standard_DS2_v2"
  }

  identity {
    type = "SystemAssigned"
  }
}

# --- FIXED SQL SECTION ---

# Modern Azure SQL Server
resource "azurerm_mssql_server" "sqlserver" {
  name                         = "devops-sqlserver123" # Must be globally unique
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_password
}

# Modern Azure SQL Database
resource "azurerm_mssql_database" "sqldb" {
  name           = "devopsdb"
  server_id      = azurerm_mssql_server.sqlserver.id # Note: Uses ID, not Name
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  sku_name       = "S0" # This will now work correctly
}

# Virtual Network + Subnet
resource "azurerm_virtual_network" "vnet" {
  name                = "devops-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "devops-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name