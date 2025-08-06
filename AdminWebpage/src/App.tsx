import { StrictMode, Component, createRef } from "react";
import { createRoot } from "react-dom/client";

import QuizResultsComponent from "./Components/QuizResultsComponent.tsx";
import QuizDetailsComponent from "./Components/QuizDetailsComponent.tsx";
import { NextChangeAtComponent, ConfirmPopupComponent } from "./Components/ControllerComponents.tsx";

import * as actions from "./Actions.ts";
import { getHHMMFromDate, type QuizPhase } from "./utils.ts";

import "./App.css";


interface AppState {
    openedQuizTeamID: number | null;
    nextEventAt: Date;
    currentQuizNumber: number;
    phase: QuizPhase;
}

export default class App extends Component<unknown, AppState> {
    private confirmSendPhasePopupRef = createRef<ConfirmPopupComponent>();
    private confirmSendUpdateNextChangeAtPopupRef = createRef<ConfirmPopupComponent>();

    constructor(props: unknown) {
        super(props);
        let date = new Date();
        date.setSeconds(0, 0);
        this.state = {
            openedQuizTeamID: null,
            nextEventAt: date,
            currentQuizNumber: 1,
            phase: "idle",
        };
    }

    updateState(newState: Partial<AppState>) {
        this.setState({ ...this.state, ...newState });
    }

    render() {
        return (
            <>
                <div id="main-cell">
                    <div id="main-left-cell" style={{ position: "relative" }}>
                        <QuizDetailsComponent app={this} teamID={this.state.openedQuizTeamID} />
                        <div className="vert-stack" style={{ position: "absolute", top: "10px", right: "10px" }}>
                            <button>Mentés</button>
                            <button>Törlés</button>
                        </div>
                    </div>
                    <div id="main-right-cell">
                        <div id="main-top-right-cell">
                            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                <div style={{ overflow: "auto" }}>
                                    <QuizResultsComponent app={this}/>
                                </div>
                            </div>
                        </div>
                        <div id="main-bottom-right-cell">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>
                                            <NextChangeAtComponent app={this} timeTillNext={this.state.nextEventAt} />
                                        </td>
                                        <td>
                                            <div className="vert-stack">
                                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextEventAt: new Date(this.state.nextEventAt.getTime() + 60000) })}>+1</button>
                                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextEventAt: new Date(this.state.nextEventAt.getTime() - 60000) })}>-1</button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="vert-stack">
                                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextEventAt: new Date(this.state.nextEventAt.getTime() + 60000 * 5) })}>+5</button>
                                                <button style={{ width: "50px", height: "50px" }} onClick={() => this.updateState({ nextEventAt: new Date(this.state.nextEventAt.getTime() - 60000 * 5) })}>-5</button>
                                            </div>
                                        </td>
                                        <td>
                                            <button style={{ width: "100px", height: "50px" }} onClick={() => this.confirmSendUpdateNextChangeAtPopupRef.current?.show()}>Beállít</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4}>
                                            <button style={{ width: "200px", height: "120px" }} onClick={() => this.confirmSendPhasePopupRef.current?.show()}>Pillanatnyi fázis:<br />{this.state.phase}</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <ConfirmPopupComponent app={this} ref={this.confirmSendPhasePopupRef} text={"Biztosan kvíz fázist vált? A következő fázisváltás várható ideje " + getHHMMFromDate(this.state.nextEventAt) + " lesz."}
                    onConfirm={() => { actions.sendNextPhase(this); }} onCancel={() => { }} />
                <ConfirmPopupComponent app={this} ref={this.confirmSendUpdateNextChangeAtPopupRef} text="Biztosan frissíti a következő fázisváltás várható idejét?"
                    onConfirm={() => { actions.setTimeTill(this.state.nextEventAt); }} onCancel={() => { }} />
            </>
        );
    }
}


createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

