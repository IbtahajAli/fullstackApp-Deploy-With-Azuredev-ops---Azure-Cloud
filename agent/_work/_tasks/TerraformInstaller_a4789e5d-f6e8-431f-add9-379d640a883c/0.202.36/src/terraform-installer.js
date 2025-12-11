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
exports.downloadTerraform = void 0;
const tasks = require("azure-pipelines-task-lib/task");
const tools = require("azure-pipelines-tool-lib/tool");
const path = require("path");
const os = require("os");
const fs = require("fs");
const uuidV4 = require('uuid/v4');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const terraformToolName = "terraform";
const isWindows = os.type().match(/^Win/);
const proxy = tasks.getHttpProxyConfiguration();
function downloadTerraform(inputVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        var latestVersion = "";
        if (inputVersion.toLowerCase() === 'latest') {
            console.log(tasks.loc("GettingLatestTerraformVersion"));
            if (proxy == null) {
                yield fetch('https://checkpoint-api.hashicorp.com/v1/check/terraform')
                    .then((response) => response.json())
                    .then((data) => {
                    latestVersion = data.current_version;
                })
                    .catch((exception) => {
                    console.warn(tasks.loc("TerraformVersionNotFound"));
                    latestVersion = '1.9.8';
                });
            }
            else {
                var proxyUrl = proxy.proxyUsername != "" ? proxy.proxyUrl.split("://")[0] + '://' + proxy.proxyUsername + ':' + proxy.proxyPassword + '@' + proxy.proxyUrl.split("://")[1] : proxy.proxyUrl;
                var proxyAgent = new HttpsProxyAgent(proxyUrl);
                yield fetch('https://checkpoint-api.hashicorp.com/v1/check/terraform', { agent: proxyAgent })
                    .then((response) => response.json())
                    .then((data) => {
                    latestVersion = data.current_version;
                })
                    .catch((exception) => {
                    console.warn(tasks.loc("TerraformVersionNotFound"));
                    latestVersion = '1.9.8';
                });
            }
        }
        var version = latestVersion != "" ? tools.cleanVersion(latestVersion) : tools.cleanVersion(inputVersion);
        if (!version) {
            throw new Error(tasks.loc("InputVersionNotValidSemanticVersion", inputVersion));
        }
        let cachedToolPath = tools.findLocalTool(terraformToolName, version);
        if (!cachedToolPath) {
            let terraformDownloadUrl = getTerraformDownloadUrl(version);
            let fileName = `${terraformToolName}-${version}-${uuidV4()}.zip`;
            let terraformDownloadPath;
            try {
                terraformDownloadPath = yield tools.downloadTool(terraformDownloadUrl, fileName);
            }
            catch (exception) {
                throw new Error(tasks.loc("TerraformDownloadFailed", terraformDownloadUrl, exception));
            }
            let terraformUnzippedPath = yield tools.extractZip(terraformDownloadPath);
            cachedToolPath = yield tools.cacheDir(terraformUnzippedPath, terraformToolName, version);
        }
        let terraformPath = findTerraformExecutable(cachedToolPath);
        if (!terraformPath) {
            throw new Error(tasks.loc("TerraformNotFoundInFolder", cachedToolPath));
        }
        if (!isWindows) {
            fs.chmodSync(terraformPath, "777");
        }
        tasks.setVariable('terraformLocation', terraformPath);
        return terraformPath;
    });
}
exports.downloadTerraform = downloadTerraform;
function getTerraformDownloadUrl(version) {
    let platform;
    let architecture;
    switch (os.type()) {
        case "Darwin":
            platform = "darwin";
            break;
        case "Linux":
            platform = "linux";
            break;
        case "Windows_NT":
            platform = "windows";
            break;
        default:
            throw new Error(tasks.loc("OperatingSystemNotSupported", os.type()));
    }
    switch (os.arch()) {
        case "x64":
            architecture = "amd64";
            break;
        case "x32":
            architecture = "386";
            break;
        case "arm64":
            architecture = "arm64";
            break;
        case "arm":
            architecture = "arm";
            break;
        default:
            throw new Error(tasks.loc("ArchitectureNotSupported", os.arch()));
    }
    return `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platform}_${architecture}.zip`;
}
function findTerraformExecutable(rootFolder) {
    let terraformPath = path.join(rootFolder, terraformToolName + getExecutableExtension());
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, terraformPath, rootFolder);
    return matchingResultFiles[0];
}
function getExecutableExtension() {
    if (isWindows) {
        return ".exe";
    }
    return "";
}
