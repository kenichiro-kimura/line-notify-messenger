targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string
@minLength(1)
@description('Primary location for all resources')
@allowed(['australiaeast', 'eastasia', 'eastus', 'eastus2', 'northeurope', 'southcentralus', 'southeastasia', 'swedencentral', 'uksouth', 'westus2', 'eastus2euap'])
param location string 
@minLength(1)
@description('LINE CHANNEL ACCESS TOKEN')
param lineChannelAccessToken string
@minLength(1)
@description('LINE CHANNEL ACCESS TOKEN')
param authorizationToken string
var resourceGroupName = ''
var maximumInstanceCount = 100
var instanceMemoryMB = 2048
var appInsightsLocation = ''
var functionPlanName = ''
var functionAppName = ''
var storageAccountName = ''
var logAnalyticsName = ''
var applicationInsightsName = ''
var functionAppRuntime = 'node'
var functionAppRuntimeVersion = '20'

var abbrs = loadJsonContent('./abbreviations.json')
// Generate a unique token to be used in naming resources.
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
// Generate a unique function app name if one is not provided.
var appName = !empty(functionAppName) ? functionAppName : '${abbrs.webSitesFunctions}${environmentName}'
// Generate a unique container name that will be used for deployments.
var deploymentStorageContainerName = 'app-package-${take(appName, 32)}-${take(resourceToken, 7)}'
// tags that should be applied to all resources.
var tags = {
  // Tag all resources with the environment name.
  'azd-env-name': environmentName
}

var monitoringLocation = !empty(appInsightsLocation) ? appInsightsLocation : location

var publicStorageName = !empty(storageAccountName) ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}pub'

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  location: location
  tags: tags
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
}

// Monitor application with Azure Monitor
module monitoring './core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    location: monitoringLocation
    tags: tags
    logAnalyticsName: !empty(logAnalyticsName) ? logAnalyticsName : '${abbrs.operationalInsightsWorkspaces}${environmentName}'
    applicationInsightsName: !empty(applicationInsightsName) ? applicationInsightsName : '${abbrs.insightsComponents}${environmentName}'
  }
}

// Backing storage for Azure Functions
module storage 'core/storage/storage-account.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    location: location
    tags: tags
    name: !empty(storageAccountName) ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}'
    containers: [{name: deploymentStorageContainerName}]
  }
}

module publicStorage 'core/storage/storage-account.bicep' = {
  name: 'publicStorage'
  scope: rg
  params: {
    name: publicStorageName
    location: location
    allowBlobPublicAccess: true
    containers: [{name: 'upload'}]
    allowSharedKeyAccess: true
  }
}

// Azure Functions Flex Consumption
module flexFunction 'core/host/function.bicep' = {
  name: 'functionapp'
  scope: rg
  params: {
    location: location
    tags: tags
    planName: !empty(functionPlanName) ? functionPlanName : '${abbrs.webServerFarms}${environmentName}'
    appName: appName
    applicationInsightsName: monitoring.outputs.applicationInsightsName
    storageAccountName: storage.outputs.name
    deploymentStorageContainerName: deploymentStorageContainerName
    functionAppRuntime: functionAppRuntime
    functionAppRuntimeVersion: functionAppRuntimeVersion
    maximumInstanceCount: maximumInstanceCount
    instanceMemoryMB: instanceMemoryMB
    customAppSettings: [
        {
            name: 'BLOB_NAME'
            value: 'upload'
        }
        {
            name: 'BLOB_CONNECTION_STRING'
            value: publicStorage.outputs.connectionString
        }
        {
            name: 'LINE_CHANNEL_ACCESS_TOKEN'
            value: lineChannelAccessToken
        }
        {
            name: 'AUTHORIZATION_TOKEN'
            value: authorizationToken
        }
    ]
  }
}
