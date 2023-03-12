import {State, TimeTrackFSM, SessionListener} from "../src/TimeTrackFSM";
import {suite, test} from '@testdeck/mocha';
import * as _chai from 'chai';
import {expect} from 'chai';

_chai.should();
_chai.expect;

@suite class TimeTrackFSMTests {
    private fsm: TimeTrackFSM;
    private sessionListener: TestSessionListener;

    before() {
        this.fsm = new TimeTrackFSM();

        this.sessionListener = new TestSessionListener();
        this.fsm.addSessionListener(this.sessionListener);
    }

    @test 'that initial FSM state is wait' () {
        expect(this.fsm.state).eq(State.wait);
    }

    @test 'that nothing happened if a lot of ticks generated in wait state' () {
        this.generateIdleTimeTicks();

        expect(this.sessionListener.sessionHappened).eq(false);
    }

    @test 'that state changed to interact if onEdit() happened' () {
        this.fsm.onEdit(new Date());

        expect(this.fsm.state).eq(State.interact);
    }

    @test 'that session generated if two events happened with interval 10 seconds' () {
        const start = new Date();

        let plus10Seconds = new Date();
        const sessionDuration = 10;
        plus10Seconds.setSeconds(start.getSeconds() + sessionDuration);

        this.fsm.onEdit(start);
        this.fsm.onEdit(plus10Seconds);

        this.generateIdleTimeTicks();

        expect(this.fsm.state).eq(State.wait);
        expect(this.sessionListener.sessionHappened).eq(true);
        expect(this.sessionListener.sessionDuration).eq(sessionDuration);
    }

    @test 'that idle time calculated correclty if interact event happened each 5 minutes' () {
        const start = new Date();

        //Edit start
        this.fsm.onEdit(start);

        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM.TICK_SECONDS);

        //Edit happened +5 minutes
        let plus5Minutes = new Date();
        plus5Minutes.setSeconds(start.getSeconds() + 300);
        this.fsm.onEdit(plus5Minutes);

        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM.TICK_SECONDS);

        //Edit happened +10 minutes
        let plus10Minutes = new Date();
        plus10Minutes.setSeconds(start.getSeconds() + 600);
        this.fsm.onEdit(plus10Minutes);

        //5 minutes happened
        this.generateTicks(300 / TimeTrackFSM.TICK_SECONDS);

        //Edit happened +15 minutes
        let plus15Minutes = new Date();
        plus15Minutes.setSeconds(start.getSeconds() + 900);
        this.fsm.onEdit(plus15Minutes);

        //No session happened
        expect(this.sessionListener.sessionHappened).eq(false);

        //Idle time expired
        this.generateIdleTimeTicks();

        //15 minute session should be generated
        expect(this.fsm.state).eq(State.wait);
        expect(this.sessionListener.sessionHappened).eq(true);
        expect(this.sessionListener.sessionDuration).eq(15 * 60);
    }

    @test 'that session no generated if two events happened in different idle periods' () {
        this.fsm.onEdit(new Date());

        this.generateIdleTimeTicks();

        let plus10Seconds = new Date();
        const sessionDuration = 10;
        plus10Seconds.setSeconds(new Date().getSeconds() + sessionDuration);
        this.fsm.onEdit(plus10Seconds);

        this.generateIdleTimeTicks();

        expect(this.fsm.state).eq(State.wait);
        expect(this.sessionListener.sessionHappened).eq(false);
    }

    @test 'that session generated if onExit() method called before idle time expired' () {
        //Two onEdit() events generated
        this.fsm.onEdit(new Date());

        let plus10Seconds = new Date();
        const sessionDuration = 10;
        plus10Seconds.setSeconds(new Date().getSeconds() + sessionDuration);
        this.fsm.onEdit(plus10Seconds);

        //Call onExit method()
        this.fsm.onExit();

        //Session should be generated
        expect(this.fsm.state).eq(State.wait);
        expect(this.sessionListener.sessionHappened).eq(true);
        expect(this.sessionListener.sessionDuration).eq(sessionDuration);
    }

    private generateIdleTimeTicks() {
        const tickCount = TimeTrackFSM.IDLE_TIME_SECONDS / TimeTrackFSM.TICK_SECONDS + 1;
        this.generateTicks(tickCount);
    }

    private generateTicks(count: number) {
        for(let i = 0; i < count; i++) {
            this.fsm.onTick();
        }
    }
}

class TestSessionListener implements SessionListener {
    private _sessionHappened: boolean = false;
    private _sessionDuration: number = 0;

    onSession(durationSeconds: number) {
        this.sessionDuration = durationSeconds;
        this.sessionHappened = true;
    }

    get sessionHappened(): boolean {
        return this._sessionHappened;
    }

    set sessionHappened(value: boolean) {
        this._sessionHappened = value;
    }

    get sessionDuration(): number {
        return this._sessionDuration;
    }

    set sessionDuration(value: number) {
        this._sessionDuration = value;
    }
}