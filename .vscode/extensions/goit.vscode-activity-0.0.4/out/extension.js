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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const axios = require("axios").default;
const TimeTrackFSM_1 = require("./TimeTrackFSM");
//Extension core
let core;
let timeoutIntervalIds;
function activate(context) {
    const config = new ExtensionConfiguration();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        config.onDidChangeConfiguration();
    }));
    core = new ExtensionCore(config, context.extensionPath);
    core.handle();
    context.subscriptions.push(vscode.workspace.onDidCreateFiles((e) => {
        e.files.forEach(file => {
            core.userEditEventHappened(file.path);
        });
    }));
    context.subscriptions.push(vscode.workspace.onDidDeleteFiles((e) => {
        e.files.forEach(file => {
            core.userEditEventHappened(file.path);
        });
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        core.userEditEventHappened(e.document.fileName);
    }));
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument((e) => {
        core.userEditEventHappened(e.document.fileName);
    }));
}
exports.activate = activate;
function deactivate() {
    core.isActive = false;
    for (const intervalId of timeoutIntervalIds) {
        clearInterval(intervalId);
    }
    core.timeTrackFsm.onExit();
}
exports.deactivate = deactivate;
class ExtensionCore {
    constructor(config, extensionPath) {
        this.m_queue = [];
        this.timeTrackFsm = new TimeTrackFSM_1.TimeTrackFSM();
        this.timeTrackFsm.addSessionListener(this);
        this.isActive = true;
        this.config = config;
        this.m_extensionPath = extensionPath;
        this.initQueue();
    }
    onSession(durationSeconds) {
        let now = new Date();
        now.setSeconds(now.getSeconds() - durationSeconds);
        let nowString = now.toISOString();
        const data = {
            event: "vscode",
            params: {
                type: this.config.eventType,
                startedAt: nowString.substring(0, nowString.lastIndexOf(".")),
                durationSeconds: durationSeconds,
            },
        };
        this.addEventToQueue(data);
    }
    handle() {
        const queueIntervalId = setInterval(() => {
            this.sendEventsFromQueue();
        }, 10 * 60 * 1000);
        const tickIntervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.isActive) {
                return;
            }
            this.timeTrackFsm.onTick();
        }), TimeTrackFSM_1.TimeTrackFSM.TICK_SECONDS * 1000);
        timeoutIntervalIds = [queueIntervalId, tickIntervalId];
    }
    sendEventsFromQueue() {
        console.log("Send events from queue to server");
        if (!this.isActive) {
            return;
        }
        while (this.m_queue.length > 0) {
            const result = this.sendEventToServer(this.m_queue[0]);
            if (result) {
                this.m_queue.shift();
                this.backupEventQueueToFile();
            }
            else {
                break;
            }
        }
    }
    sendEventToServer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "PersonalToken " + this.config.userToken,
                }
            };
            try {
                const response = yield axios.post(this.config.apiUrl, data, config);
                const status = response.status;
                return status === 200;
            }
            catch (e) {
                console.log(e);
                return false;
            }
        });
    }
    userEditEventHappened(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const extension = fileName.substr(fileName.lastIndexOf(".") + 1);
            if (!this.config.fileExtensions.split("|").includes(extension)) {
                return;
            }
            this.timeTrackFsm.onEdit(new Date());
        });
    }
    initQueue() {
        try {
            const fileContent = fs.readFileSync(this.getQueueFilePath(), 'utf8');
            this.m_queue = JSON.parse(fileContent);
        }
        catch (e) {
            console.log(e);
            this.m_queue = [];
        }
        this.sendEventsFromQueue();
    }
    getQueueFilePath() {
        return this.m_extensionPath + "/events.json";
    }
    addEventToQueue(data) {
        if (this.m_queue.length >= 1000) {
            this.m_queue.shift();
        }
        this.m_queue.push(data);
        this.backupEventQueueToFile();
    }
    backupEventQueueToFile() {
        const content = JSON.stringify(this.m_queue);
        fs.writeFileSync(this.getQueueFilePath(), content);
    }
}
class ExtensionConfiguration {
    constructor() {
        this.m_config = vscode.workspace.getConfiguration("lpubsppop01.autoTimeStamp");
    }
    onDidChangeConfiguration() {
        this.m_config = vscode.workspace.getConfiguration("lpubsppop01.autoTimeStamp");
        this.m_fileExtensions = null;
        this.m_USER_TOKEN = null;
        this.m_API_URL = null;
        this.m_EVENT_TYPE = null;
    }
    getValue(propertyName, defaultValue) {
        if (this.m_config == null)
            return defaultValue;
        const value = this.m_config.get(propertyName);
        return value != null ? value : defaultValue;
    }
    get fileExtensions() {
        if (this.m_fileExtensions == null) {
            this.m_fileExtensions = this.getValue("fileExtentions", "js|html|css|scss|sass|json");
        }
        return this.m_fileExtensions;
    }
    get time() {
        const time = this.getValue("time", 10);
        if (time >= 1 && time <= 60) {
            this.m_time = time;
        }
        else {
            this.m_time = 10;
        }
        return this.m_time;
    }
    get userToken() {
        if (this.m_USER_TOKEN == null) {
            this.m_USER_TOKEN = this.getValue("USER_TOKEN", "");
        }
        return this.m_USER_TOKEN;
    }
    get apiUrl() {
        if (this.m_API_URL == null) {
            const url = this.getValue("API_URL", "https://api.site.com/api/v1/user/event");
            if (!url.includes("http://") && !url.includes("https://")) {
                this.m_API_URL = "https://api.site.com/api/v1/user/event";
            }
            else {
                this.m_API_URL = url;
            }
        }
        return this.m_API_URL;
    }
    get eventType() {
        if (this.m_EVENT_TYPE == null) {
            this.m_EVENT_TYPE = this.getValue("EVENT_TYPE", "workOnFrontend");
        }
        return this.m_EVENT_TYPE;
    }
}
//# sourceMappingURL=extension.js.map