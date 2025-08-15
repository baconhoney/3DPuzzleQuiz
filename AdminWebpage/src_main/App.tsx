import { Component, createRef } from "react";

import LeaderboardComponent from "./Components/Leaderboard.tsx";
import DetailsComponent from "./Components/Details.tsx";
import { ConfirmPopupComponent } from "./Components/Controllers.tsx";

import { fetchData, getHHMMFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "./utils.ts";
import "./websocketHandler.ts";
import * as actions from "./Actions.ts";

import "./App.css";
import { addListener, removeListener, type listenerFunction } from "./websocketHandler.ts";
import ControlsComponent from "./Components/Controls.tsx";


interface AppState {
    openedQuizTeamID: number | null;
    nextPhaseChangeAt: Date;
    currentQuizNumber: number;
    phase: QuizPhase;
    printingCopyCount: number;
    printingLanguage: QuizLanguage;
    printingSize: QuizSize;
}

export default class App extends Component<unknown, AppState> {
    private confirmSaveDetailsPopupRef = createRef<ConfirmPopupComponent>();
    private confirmPrintQuizPopupRef = createRef<ConfirmPopupComponent>();
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
            <>
                <div id="main-cell">
                    <div id="main-left-cell" style={{ position: "relative" }}>
                        <DetailsComponent app={this} teamID={this.state.openedQuizTeamID}
                            confirmSaveDetailsPopupRef={this.confirmSaveDetailsPopupRef} confirmPrintQuizPopupRef={this.confirmPrintQuizPopupRef} />
                    </div >
                    <div id="main-right-cell">
                        <div id="main-top-right-cell">
                            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                <div style={{ overflow: "auto" }}>
                                    <LeaderboardComponent app={this} />
                                </div>
                            </div>
                        </div>
                        <div id="main-bottom-right-cell">
                            <ControlsComponent app={this} confirmNextChangeAtPopupRef={this.confirmSendUpdateNextChangeAtPopupRef}
                                confirmPhasePopupRef={this.confirmSendPhasePopupRef} confirmPrintRequestPopupRef={this.confirmSendPrintRequestPopupRef} />
                        </div>
                    </div>
                </div >
                <ConfirmPopupComponent ref={this.confirmSendPhasePopupRef} text={"Biztosan kvíz fázist vált? A következő fázisváltás várható ideje " + getHHMMFromDate(this.state.nextPhaseChangeAt) + " lesz."}
                    onConfirm={() => { actions.sendNextPhase(this); }} onCancel={() => { }} />
                <ConfirmPopupComponent ref={this.confirmSendUpdateNextChangeAtPopupRef} text="Biztosan frissíti a következő fázisváltás várható idejét?"
                    onConfirm={() => { actions.sendNewNextPhaseChangeAt(this.state.nextPhaseChangeAt); }} onCancel={() => { }} />
                <ConfirmPopupComponent ref={this.confirmSendPrintRequestPopupRef} text={"Biztosan kinyomtatja a következőt?\n" + `${this.state.printingCopyCount} példányban '${this.state.printingLanguage}' nyelven ${this.state.printingSize}-as méretűt`}
                    onConfirm={() => { actions.printEmptyQuiz(this.state.printingCopyCount, this.state.printingLanguage, this.state.printingSize); }} onCancel={() => { }} />
                <ConfirmPopupComponent ref={this.confirmSaveDetailsPopupRef} text="Biztosan menti a kvíz adatokat?"
                    onConfirm={() => {
                        this.confirmSaveDetailsPopupRef.current?.state.callerData && actions.uploadAnswers(
                            this.confirmSaveDetailsPopupRef.current?.state.callerData.teamName,
                            this.confirmSaveDetailsPopupRef.current?.state.callerData.answers
                        );
                    }}
                    onCancel={() => { }} />
                <ConfirmPopupComponent ref={this.confirmPrintQuizPopupRef} text="Biztosan kinyomtatja a kvízt?"
                    onConfirm={() => {
                        this.confirmPrintQuizPopupRef.current?.state.callerData && actions.printFilledQuiz(
                            this.confirmPrintQuizPopupRef.current?.state.callerData.teamID,
                        );
                    }}
                    onCancel={() => { }} />
            </>
        );
    }
}

