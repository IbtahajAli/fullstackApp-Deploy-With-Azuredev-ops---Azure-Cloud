# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "devops-rg"
  location = var.location
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "devopsacr123"
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

# Azure SQL Server + Database
resource "azurerm_sql_server" "sqlserver" {
  name                         = "devops-sqlserver123"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_password
}

resource "azurerm_sql_database" "sqldb" {
  name                = "devopsdb"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  server_name         = azurerm_sql_server.sqlserver.name
  sku_name            = "S0"
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
  address_prefixes     = ["10.0.1.0/24"]
}