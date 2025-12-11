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
const tasks = require("azure-pipelines-task-lib/task");
const tools = require("azure-pipelines-tool-lib/tool");
const path = require("path");
const installer = require("./terraform-installer");
function configureTerraform() {
    return __awaiter(this, void 0, void 0, function* () {
        let inputVersion = tasks.getInput("terraformVersion", true);
        let terraformPath = yield installer.downloadTerraform(inputVersion);
        let envPath = process.env['PATH'];
        // Prepend the tools path. Instructs the agent to prepend for future tasks
        if (envPath && !envPath.startsWith(path.dirname(terraformPath))) {
            tools.prependPath(path.dirname(terraformPath));
        }
    });
}
function verifyTerraform() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(tasks.loc("VerifyTerraformInstallation"));
        let terraformPath = tasks.which("terraform", true);
        let terraformTool = tasks.tool(terraformPath);
        terraformTool.arg("version");
        return terraformTool.exec();
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));
        try {
            yield configureTerraform();
            yield verifyTerraform();
            tasks.setResult(tasks.TaskResult.Succeeded, "");
        }
        catch (error) {
            tasks.setResult(tasks.TaskResult.Failed, error);
        }
    });
}
run();
