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
exports.Batch = exports.Bash = exports.PowerShellCore = exports.WindowsPowerShell = exports.ScriptType = exports.ScriptTypeFactory = void 0;
const Utility_1 = require("./Utility");
const tl = require("azure-pipelines-task-lib/task");
class ScriptTypeFactory {
    static getSriptType() {
        let scriptType = tl.getInput("scriptType", true).toLowerCase();
        let scriptLocation = tl.getInput("scriptLocation", true);
        if (!(['inlinescript', 'scriptpath'].find((acceptedValue) => { return scriptLocation.toLowerCase() === acceptedValue; }))) {
            throw new Error(tl.loc('UnacceptedScriptLocationValue', scriptLocation));
        }
        let scriptArguments = tl.getInput("scriptArguments", false);
        switch (scriptType) {
            case 'ps':
                return new WindowsPowerShell(scriptLocation, scriptArguments);
            case 'pscore':
                return new PowerShellCore(scriptLocation, scriptArguments);
            case 'bash':
                return new Bash(scriptLocation, scriptArguments);
            case 'batch':
            default:
                return new Batch(scriptLocation, scriptArguments);
        }
    }
}
exports.ScriptTypeFactory = ScriptTypeFactory;
class ScriptType {
    constructor(scriptLocation, scriptArguments) {
        this._scriptLocation = scriptLocation;
        this._scriptArguments = scriptArguments;
    }
    cleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._scriptLocation.toLowerCase() === 'inlinescript') {
                yield Utility_1.Utility.deleteFile(this._scriptPath);
            }
        });
    }
}
exports.ScriptType = ScriptType;
class WindowsPowerShell extends ScriptType {
    getTool() {
        return __awaiter(this, void 0, void 0, function* () {
            this._scriptPath = yield Utility_1.Utility.getPowerShellScriptPath(this._scriptLocation, ['ps1'], this._scriptArguments);
            let tool = tl.tool(tl.which('powershell', true))
                .arg('-NoLogo')
                .arg('-NoProfile')
                .arg('-NonInteractive')
                .arg('-ExecutionPolicy')
                .arg('Unrestricted')
                .arg('-Command')
                .arg(`. '${this._scriptPath.replace(/'/g, "''")}'`);
            return tool;
        });
    }
    cleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utility_1.Utility.deleteFile(this._scriptPath);
        });
    }
}
exports.WindowsPowerShell = WindowsPowerShell;
class PowerShellCore extends ScriptType {
    getTool() {
        return __awaiter(this, void 0, void 0, function* () {
            this._scriptPath = yield Utility_1.Utility.getPowerShellScriptPath(this._scriptLocation, ['ps1'], this._scriptArguments);
            let tool = tl.tool(tl.which('pwsh', true))
                .arg('-NoLogo')
                .arg('-NoProfile')
                .arg('-NonInteractive')
                .arg('-ExecutionPolicy')
                .arg('Unrestricted')
                .arg('-Command')
                .arg(`. '${this._scriptPath.replace(/'/g, "''")}'`);
            return tool;
        });
    }
    cleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utility_1.Utility.deleteFile(this._scriptPath);
        });
    }
}
exports.PowerShellCore = PowerShellCore;
class Bash extends ScriptType {
    getTool() {
        return __awaiter(this, void 0, void 0, function* () {
            this._scriptPath = yield Utility_1.Utility.getScriptPath(this._scriptLocation, ['sh']);
            let tool = tl.tool(tl.which("bash", true));
            tool.arg(this._scriptPath);
            tool.line(this._scriptArguments); // additional scriptArguments should always call line. line() parses quoted arg strings
            return tool;
        });
    }
}
exports.Bash = Bash;
class Batch extends ScriptType {
    getTool() {
        return __awaiter(this, void 0, void 0, function* () {
            this._scriptPath = yield Utility_1.Utility.getScriptPath(this._scriptLocation, ['bat', 'cmd']);
            let tool = tl.tool(tl.which(this._scriptPath, true));
            tool.line(this._scriptArguments); // additional scriptArguments should always call line. line() parses quoted arg strings
            return tool;
        });
    }
}
exports.Batch = Batch;
