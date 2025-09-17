import { Component } from "react";

import type App from "../App";

import { fetchData, getHHMMFromDate, QuizLanguages, QuizPhases, type QuizLanguage, type QuizPhase, type QuizSize } from "../utils";
import { addListener, removeListener } from "../websocketHandler.ts";
import * as actions from "../Actions.ts";

import "./Controls.css";
import { LogsComponent } from "./Controllers.tsx";

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
        console.log("TimeLeft mounted, starting interval");
        this.intervalHandler = setInterval(() => this.updateTime(), 1000);
        this.updateTime();
    }

    componentWillUnmount(): void {
        console.log("TimeLeft unmount, clearing interval");
        clearInterval(this.intervalHandler);
    }

    componentDidUpdate(prevProps: Readonly<TimeLeftProps>): void {
        if (prevProps.nextChangeAt !== this.props.nextChangeAt) {
            console.log("TimeLeft nextChangeAt changed");
            this.updateTime();
        }
    }

    private updateTime() {
        const f = (n: number) => (n > 9 ? "" : "0") + n;
        let left = (this.props.nextChangeAt.valueOf() - Date.now()) / 1000; // seconds
        const sign = left < 0 ? "-" : "";
        left = left < 0 ? -left + 0.999999 : left;
        const mm = Math.floor((left / 60));
        const ss = Math.floor(left % 60);
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
        const currdate = new Date(Date.now() + 60000);
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
        console.log("Controls updateState", newState);
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        console.log("Controls mounted");
        this.stateChangedListener = addListener("stateChanged", () => {
            console.log("stateChanged event");
            this.props.app.logsComponentRef.current?.addLog("debug", "stateChanged event");
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
        console.log("Controls unmount");
        removeListener(this.stateChangedListener);
    }

    private getStatesData() {
        console.log("Fetching states data");
        this.props.app.logsComponentRef.current?.addLog("debug", "Fetching states data");
        fetchData("/api/admin/getStates", (data: { nextPhaseChangeAt: string, currentQuizRound: number, phase: QuizPhase }) => {
            console.log("Received states data", data);
            this.props.app.logsComponentRef.current?.addLog("info", "States data received");
            this.updateState({
                nextPhaseChangeAt: new Date(data.nextPhaseChangeAt),
                currentQuizRound: data.currentQuizRound,
                phase: data.phase,
            })
        });
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
                                                    console.log("nextChangeAt input changed", e.target.value);
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
                                <button onClick={() => {
                                    console.log("Clicked -5 min");
                                    this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000 * 5) })
                                }}>-5</button>
                                <button onClick={() => {
                                    console.log("Clicked -1 min");
                                    this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() - 60000 * 1) })
                                }}>-1</button>
                                <button onClick={() => {
                                    console.log("Clicked +1 min");
                                    this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() + 60000 * 1) })
                                }}>+1</button>
                                <button onClick={() => {
                                    console.log("Clicked +5 min");
                                    this.updateState({ nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getTime() + 60000 * 5) })
                                }}>+5</button>
                            </div>
                            <button className="send-change"
                                onClick={
                                    () => void this.props.app.promptConfirm(<h1>Biztosan frissíti a következő fázisváltás várható idejét?</h1>).then(
                                        () => {
                                            console.log("Confirmed nextPhaseChangeAt", this.state.nextPhaseChangeAt);
                                            this.props.app.logsComponentRef.current?.addLog("info", "Sent nextPhaseChangeAt request");
                                            actions.sendNewNextPhaseChangeAt(this.state.nextPhaseChangeAt)
                                        },
                                        () => { console.log("Cancelled nextPhaseChangeAt change"); }
                                    )
                                }
                            >Beállít</button>
                        </div>
                        <div className="states">
                            <div className="phase">
                                <div className="text">
                                    <span className="label">Jelenlegi fázis:</span>
                                    <span className="value">{QuizPhases[this.state.phase]}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        const currPhase = this.state.phase;
                                        const nextPhase = actions.getNextPhase(currPhase);
                                        console.log("Phase change clicked", currPhase, nextPhase);
                                        this.props.app.logsComponentRef.current?.addLog("debug", `Phase change ${currPhase}->${nextPhase}`);
                                        this.props.app.promptConfirm(
                                            <>
                                                <h1>Biztosan kvíz fázist vált?</h1>
                                                Jelenlegi fázis: {QuizPhases[currPhase]}<br />
                                                Következő fázis: {QuizPhases[nextPhase]}<br />
                                                Fázisváltás ideje: {getHHMMFromDate(this.state.nextPhaseChangeAt)}
                                            </>
                                        ).then(
                                            () => {
                                                console.log("Confirmed phase change");
                                                this.props.app.logsComponentRef.current?.addLog("info", "Sent nextPhase request");
                                                actions.sendNextPhase(currPhase, nextPhase, this.state.nextPhaseChangeAt)
                                            },
                                            () => { console.log("Cancelled phase change"); }
                                        );
                                    }}
                                >Fázis váltása</button>
                            </div>
                            <div className="round">
                                <div className="text">
                                    <span className="label">Jelenlegi forduló:</span>
                                    <input className="value" id="quiz-round" type="number" min={0} max={99}
                                        value={this.state.currentQuizRound}
                                        onChange={(e) => {
                                            console.log("Round input changed", e.target.value);
                                            this.updateState({ currentQuizRound: parseInt(e.target.value || "0") || 0 })
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={
                                        () => void this.props.app.promptConfirm(
                                            <>
                                                <h1>Biztosan fordulót állít?</h1>
                                                Beállítandó forduló: {this.state.currentQuizRound}<br />
                                            </>
                                        ).then(
                                            () => {
                                                console.log("Confirmed round change", this.state.currentQuizRound);
                                                this.props.app.logsComponentRef.current?.addLog("info", "Sent setQuizRound request");
                                                actions.setQuizRound(this.state.currentQuizRound)
                                            },
                                            () => { console.log("Cancelled round change"); }
                                        )
                                    }
                                >Forduló váltása</button>
                            </div>
                        </div>
                    </div>
                    <div className="right-cell">
                        <div className="printing">
                            <div className="copy-count">
                                <label htmlFor="copy-count-input">Példányszám:</label>
                                <input id="copy-count-input" type="number" value={this.state.printingCopyCount}
                                    onChange={(e) => {
                                        console.log("Copy count changed", e.target.value);
                                        this.updateState({ printingCopyCount: parseInt(e.target.value) })
                                    }}
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
                                                onChange={(e) => {
                                                    console.log("Language changed to hu");
                                                    this.updateState({ printingLanguage: e.target.value as QuizLanguage })
                                                }} />
                                            <label htmlFor="select-hu">Magyar</label>
                                        </div>
                                        <div className="radio-input">
                                            <input type="radio" name="quiz-lang" id="select-en" value={"en"} checked={this.state.printingLanguage == "en"}
                                                onChange={(e) => {
                                                    console.log("Language changed to en");
                                                    this.updateState({ printingLanguage: e.target.value as QuizLanguage })
                                                }} />
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
                                                onChange={(e) => {
                                                    console.log("Size changed to 20");
                                                    this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })
                                                }} />
                                            <label htmlFor="select-20">20</label>
                                        </div>
                                        <div className="radio-input">
                                            <input type="radio" name="quiz-size" id="select-100" value={"100"} checked={this.state.printingSize == 100}
                                                onChange={(e) => {
                                                    console.log("Size changed to 100");
                                                    this.updateState({ printingSize: parseInt(e.target.value) as QuizSize })
                                                }} />
                                            <label htmlFor="select-100">100</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="print-button-container">
                                <button
                                    onClick={
                                        () => void this.props.app.promptConfirm(
                                            <>
                                                <h1>Biztosan kinyomtatja?</h1>
                                                Példányszám: {this.state.printingCopyCount} db<br />
                                                Nyelv: {QuizLanguages[this.state.printingLanguage]}<br />
                                                Méret: {this.state.printingSize}
                                            </>
                                        ).then(
                                            () => {
                                                console.log("Confirmed print job", this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize);
                                                this.props.app.logsComponentRef.current?.addLog("info", "Queued print job");
                                                actions.queuePrint(this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize)
                                            },
                                            () => { console.log("Cancelled print job"); }
                                        )
                                    }
                                >Nyomtat</button>
                            </div>
                        </div>
                        <LogsComponent app={this.props.app} />
                    </div>
                </div>
            </div>
        )
    }
}
