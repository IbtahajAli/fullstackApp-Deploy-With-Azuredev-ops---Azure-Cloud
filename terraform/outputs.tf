output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "sql_server_name" {
  value = azurerm_mssql_server.sqlserver.name
}

output "sql_database_name" {
  value = azurerm_mssql_database.sqldb.name
}