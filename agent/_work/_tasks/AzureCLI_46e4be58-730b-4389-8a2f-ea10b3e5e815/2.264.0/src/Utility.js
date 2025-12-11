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
exports.Utility = void 0;
const tl = require("azure-pipelines-task-lib/task");
const os = require("os");
const path = require("path");
const fs = require("fs");
class Utility {
    static getScriptPath(scriptLocation, fileExtensions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (scriptLocation.toLowerCase() === "scriptpath") {
                let filePath = tl.getPathInput("scriptPath", true, false);
                if (Utility.checkIfFileExists(filePath, fileExtensions)) {
                    return filePath;
                }
                throw new Error(tl.loc('JS_InvalidFilePath', filePath));
            }
            let tempDirectory = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
            let inlineScript = tl.getInput("inlineScript", true);
            let scriptPath = path.join(tempDirectory, `azureclitaskscript${new Date().getTime()}.${fileExtensions[0]}`);
            yield Utility.createFile(scriptPath, inlineScript);
            return scriptPath;
        });
    }
    static getPowerShellScriptPath(scriptLocation, fileExtensions, scriptArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            let powerShellErrorActionPreference = tl.getInput('powerShellErrorActionPreference', false) || 'Stop';
            switch (powerShellErrorActionPreference.toUpperCase()) {
                case 'STOP':
                case 'CONTINUE':
                case 'SILENTLYCONTINUE':
                    break;
                default:
                    throw new Error(tl.loc('JS_InvalidErrorActionPreference', powerShellErrorActionPreference));
            }
            // Write the script to disk.
            tl.assertAgent('2.115.0');
            let tempDirectory = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
            let contents = [];
            contents.push(`$ErrorActionPreference = '${powerShellErrorActionPreference}'`);
            contents.push(`$ErrorView = 'NormalView'`);
            let filePath = tl.getPathInput("scriptPath", false, false);
            if (scriptLocation.toLowerCase() === 'inlinescript') {
                let inlineScript = tl.getInput("inlineScript", true);
                filePath = path.join(tempDirectory, `azureclitaskscript${new Date().getTime()}_inlinescript.${fileExtensions[0]}`);
                yield Utility.createFile(filePath, inlineScript);
            }
            else {
                if (!Utility.checkIfFileExists(filePath, fileExtensions)) {
                    throw new Error(tl.loc('JS_InvalidFilePath', filePath));
                }
            }
            let content = `. '${filePath.replace(/'/g, "''")}' `;
            if (scriptArguments) {
                content += scriptArguments;
            }
            contents.push(content.trim());
            let powerShellIgnoreLASTEXITCODE = tl.getBoolInput('powerShellIgnoreLASTEXITCODE', false);
            if (!powerShellIgnoreLASTEXITCODE) {
                contents.push(`if (!(Test-Path -LiteralPath variable:\LASTEXITCODE)) {`);
                contents.push(`    Write-Host '##vso[task.debug]$LASTEXITCODE is not set.'`);
                contents.push(`} else {`);
                contents.push(`    Write-Host ('##vso[task.debug]$LASTEXITCODE: {0}' -f $LASTEXITCODE)`);
                contents.push(`    exit $LASTEXITCODE`);
                contents.push(`}`);
            }
            let scriptPath = path.join(tempDirectory, `azureclitaskscript${new Date().getTime()}.${fileExtensions[0]}`);
            yield Utility.createFile(scriptPath, '\ufeff' + contents.join(os.EOL), { encoding: 'utf8' });
            return scriptPath;
        });
    }
    static checkIfAzurePythonSdkIsInstalled() {
        return !!tl.which("az", false);
    }
    static throwIfError(resultOfToolExecution, errormsg) {
        if (resultOfToolExecution.code != 0) {
            tl.error("Error Code: [" + resultOfToolExecution.code + "]");
            if (errormsg) {
                tl.error("Error: " + errormsg);
            }
            throw resultOfToolExecution;
        }
    }
    static createFile(filePath, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                fs.writeFileSync(filePath, data, options);
            }
            catch (err) {
                Utility.deleteFile(filePath);
                throw err;
            }
        });
    }
    static checkIfFileExists(filePath, fileExtensions) {
        let matchingFiles = fileExtensions.filter((fileExtension) => {
            if (tl.stats(filePath).isFile() && filePath.toUpperCase().match(new RegExp(`\.${fileExtension.toUpperCase()}$`))) {
                return true;
            }
        });
        if (matchingFiles.length > 0) {
            return true;
        }
        return false;
    }
    static deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs.existsSync(filePath)) {
                try {
                    //delete the publishsetting file created earlier
                    fs.unlinkSync(filePath);
                }
                catch (err) {
                    //error while deleting should not result in task failure
                    console.error(err.toString());
                }
            }
        });
    }
}
exports.Utility = Utility;
