"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const TimeTrackFSM_1 = require("../src/TimeTrackFSM");
const mocha_1 = require("@testdeck/mocha");
const _chai = require("chai");
const chai_1 = require("chai");
_chai.should();
_chai.expect;
let TimeTrackFSMTests = class TimeTrackFSMTests {
    before() {
        this.fsm = new TimeTrackFSM_1.TimeTrackFSM();
        this.sessionListener = new TestSessionListener();
        this.fsm.addSessionListener(this.sessionListener);
    }
    'that initial FSM state is wait'() {
        chai_1.expect(this.fsm.state).eq(TimeTrackFSM_1.State.wait);
    }
    'that nothing happened if a lot of ticks generated in wait state'() {
        this.generateIdleTimeTicks();
        chai_1.expect(this.sessionListener.sessionHappened).eq(false);
    }
    'that state changed to interact if onEdit() happened'() {
        this.fsm.onEdit(new Date());
        chai_1.expect(this.fsm.state).eq(TimeTrackFSM_1.State.interact);
    }
    'that session generated if two events happened with interval 10 seconds'() {
        const start = new Date();
        let plus10Seconds = new Date();
        const sessionDuration = 10;
        plus10Seconds.setSeconds(start.getSeconds() + sessionDuration);
        this.fsm.onEdit(start);
        this.fsm.onEdit(plus10Seconds);
        this.generateIdleTimeTicks();
        chai_1.expect(this.fsm.state).eq(TimeTrackFSM_1.State.wait);
        chai_1.expect(this.sessionListener.sessionHappened).eq(true);
        chai_1.expect(this.sessionListener.sessionDuration).eq(sessionDuration);
    }
    'that idle time calculated correclty if interact event happened each 5 minutes'() {
        const start = new Date();
        //Edit start
        this.fsm.onEdit(start);
        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM_1.TimeTrackFSM.TICK_SECONDS);
        //Edit happened +5 minutes
        let plus5Minutes = new Date();
        plus5Minutes.setSeconds(start.getSeconds() + 300);
        this.fsm.onEdit(plus5Minutes);
        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM_1.TimeTrackFSM.TICK_SECONDS);
        //Edit happened +10 minutes
        let plus10Minutes = new Date();
        plus10Minutes.setSeconds(start.getSeconds() + 600);
        this.fsm.onEdit(plus10Minutes);
        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM_1.TimeTrackFSM.TICK_SECONDS);
        //Edit happened +15 minutes
        let plus15Minutes = new Date();
        plus15Minutes.setSeconds(start.getSeconds() + 900);
        this.fsm.onEdit(plus15Minutes);
        //No session happened
        chai_1.expect(this.sessionListener.sessionHappened).eq(false);
        //Idle time expired
        this.generateIdleTimeTicks();
        //15 minute session should be generated
        chai_1.expect(this.fsm.state).eq(TimeTrackFSM_1.State.wait);
        chai_1.expect(this.sessionListener.sessionHappened).eq(true);
        chai_1.expect(this.sessionListener.sessionDuration).eq(15 * 60);
    }
    'that session no generated if two events happened in different idle periods'() {
        this.fsm.onEdit(new Date());
        this.generateIdleTimeTicks();
        let plus10Seconds = new Date();
        const sessionDuration = 10;
        plus10Seconds.setSeconds(new Date().getSeconds() + sessionDuration);
        this.fsm.onEdit(plus10Seconds);
        this.generateIdleTimeTicks();
        chai_1.expect(this.fsm.state).eq(TimeTrackFSM_1.State.wait);
        chai_1.expect(this.sessionListener.sessionHappened).eq(false);
    }
    generateIdleTimeTicks() {
        const tickCount = TimeTrackFSM_1.TimeTrackFSM.IDLE_TIME_SECONDS / TimeTrackFSM_1.TimeTrackFSM.TICK_SECONDS + 1;
        this.generateTicks(tickCount);
    }
    generateTicks(count) {
        for (let i = 0; i < count; i++) {
            this.fsm.onTick();
        }
    }
};
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that initial FSM state is wait", null);
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that nothing happened if a lot of ticks generated in wait state", null);
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that state changed to interact if onEdit() happened", null);
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that session generated if two events happened with interval 10 seconds", null);
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that idle time calculated correclty if interact event happened each 5 minutes", null);
__decorate([
    mocha_1.test
], TimeTrackFSMTests.prototype, "that session no generated if two events happened in different idle periods", null);
TimeTrackFSMTests = __decorate([
    mocha_1.suite
], TimeTrackFSMTests);
class TestSessionListener {
    constructor() {
        this._sessionHappened = false;
        this._sessionDuration = 0;
    }
    onSession(durationSeconds) {
        this.sessionDuration = durationSeconds;
        this.sessionHappened = true;
    }
    get sessionHappened() {
        return this._sessionHappened;
    }
    set sessionHappened(value) {
        this._sessionHappened = value;
    }
    get sessionDuration() {
        return this._sessionDuration;
    }
    set sessionDuration(value) {
        this._sessionDuration = value;
    }
}
//# sourceMappingURL=TimeTrackFSMTests.js.map