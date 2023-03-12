"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrackFSM = exports.State = void 0;
var State;
(function (State) {
    State[State["wait"] = 0] = "wait";
    State[State["interact"] = 1] = "interact";
})(State = exports.State || (exports.State = {}));
class TimeTrackFSM {
    constructor() {
        this.state = State.wait;
        this.sessionListeners = new Array();
        this.tickCountFromLastInteract = 0;
        this.lastTickTime = new Date();
    }
    get state() {
        return this._state;
    }
    set state(value) {
        this._state = value;
    }
    addSessionListener(listener) {
        this.sessionListeners.push(listener);
    }
    onTick() {
        let tickCount = this.calculateTickCount();
        if (tickCount > 2) {
            this.handleIdleState();
        }
        this.debug("onTick, tickCount: " + tickCount + ", lastTickTime: " + this.lastTickTime);
        this.lastTickTime = new Date();
        this.tickCountFromLastInteract += tickCount;
        if (this.state == State.interact && this.isIdleTimeExpired()) {
            this.handleInteractEnd();
        }
    }
    calculateTickCount() {
        if (this.lastTickTime === null) {
            return 0;
        }
        const currentTickTime = new Date();
        const durationFromLastTickSeconds = Math.round((currentTickTime.getTime() - this.lastTickTime.getTime()) / 1000);
        let tickCount = Math.round(durationFromLastTickSeconds / TimeTrackFSM.TICK_SECONDS);
        if (tickCount < 0) {
            tickCount = 0;
        }
        return tickCount;
    }
    handleIdleState() {
        this.handleInteractEnd();
        this.printState("After handle idle state");
    }
    handleInteractEnd() {
        this.printState("handleInteractEnd");
        this.state = State.wait;
        this.notifyListenersAboutSession();
        this.lastInteractTime = null;
        this.startInteractTime = null;
    }
    isIdleTimeExpired() {
        return this.tickCountFromLastInteract * TimeTrackFSM.TICK_SECONDS >= TimeTrackFSM.IDLE_TIME_SECONDS;
    }
    notifyListenersAboutSession() {
        let sessionDurationSeconds = 0;
        if (this.lastInteractTime !== null && this.startInteractTime !== null) {
            sessionDurationSeconds = (this.lastInteractTime.getTime() - this.startInteractTime.getTime()) / 1000;
        }
        sessionDurationSeconds = Math.floor(sessionDurationSeconds);
        if (sessionDurationSeconds > 0) {
            this.sessionListeners.forEach(l => l.onSession(sessionDurationSeconds));
        }
    }
    onEdit(time) {
        this.printState("onEdit, time: " + time);
        if (this.state == State.wait) {
            this.handleInteractStart(time);
        }
        if (this.calculateTickCount() > 1) {
            console.log("Fix idle state");
            this.lastInteractTime = this.lastTickTime; //Fix idle state
        }
        else {
            this.lastInteractTime = time;
        }
        this.tickCountFromLastInteract = 0;
    }
    handleInteractStart(time) {
        this.printState("handleInteractStart");
        this.state = State.interact;
        this.startInteractTime = time;
    }
    onExit() {
        this.printState("onExit");
        this.handleInteractEnd();
    }
    printState(message) {
        this.debug("FSM: " + message);
        this.debug("  state: " + (this._state == 0 ? 'wait' : 'interact'));
        this.debug("  tickCountFromLastInteract: " + this.tickCountFromLastInteract);
        this.debug("  startInteractTime: " + this.startInteractTime);
        this.debug("  lastInteractTime: " + this.lastInteractTime);
    }
    debug(message) {
        if (TimeTrackFSM.DEBUG_ON) {
            console.log(message);
        }
    }
}
exports.TimeTrackFSM = TimeTrackFSM;
TimeTrackFSM.DEBUG_ON = false;
TimeTrackFSM.TICK_SECONDS = 5;
TimeTrackFSM.IDLE_TIME_SECONDS = 60 * 10; //10 minutes
//# sourceMappingURL=TimeTrackFSM.js.map