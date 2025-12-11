"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureclitask = void 0;
const path = require("path");
const tl = require("azure-pipelines-task-lib/task");
const fs = require("fs");
const Utility_1 = require("./src/Utility");
const ScriptType_1 = require("./src/ScriptType");
const webapi_1 = require("azure-pipelines-tasks-artifacts-common/webapi");
const azure_devops_node_api_1 = require("azure-devops-node-api");
const azCliUtility_1 = require("azure-pipelines-tasks-azure-arm-rest/azCliUtility");
const nodeVersion = parseInt(process.version.split('.')[0].replace('v', ''));
if (nodeVersion > 16) {
    require("dns").setDefaultResultOrder("ipv4first");
    tl.debug("Set default DNS lookup order to ipv4 first");
}
if (nodeVersion > 19) {
    require("net").setDefaultAutoSelectFamily(false);
    tl.debug("Set default auto select family to false");
}
const FAIL_ON_STDERR = "FAIL_ON_STDERR";
const AZ_SESSION_REFRESH_INTERVAL_MS = 480000; // 8 minutes, 2 minutes before IdToken expiry date
class azureclitask {
    static runMain() {
        return __awaiter(this, void 0, void 0, function* () {
            var toolExecutionError = null;
            var exitCode = 0;
            if (tl.getBoolFeatureFlag('AZP_AZURECLIV2_SETUP_PROXY_ENV')) {
                const proxyConfig = tl.getHttpProxyConfiguration();
                if (proxyConfig) {
                    process.env['HTTP_PROXY'] = proxyConfig.proxyFormattedUrl;
                    process.env['HTTPS_PROXY'] = proxyConfig.proxyFormattedUrl;
                    tl.debug(tl.loc('ProxyConfigMessage', proxyConfig.proxyUrl));
                }
            }
            try {
                var scriptType = ScriptType_1.ScriptTypeFactory.getSriptType();
                var tool = yield scriptType.getTool();
                var cwd = tl.getPathInput("cwd", true, false);
                if (tl.getInput("scriptLocation", true).toLowerCase() === "scriptPath" && !tl.filePathSupplied("cwd")) {
                    cwd = path.dirname(tl.getPathInput("scriptPath", true, true));
                }
                // determines whether output to stderr will fail a task.
                // some tools write progress and other warnings to stderr.  scripts can also redirect.
                var failOnStdErr = tl.getBoolInput("failOnStandardError", false);
                tl.mkdirP(cwd);
                tl.cd(cwd);
                const minorVersionTolerance = 5;
                let azVersionResult;
                const versionCommand = tl.getPipelineFeature('UseAzVersion');
                if (versionCommand) {
                    azVersionResult = tl.execSync("az", "version");
                    if (azVersionResult.code !== 0 || azVersionResult.stderr) {
                        tl.debug("az version failed, falling back to 'az --version'");
                        azVersionResult = tl.execSync("az", "--version");
                    }
                }
                else {
                    // Default case: always run with "--version"
                    azVersionResult = tl.execSync("az", "--version");
                }
                Utility_1.Utility.throwIfError(azVersionResult);
                this.isSupportCertificateParameter = this.isAzVersionGreaterOrEqual(azVersionResult.stdout, "2.66.0");
                yield (0, azCliUtility_1.validateAzModuleVersion)("azure-Cli", azVersionResult.stdout, "Azure-Cli", minorVersionTolerance);
                // set az cli config dir
                this.setConfigDirectory();
                this.setAzureCloudBasedOnServiceEndpoint();
                var connectedService = tl.getInput("connectedServiceNameARM", true);
                const authorizationScheme = tl.getEndpointAuthorizationScheme(connectedService, true).toLowerCase();
                yield this.loginAzureRM(connectedService);
                var keepAzSessionActive = tl.getBoolInput('keepAzSessionActive', false);
                var stopRefreshingSession = () => { };
                if (keepAzSessionActive) {
                    // This is a tactical workaround to keep the session active for the duration of the task to avoid AADSTS700024 errors.
                    // This is a temporary solution until the az cli provides a way to refresh the session.
                    if (authorizationScheme !== 'workloadidentityfederation') {
                        const errorMessage = tl.loc('KeepingAzSessionActiveUnsupportedScheme', authorizationScheme);
                        tl.error(errorMessage);
                        throw errorMessage;
                    }
                    stopRefreshingSession = this.keepRefreshingAzSession(connectedService);
                }
                let errLinesCount = 0;
                let aggregatedErrorLines = [];
                tool.on('errline', (errorLine) => {
                    if (errLinesCount < 10) {
                        aggregatedErrorLines.push(errorLine);
                    }
                    errLinesCount++;
                });
                const addSpnToEnvironment = tl.getBoolInput('addSpnToEnvironment', false);
                if (!!addSpnToEnvironment && authorizationScheme == 'serviceprincipal') {
                    exitCode = yield tool.exec({
                        failOnStdErr: false,
                        ignoreReturnCode: true,
                        env: Object.assign(Object.assign({}, process.env), { servicePrincipalId: this.servicePrincipalId, servicePrincipalKey: this.servicePrincipalKey, tenantId: this.tenantId })
                    });
                }
                else if (!!addSpnToEnvironment && authorizationScheme == 'workloadidentityfederation') {
                    exitCode = yield tool.exec({
                        failOnStdErr: false,
                        ignoreReturnCode: true,
                        env: Object.assign(Object.assign({}, process.env), { servicePrincipalId: this.servicePrincipalId, idToken: this.federatedToken, tenantId: this.tenantId })
                    });
                }
                else {
                    exitCode = yield tool.exec({
                        failOnStdErr: false,
                        ignoreReturnCode: true
                    });
                }
                if (failOnStdErr && aggregatedErrorLines.length > 0) {
                    let error = FAIL_ON_STDERR;
                    tl.error(aggregatedErrorLines.join("\n"), tl.IssueSource.CustomerScript);
                    throw error;
                }
            }
            catch (err) {
                toolExecutionError = err;
                if (err.stderr) {
                    toolExecutionError = err.stderr;
                }
            }
            finally {
                if (keepAzSessionActive) {
                    stopRefreshingSession();
                }
                if (scriptType) {
                    yield scriptType.cleanUp();
                }
                if (this.cliPasswordPath) {
                    tl.debug('Removing spn certificate file');
                    tl.rmRF(this.cliPasswordPath);
                }
                //set the task result to either succeeded or failed based on error was thrown or not
                if (toolExecutionError === FAIL_ON_STDERR) {
                    tl.setResult(tl.TaskResult.Failed, tl.loc("ScriptFailedStdErr"));
                }
                else if (toolExecutionError) {
                    let message = tl.loc('ScriptFailed', toolExecutionError);
                    if (typeof toolExecutionError === 'string') {
                        const expiredSecretErrorCode = 'AADSTS7000222';
                        let serviceEndpointSecretIsExpired = toolExecutionError.indexOf(expiredSecretErrorCode) >= 0;
                        if (serviceEndpointSecretIsExpired) {
                            const organizationURL = tl.getVariable('System.CollectionUri');
                            const projectName = tl.getVariable('System.TeamProject');
                            const serviceConnectionLink = encodeURI(`${organizationURL}${projectName}/_settings/adminservices?resourceId=${connectedService}`);
                            message = tl.loc('ExpiredServicePrincipalMessageWithLink', serviceConnectionLink);
                        }
                    }
                    // only Aggregation error contains array of errors
                    if (toolExecutionError.errors) {
                        // Iterates through array and log errors separately
                        toolExecutionError.errors.forEach((error) => {
                            tl.error(error.message, tl.IssueSource.TaskInternal);
                        });
                        // fail with main message
                        tl.setResult(tl.TaskResult.Failed, toolExecutionError.message);
                    }
                    else {
                        tl.setResult(tl.TaskResult.Failed, message);
                    }
                    tl.setResult(tl.TaskResult.Failed, message);
                }
                else if (exitCode != 0) {
                    tl.setResult(tl.TaskResult.Failed, tl.loc("ScriptFailedWithExitCode", exitCode));
                }
                else {
                    tl.setResult(tl.TaskResult.Succeeded, tl.loc("ScriptReturnCode", 0));
                }
                //Logout of Azure if logged in
                if (this.isLoggedIn) {
                    this.logoutAzure();
                }
                if (process.env.AZURESUBSCRIPTION_SERVICE_CONNECTION_ID && process.env.AZURESUBSCRIPTION_SERVICE_CONNECTION_ID !== "") {
                    process.env.AZURESUBSCRIPTION_SERVICE_CONNECTION_ID = '';
                    process.env.AZURESUBSCRIPTION_CLIENT_ID = '';
                    process.env.AZURESUBSCRIPTION_TENANT_ID = '';
                }
            }
        });
    }
    static isAzVersionGreaterOrEqual(azVersionResultOutput, versionToCompare) {
        try {
            let versionMatch = [];
            if (tl.getPipelineFeature('UseAzVersion')) {
                // gets azure-cli version from both az version output which is in JSON format and az --version output text format
                versionMatch = azVersionResultOutput.match(/["']?azure-cli["']?\s*[:\s]\s*["']?(\d+\.\d+\.\d+)["']?/);
            }
            else {
                // gets azure-cli version from az --version output text format
                versionMatch = azVersionResultOutput.match(/azure-cli\s+(\d+\.\d+\.\d+)/);
            }
            if (!versionMatch || versionMatch.length < 2) {
                tl.error(`Can't parse az version from: ${azVersionResultOutput}`);
                return false;
            }
            const currentVersion = versionMatch[1];
            tl.debug(`Current Azure CLI version: ${currentVersion}`);
            // Parse both versions into major, minor, patch components
            const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);
            const [compareMajor, compareMinor, comparePatch] = versionToCompare.split('.').map(Number);
            // Compare versions
            if (currentMajor > compareMajor)
                return true;
            if (currentMajor < compareMajor)
                return false;
            if (currentMinor > compareMinor)
                return true;
            if (currentMinor < compareMinor)
                return false;
            return currentPatch >= comparePatch;
        }
        catch (error) {
            tl.error(`Error checking Azure CLI version: ${error.message}`);
            return false;
        }
    }
    static loginAzureRM(connectedService) {
        return __awaiter(this, void 0, void 0, function* () {
            var authScheme = tl.getEndpointAuthorizationScheme(connectedService, true);
            var subscriptionID = tl.getEndpointDataParameter(connectedService, "SubscriptionID", true);
            var visibleAzLogin = tl.getBoolInput("visibleAzLogin", true);
            if (authScheme.toLowerCase() == "workloadidentityfederation") {
                var servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
                var tenantId = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
                const federatedToken = yield this.getIdToken(connectedService);
                tl.setSecret(federatedToken);
                let args = `login --service-principal -u "${servicePrincipalId}" --tenant "${tenantId}" --allow-no-subscriptions --federated-token "${federatedToken}"`;
                if (!visibleAzLogin) {
                    args += ` --output none`;
                }
                //login using OpenID Connect federation
                Utility_1.Utility.throwIfError(tl.execSync("az", args), tl.loc("LoginFailed"));
                this.servicePrincipalId = servicePrincipalId;
                this.federatedToken = federatedToken;
                this.tenantId = tenantId;
                process.env.AZURESUBSCRIPTION_SERVICE_CONNECTION_ID = connectedService;
                process.env.AZURESUBSCRIPTION_CLIENT_ID = servicePrincipalId;
                process.env.AZURESUBSCRIPTION_TENANT_ID = tenantId;
            }
            else if (authScheme.toLowerCase() == "serviceprincipal") {
                let authType = tl.getEndpointAuthorizationParameter(connectedService, 'authenticationType', true);
                let cliPassword = null;
                let authParam = "--password";
                var servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
                var tenantId = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
                this.servicePrincipalId = servicePrincipalId;
                this.tenantId = tenantId;
                if (authType == "spnCertificate") {
                    tl.debug('certificate based endpoint');
                    if (this.isSupportCertificateParameter) {
                        authParam = "--certificate";
                    }
                    let certificateContent = tl.getEndpointAuthorizationParameter(connectedService, "servicePrincipalCertificate", false);
                    cliPassword = path.join(tl.getVariable('Agent.TempDirectory') || tl.getVariable('system.DefaultWorkingDirectory'), 'spnCert.pem');
                    fs.writeFileSync(cliPassword, certificateContent);
                    this.cliPasswordPath = cliPassword;
                }
                else {
                    tl.debug('key based endpoint');
                    cliPassword = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
                    this.servicePrincipalKey = cliPassword;
                }
                let escapedCliPassword = cliPassword.replace(/"/g, '\\"');
                tl.setSecret(escapedCliPassword.replace(/\\/g, '\"'));
                //login using svn
                if (visibleAzLogin) {
                    Utility_1.Utility.throwIfError(tl.execSync("az", `login --service-principal -u "${servicePrincipalId}" ${authParam}="${escapedCliPassword}" --tenant "${tenantId}" --allow-no-subscriptions`), tl.loc("LoginFailed"));
                }
                else {
                    Utility_1.Utility.throwIfError(tl.execSync("az", `login --service-principal -u "${servicePrincipalId}" ${authParam}="${escapedCliPassword}" --tenant "${tenantId}" --allow-no-subscriptions --output none`), tl.loc("LoginFailed"));
                }
            }
            else if (authScheme.toLowerCase() == "managedserviceidentity") {
                //login using msi
                if (visibleAzLogin) {
                    Utility_1.Utility.throwIfError(tl.execSync("az", "login --identity"), tl.loc("MSILoginFailed"));
                }
                else {
                    Utility_1.Utility.throwIfError(tl.execSync("az", "login --identity --output none"), tl.loc("MSILoginFailed"));
                }
            }
            else {
                throw tl.loc('AuthSchemeNotSupported', authScheme);
            }
            this.isLoggedIn = true;
            if (!!subscriptionID) {
                //set the subscription imported to the current subscription
                Utility_1.Utility.throwIfError(tl.execSync("az", "account set --subscription \"" + subscriptionID + "\""), tl.loc("ErrorInSettingUpSubscription"));
            }
        });
    }
    static setConfigDirectory() {
        if (tl.getBoolInput("useGlobalConfig")) {
            return;
        }
        if (!!tl.getVariable('Agent.TempDirectory')) {
            var azCliConfigPath = path.join(tl.getVariable('Agent.TempDirectory'), ".azclitask");
            console.log(tl.loc('SettingAzureConfigDir', azCliConfigPath));
            process.env['AZURE_CONFIG_DIR'] = azCliConfigPath;
        }
        else {
            console.warn(tl.loc('GlobalCliConfigAgentVersionWarning'));
        }
    }
    static setAzureCloudBasedOnServiceEndpoint() {
        var connectedService = tl.getInput("connectedServiceNameARM", true);
        var environment = tl.getEndpointDataParameter(connectedService, 'environment', true);
        if (!!environment) {
            console.log(tl.loc('SettingAzureCloud', environment));
            Utility_1.Utility.throwIfError(tl.execSync("az", "cloud set -n " + environment));
        }
    }
    static logoutAzure() {
        try {
            tl.execSync("az", " account clear");
        }
        catch (err) {
            // task should not fail if logout doesn`t occur
            tl.warning(tl.loc("FailedToLogout"));
        }
    }
    static getIdToken(connectedService) {
        return __awaiter(this, void 0, void 0, function* () {
            // since node19 default node's GlobalAgent has timeout 5sec
            // keepAlive is set to true to avoid creating default node's GlobalAgent
            const webApiOptions = {
                keepAlive: true
            };
            const jobId = tl.getVariable("System.JobId");
            const planId = tl.getVariable("System.PlanId");
            const projectId = tl.getVariable("System.TeamProjectId");
            const hub = tl.getVariable("System.HostType");
            const uri = tl.getVariable("System.CollectionUri");
            const token = (0, webapi_1.getSystemAccessToken)();
            const authHandler = (0, azure_devops_node_api_1.getHandlerFromToken)(token);
            const connection = new azure_devops_node_api_1.WebApi(uri, authHandler, webApiOptions);
            const api = yield connection.getTaskApi();
            const response = yield api.createOidcToken({}, projectId, hub, planId, jobId, connectedService);
            if (response == null) {
                return null;
            }
            return response.oidcToken;
        });
    }
    static keepRefreshingAzSession(connectedService) {
        const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                tl.debug(tl.loc('RefreshingAzSession'));
                yield this.loginAzureRM(connectedService);
            }
            catch (error) {
                tl.warning(tl.loc('FailedToRefreshAzSession', error));
            }
        }), AZ_SESSION_REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }
}
exports.azureclitask = azureclitask;
azureclitask.isLoggedIn = false;
azureclitask.cliPasswordPath = null;
azureclitask.servicePrincipalId = null;
azureclitask.servicePrincipalKey = null;
azureclitask.federatedToken = null;
azureclitask.tenantId = null;
azureclitask.isSupportCertificateParameter = false;
tl.setResourcePath(path.join(__dirname, "task.json"));
if (!Utility_1.Utility.checkIfAzurePythonSdkIsInstalled()) {
    tl.setResult(tl.TaskResult.Failed, tl.loc("AzureSDKNotFound"));
}
azureclitask.runMain();
