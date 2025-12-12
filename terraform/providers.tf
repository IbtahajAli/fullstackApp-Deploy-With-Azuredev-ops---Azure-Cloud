terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  # Optional: remote backend for shared state
  backend "azurerm" {
    resource_group_name  = "rg-terraform"
    storage_account_name = "tfstateacct"
    container_name       = "tfstate"
    key                  = "infra.tfstate"
  }
}

provider "azurerm" {
  features {}
}