import { StrictMode, Component, createRef } from "react";
import { createRoot } from "react-dom/client";

import QuizResultsComponent from "./Components/QuizResultsComponent.tsx";
import QuizDetailsComponent from "./Components/QuizDetailsComponent.tsx";
import { NextChangeAtComponent, ConfirmPopupComponent } from "./Components/ControllerComponents.tsx";

import { fetchData, getHHMMFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "./utils.ts";
import "./websocketHandler.ts";
import * as actions from "./Actions.ts";

import "./App.css";
import addListener, { removeListener, type listenerFunction } from "./websocketHandler.ts";


interface AppState {
    openedQuizTeamID: number | null;
    nextPhaseChangeAt: Date;
    currentQuizNumber: number;
    phase: QuizPhase;
    onlyShowLeaderboard: boolean;
    printingCopyCount: number;
    printingLanguage: QuizLanguage;
    printingSize: QuizSize;
}

export default class App extends Component<unknown, AppState> {
    private confirmSendPhasePopupRef = createRef<ConfirmPopupComponent>();
    private confirmSendUpdateNextChangeAtPopupRef = createRef<ConfirmPopupComponent>();
    private confirmSendPrintRequestPopupRef = createRef<ConfirmPopupComponent>();
    private stateChangedListener: listenerFunction | null = null;

    constructor(props: unknown) {
        super(props);
        let date = new Date();
        date.setSeconds(0, 0);
        this.state = {
            openedQuizTeamID: null,
            nextPhaseChangeAt: date,
            currentQuizNumber: 1,
            phase: "idle",
            onlyShowLeaderboard: window.innerHeight > window.innerWidth,
            printingCopyCount: 1,
            printingLanguage: "hu",
            printingSize: 20,
        };
    }

    updateState(newState: Partial<AppState>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        this.stateChangedListener = addListener("stateChanged", () => {
            if (import.meta.env.MODE == "production") {
                fetchData("/api/admin/getStates", (data) => this.updateState({
                    nextPhaseChangeAt: new Date(data.nextPhaseChangeAt as string),
                    currentQuizNumber: data.currentQuizNumber as number,
                    phase: data.phase as QuizPhase,
                }));
            } else {
                this.updateState({
                    nextPhaseChangeAt: new Date(Date.now() + 30 * 60 * 1000),
                    currentQuizNumber: this.state.currentQuizNumber + 1,
                    phase: this.state.phase as QuizPhase,
                })
            }
        })
    }

    componentWillUnmount(): void {
        removeListener(this.stateChangedListener);
    }

    render() {
        return (
            <>
                {this.state.onlyShowLeaderboard
                    ? <div id="quiz-results">
                        <QuizResultsComponent app={this} />
                    </div>
                    : <>
                        <div id="main-cell">
                            <div id="main-left-cell" style={{ position: "relative" }}>
                                <QuizDetailsComponent app={this} teamID={this.state.openedQuizTeamID} />
                            </div >
                            <div id="main-right-cell">
                                <div id="main-top-right-cell">
                                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                        <div style={{ overflow: "auto" }}>
                                            <QuizResultsComponent app={this} />
                                        </div>
                                    </div>
                                </div>
                                <div id="main-bottom-right-cell">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td className="time-display-container">
                                                    <NextChangeAtComponent app={this} timeTillNext={this.state.nextPhaseChangeAt} />
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
                                                    <button style={{ width: "100px", height: "50px" }} onClick={() => this.confirmSendUpdateNextChangeAtPopupRef.current?.show()}>Beállít</button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={4} className="next-phase-container">
                                                    <button style={{ width: "200px", height: "120px" }} onClick={() => this.confirmSendPhasePopupRef.current?.show()}>Pillanatnyi fázis:<br />{this.state.phase}</button>
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
                                                            <button onClick={() => this.confirmSendPrintRequestPopupRef.current?.show()}>Nyomtat</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div >
                        <ConfirmPopupComponent ref={this.confirmSendPhasePopupRef} text={"Biztosan kvíz fázist vált? A következő fázisváltás várható ideje " + getHHMMFromDate(this.state.nextPhaseChangeAt) + " lesz."}
                            onConfirm={() => { actions.sendNextPhase(this); }} onCancel={() => { }} />
                        <ConfirmPopupComponent ref={this.confirmSendUpdateNextChangeAtPopupRef} text="Biztosan frissíti a következő fázisváltás várható idejét?"
                            onConfirm={() => { actions.setTimeTill(this.state.nextPhaseChangeAt); }} onCancel={() => { }} />
                        <ConfirmPopupComponent ref={this.confirmSendPrintRequestPopupRef} text={"Biztosan kinyomtatja a következőt?\n" + `${this.state.printingCopyCount} példányban '${this.state.printingLanguage}' nyelven ${this.state.printingSize}-as méretűt`}
                            onConfirm={() => { actions.queuePrint(this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize); }} onCancel={() => { }} />
                    </>
                }
                <button id="change-layout" onClick={() => this.updateState({ onlyShowLeaderboard: !this.state.onlyShowLeaderboard })}>
                    <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <path d="M199.04 369.92h170.88a83.84 83.84 0 0 0 85.12-85.12V113.92A83.84 83.84 0 0 0 369.92 28.8H199.04a83.84 83.84 0 0 0-85.12 85.12V284.8a85.76 85.76 0 0 0 85.12 85.12z m-28.16-256a26.88 26.88 0 0 1 28.16-28.16h170.88a26.88 26.88 0 0 1 28.16 28.16V284.8a26.88 26.88 0 0 1-28.16 28.16H199.04a26.88 26.88 0 0 1-28.16-28.16zM841.6 654.08H640a69.12 69.12 0 0 0-68.48 68.48v204.8A69.12 69.12 0 0 0 640 995.2h204.8a69.12 69.12 0 0 0 68.48-68.48v-204.8a69.12 69.12 0 0 0-68.48-68.48z m8.32-181.76h-39.68l71.04 122.24 71.04-122.24h-45.44a398.08 398.08 0 0 0-394.88-358.4v56.96a343.68 343.68 0 0 1 338.56 301.44z m-676.48 82.56h39.68l-70.4-122.24-71.04 122.24h45.44a397.44 397.44 0 0 0 394.88 355.2v-56.96a341.12 341.12 0 0 1-338.56-298.24z m0 0" />
                    </svg>
                </button>
            </>
        );
    }
}


createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

