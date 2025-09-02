import { Component } from "react";

import type App from "../App";

import { fetchData, getHHMMFromDate, QuizLanguages, QuizPhases, type QuizLanguage, type QuizPhase, type QuizSize } from "../utils";
import { addListener, removeListener } from "../websocketHandler.ts";
import * as actions from "../Actions.ts";

import "./Controls.css";

interface TimeLeftProps {
    nextChangeAt: Date,
}

interface TimeLeftState {
    timeLeft: string;
}

class TimeLeftComponent extends Component<TimeLeftProps, TimeLeftState> {
    private intervalHandler: number | undefined = undefined;
    constructor(props: TimeLeftProps) {
        super(props);
        this.state = {
            timeLeft: "xx:xx:xx",
        };
    }

    private updateState(newState: Partial<TimeLeftState>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        this.intervalHandler = setInterval(() => this.updateTime(), 1000);
        this.updateTime();
    }

    componentWillUnmount(): void {
        clearInterval(this.intervalHandler);
    }

    componentDidUpdate(prevProps: Readonly<TimeLeftProps>): void {
        if (prevProps.nextChangeAt !== this.props.nextChangeAt) {
            this.updateTime();
        }
    }

    private updateTime() {
        const f = (n: number) => (n > 9 ? "" : "0") + n;
        let left = (this.props.nextChangeAt.valueOf() - Date.now()) / 1000; // seconds
        const sign = left < 0 ? "-" : "";
        left = left < 0 ? -left + 0.999999 : left; // adding almost one for simulating rounding up when left < 0
        //const hh = Math.floor((left / 3600)); // hours
        const mm = Math.floor((left / 60) /*% 60*/); // minutes
        const ss = Math.floor(left % 60); // seconds
        this.updateState({
            timeLeft: `${sign}${f(mm)}:${f(ss)}`,
        });
    }

    render() {
        return (
            <>{this.state.timeLeft}</>
        );
    }
}


interface Props {
    app: App;
}

interface State {
    nextPhaseChangeAt: Date;
    currentQuizRound: number;
    phase: QuizPhase;
    printingCopyCount: number;
    printingLanguage: QuizLanguage;
    printingSize: QuizSize;
}

export default class ControlsComponent extends Component<Props, State> {
    private stateChangedListener: number | null = null;

    constructor(props: Props) {
        super(props);
        let currdate = new Date(Date.now() + 60000);
        currdate.setSeconds(0, 0);
        this.state = {
            currentQuizRound: 0,
            phase: "idle",
            nextPhaseChangeAt: currdate,
            printingCopyCount: 1,
            printingLanguage: "hu",
            printingSize: 20,
        };
    }

    updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        this.stateChangedListener = addListener("stateChanged", () => {
            if (import.meta.env.MODE == "production") {
                this.getStatesData();
            } else {
                this.updateState({
                    nextPhaseChangeAt: new Date(Date.now() + 30 * 60 * 1000),
                    currentQuizRound: this.state.currentQuizRound + 1,
                    phase: QuizPhases[this.state.phase] as QuizPhase,
                })
            }
        });
        if (import.meta.env.MODE == "production") {
            this.getStatesData();
        }
    }

    componentWillUnmount(): void {
        removeListener(this.stateChangedListener);
    }

    private getStatesData() {
        fetchData("/api/admin/getStates", (data) => this.updateState({
            nextPhaseChangeAt: new Date(data.nextPhaseChangeAt as string),
            currentQuizRound: data.currentQuizRound as number,
            phase: data.phase as QuizPhase,
        }));
    }

    render() {
        return (
            <div className="controls">
                <div className="title">Vezérlőpult</div>
                <div className="content">
                    <div className="left-cell">
                        <div className="time-settings">
                            <table className="time-display-container">
                                <tbody>
                                    <tr className="nextChangeAt">
                                        <td>
                                            <label htmlFor="nextChangeAtInput">Idő lejár:</label>
                                        </td>
                                        <td>
                                            <input
                                                id="nextChangeAtInput"
                                                type="time"
                                                className="timeLeftInput"
                                                value={getHHMMFromDate(this.state.nextPhaseChangeAt)}
                                                onChange={e => {
                                                    const date = new Date(this.state.nextPhaseChangeAt.valueOf());
                                                    date.setHours(parseInt(e.target.value.substring(0, 2)), parseInt(e.target.value.substring(3, 5)), 0, 0);
                                                    this.updateState({ nextPhaseChangeAt: date });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr className="time-left">
                                        <td>Hátravan:</td>
                                        <td>
                                            <TimeLeftComponent nextChangeAt={this.state.nextPhaseChangeAt} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="plus-minus-buttons">
                                <button onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000 * 5) })}>-5</button>
                                <button onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000) })}>-1</button>
                                <button onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.valueOf() + 60000) })}>+1</button>
                                <button onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() + 60000 * 5) })}>+5</button>
                            </div>
                            <button className="send-change"
                                onClick={
                                    () => this.props.app.promptConfirm(<h1>Biztosan frissíti a következő fázisváltás várható idejét?</h1>).then(
                                        () => actions.sendNewNextPhaseChangeAt(this.state.nextPhaseChangeAt),
                                        () => { }
                                    )
                                }
                            >Beállít</button>
                        </div>
                        <div className="states">
                            <div className="current-states">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="label">Aktuális fázis:</td>
                                            <td className="value">{QuizPhases[this.state.phase]}</td>
                                        </tr>
                                        <tr>
                                            <td className="label">Aktuális kvíz:</td>
                                            <td className="value">{this.state.currentQuizRound}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="next-phase-button">
                                <button
                                    onClick={
                                        () => this.props.app.promptConfirm(
                                            <>
                                                <h1>Biztosan kvíz fázist vált?</h1>
                                                Következő fázis: {QuizPhases[actions.getNextPhase(this.state.phase)]}<br/>
                                                Fázisváltás ideje: {getHHMMFromDate(this.state.nextPhaseChangeAt)}
                                            </>
                                        ).then(
                                            () => actions.sendNextPhase(this.state.phase, this.state.nextPhaseChangeAt),
                                            () => { }
                                        )
                                    }
                                >Fázis váltása</button>
                            </div>
                        </div>
                    </div>
                    <div className="printing">
                        <div className="copy-count">
                            <label htmlFor="copy-count-input">Példányszám:</label>
                            <input id="copy-count-input" type="number" value={this.state.printingCopyCount}
                                onChange={(e) => this.updateState({ printingCopyCount: parseInt(e.target.value) })}
                                min={1} max={99} />
                        </div>
                        <div className="settings">
                            <div className="quiz-lang">
                                <div className="text">
                                    Nyelv
                                </div>
                                <div className="inputs">
                                    <div className="radio-input">
                                        <input type="radio" name="quiz-lang" id="select-hu" value={"hu"} checked={this.state.printingLanguage == "hu"}
                                            onChange={(e) => this.updateState({ printingLanguage: e.target.value as QuizLanguage })} />
                                        <label htmlFor="select-hu">Magyar</label>
                                    </div>
                                    <div className="radio-input">
                                        <input type="radio" name="quiz-lang" id="select-en" value={"en"} checked={this.state.printingLanguage == "en"}
                                            onChange={(e) => this.updateState({ printingLanguage: e.target.value as QuizLanguage })} />
                                        <label htmlFor="select-en">Angol</label>
                                    </div>
                                </div>
                            </div>
                            <div className="quiz-size">
                                <div className="text">
                                    Méret
                                </div>
                                <div className="inputs">
                                    <div className="radio-input">
                                        <input type="radio" name="quiz-size" id="select-20" value={"20"} checked={this.state.printingSize == 20}
                                            onChange={(e) => this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })} />
                                        <label htmlFor="select-20">20</label>
                                    </div>
                                    <div className="radio-input">
                                        <input type="radio" name="quiz-size" id="select-100" value={"100"} checked={this.state.printingSize == 100}
                                            onChange={(e) => this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })} />
                                        <label htmlFor="select-100">100</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="print-button-container">
                            <button
                                onClick={
                                    () => this.props.app.promptConfirm(
                                        <>
                                            <h1>Biztosan kinyomtatja?</h1>
                                            Példányszám: {this.state.printingCopyCount} db<br />
                                            Nyelv: {QuizLanguages[this.state.printingLanguage]}<br />
                                            Méret: {this.state.printingSize}-as
                                        </>
                                    ).then(
                                        () => actions.queuePrint(this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize),
                                        () => { }
                                    )
                                }
                            >Nyomtat</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

