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
    intervalHandler: number | undefined;
    timeLeft: string;
}

class TimeLeftComponent extends Component<TimeLeftProps, TimeLeftState> {
    constructor(props: TimeLeftProps) {
        super(props);
        this.state = {
            intervalHandler: undefined,
            timeLeft: "xx:xx:xx",
        };
    }

    updateState(newState: Partial<TimeLeftState>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        this.updateState({
            intervalHandler: setInterval(() => this.updateTime(), 1000)
        });
        this.updateTime();
    }

    componentWillUnmount(): void {
        clearInterval(this.state.intervalHandler!);
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
        const hh = Math.floor((left / 3600)); // hours
        const mm = Math.floor((left / 60) % 60); // minutes
        const ss = Math.floor(left % 60); // seconds
        this.updateState({
            timeLeft: `${sign}${f(hh)}:${f(mm)}:${f(ss)}`,
        });
    }

    render() {
        return (
            <span>Hátravan: {this.state.timeLeft}</span>
        );
    }
}


interface Props {
    app: App;
}

interface State {
    nextPhaseChangeAt: Date;
    currentQuizNumber: number;
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
            currentQuizNumber: 0,
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
                    currentQuizNumber: this.state.currentQuizNumber + 1,
                    phase: this.state.phase as QuizPhase,
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
            currentQuizNumber: data.currentQuizNumber as number,
            phase: data.phase as QuizPhase,
        }));
    }

    render() {
        return (
            <table>
                <tbody>
                    <tr>
                        <td className="time-display-container">
                            <div>
                                <label htmlFor="nextChangeAtInput">Idő lejár:</label>
                                <input
                                    id="nextChangeAtInput"
                                    style={{ marginLeft: "10px", marginRight: "10px" }}
                                    type="time"
                                    className="timeLeftInput"
                                    value={getHHMMFromDate(this.state.nextPhaseChangeAt)}
                                    onChange={e => {
                                        this.updateState({
                                            nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getFullYear(), this.state.nextPhaseChangeAt.getMonth(), this.state.nextPhaseChangeAt.getDate(),
                                                parseInt(e.target.value.substring(0, 2)), parseInt(e.target.value.substring(3, 5)), 0)
                                        });
                                    }}
                                />
                            </div>
                            <div>
                                <TimeLeftComponent nextChangeAt={this.state.nextPhaseChangeAt} />
                            </div>
                        </td>
                        <td className="plus-minus-1-buttons">
                            <div className="vert-stack">
                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() + 60000) })}>+1</button>
                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000) })}>-1</button>
                            </div>
                        </td>
                        <td className="plus-minus-5-buttons">
                            <div className="vert-stack">
                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() + 60000 * 5) })}>+5</button>
                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000 * 5) })}>-5</button>
                            </div>
                        </td>
                        <td className="send-change">
                            <button
                                style={{ width: "100px", height: "50px" }}
                                onClick={
                                    () => this.props.app.promptConfirm(<h1>Biztosan frissíti a következő fázisváltás várható idejét?</h1>).then(
                                        () => actions.sendNewNextPhaseChangeAt(this.state.nextPhaseChangeAt),
                                        () => { }
                                    )
                                }
                            >Beállít</button>
                        </td>
                    </tr>
                    <tr>
                        <td className="current-states">
                            <div className="vert-stack">
                                <p>Aktuális fázis: {QuizPhases[this.state.phase]}</p>
                                <p>Aktuális kvíz: {this.state.currentQuizNumber}</p>
                            </div>
                        </td>
                        <td colSpan={3} className="next-phase-container">
                            <button
                                onClick={
                                    () => this.props.app.promptConfirm(
                                        <>
                                            <h1>Biztosan kvíz fázist vált?</h1>
                                            A következő fázisváltás várható ideje {getHHMMFromDate(this.state.nextPhaseChangeAt)} lesz.
                                        </>
                                    ).then(
                                        () => actions.sendNextPhase(this.state.phase, this.state.nextPhaseChangeAt),
                                        () => { }
                                    )
                                }
                            >Fázis váltása</button>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={4}>
                            <div id="printing-controls" className="horiz-stack">
                                <div id="copy-count" className="horiz-stack">
                                    <input id="copy-count-input" type="number" value={this.state.printingCopyCount}
                                        onChange={(e) => this.updateState({ printingCopyCount: parseInt(e.target.value) })}
                                        min={1} max={99} />
                                    <label htmlFor="copy-count-input">példány</label>
                                </div>
                                <div id="settings" className="horiz-stack">
                                    <div id="quiz-lang" className="vert-stack">
                                        <div className="text">
                                            Nyelv
                                        </div>
                                        <div>
                                            <input type="radio" name="quiz-lang" id="select-hu" value={"hu"} checked={this.state.printingLanguage == "hu"}
                                                onChange={(e) => this.updateState({ printingLanguage: e.target.value as QuizLanguage })} />
                                            <label htmlFor="select-hu">Magyar</label>
                                        </div>
                                        <div>
                                            <input type="radio" name="quiz-lang" id="select-en" value={"en"} checked={this.state.printingLanguage == "en"}
                                                onChange={(e) => this.updateState({ printingLanguage: e.target.value as QuizLanguage })} />
                                            <label htmlFor="select-en">Angol</label>
                                        </div>
                                    </div>
                                    <div id="quiz-size" className="vert-stack">
                                        <div className="text">
                                            Méret
                                        </div>
                                        <div>
                                            <input type="radio" name="quiz-size" id="select-20" value={"20"} checked={this.state.printingSize == 20}
                                                onChange={(e) => this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })} />
                                            <label htmlFor="select-20">20</label>
                                        </div>
                                        <div>
                                            <input type="radio" name="quiz-size" id="select-100" value={"100"} checked={this.state.printingSize == 100}
                                                onChange={(e) => this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })} />
                                            <label htmlFor="select-100">100</label>
                                        </div>
                                    </div>
                                </div>
                                <div id="print-button-container">
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
                                                () => actions.queuePrintjob(this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize),
                                                () => { }
                                            )
                                        }
                                    >Nyomtat</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }
}

