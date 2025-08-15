import React, { Component } from "react";

import type App from "../App";

import type { ConfirmPopupComponent } from "./Controllers";
import { fetchData, getHHMMFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "../utils";
import { addListener, removeListener, type listenerFunction } from "../websocketHandler.ts";

import "./Controls.css";


interface Props {
    app: App;
    confirmPhasePopupRef: React.RefObject<ConfirmPopupComponent | null>;
    confirmNextChangeAtPopupRef: React.RefObject<ConfirmPopupComponent | null>;
    confirmPrintRequestPopupRef: React.RefObject<ConfirmPopupComponent | null>;
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
    private stateChangedListener: listenerFunction | null = null;

    constructor(props: Props) {
        super(props);
        let date = new Date();
        date.setSeconds(0, 0);
        this.state = {
            currentQuizNumber: 1,
            phase: "idle",
            nextPhaseChangeAt: date,
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
                            <span>
                                Idő lejár:
                                <input
                                    style={{ marginLeft: "10px", marginRight: "10px" }}
                                    type="time"
                                    className="timeLeftInput"
                                    value={getHHMMFromDate(this.state.nextPhaseChangeAt)}
                                    onChange={e => {
                                        this.props.app.updateState({
                                            nextPhaseChangeAt: new Date(this.state.nextPhaseChangeAt.getFullYear(), this.state.nextPhaseChangeAt.getMonth(), this.state.nextPhaseChangeAt.getDate(),
                                                parseInt(e.target.value.substring(0, 2)), parseInt(e.target.value.substring(3, 5)), 0)
                                        });
                                    }}
                                />
                            </span>
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
                            <button style={{ width: "100px", height: "50px" }} onClick={() => this.props.confirmNextChangeAtPopupRef!.current!.show()}>Beállít</button>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={4} className="next-phase-container">
                            <button style={{ width: "200px", height: "120px" }} onClick={() => this.props.confirmPhasePopupRef!.current!.show()}>Pillanatnyi fázis:<br />{this.state.phase}</button>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={4}>
                            <div id="printing-controls" className="horiz-stack">
                                <div id="copy-count" className="horiz-stack">
                                    <input type="number" value={this.state.printingCopyCount}
                                        onChange={(e) => this.updateState({ printingCopyCount: parseInt(e.target.value) })} />
                                    <div>példány</div>
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
                                    <button onClick={() => this.props.confirmPrintRequestPopupRef!.current!.show()}>Nyomtat</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }
}

