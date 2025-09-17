import React, { Component } from "react";

import LeaderboardComponent from "./Components/Leaderboard.tsx";
import DetailsComponent from "./Components/Details.tsx";

import "./websocketHandler.ts";

import "./App.css";
import ControlsComponent from "./Components/Controls.tsx";
import { ConfirmPopupComponent, ErrorPopupComponent, LogsComponent } from "./Components/Controllers.tsx";
import { addListener, removeListener } from "./websocketHandler.ts";

interface AppState {
    openedQuizTeamID: number | null,
    currentModal: React.ReactNode | undefined,
}

export default class App extends Component<unknown, AppState> {
    private showQuizListener: number | null = null;
    logsComponentRef = React.createRef<LogsComponent>();
    loglevel = "debug";

    constructor(props: unknown) {
        super(props);
        this.state = {
            openedQuizTeamID: null,
            currentModal: undefined,
        };
    }

    updateState(newState: Partial<AppState>) {
        console.log("updateState called with", newState);
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        console.log("componentDidMount called");
        this.showQuizListener = addListener("showQuiz", (data: { teamID: number }) => {
            console.log("showQuiz event received for team", data.teamID);
            if (this.state.openedQuizTeamID == null) {
                this.updateState({ openedQuizTeamID: data.teamID });
                this.logsComponentRef.current?.addLog("info", `Opened quiz for team ${data.teamID}`);
            } else {
                this.logsComponentRef.current?.addLog("info", `Quiz already opened for team ${this.state.openedQuizTeamID}`);
            }
        })
    }

    componentWillUnmount(): void {
        removeListener(this.showQuizListener);
        console.log("componentWillUnmount called, listener removed");
    }

    promptConfirm(text?: React.ReactNode): Promise<void> {
        this.logsComponentRef.current?.addLog("debug", "promptConfirm called");
        return new Promise((resolve, reject) => {
            this.updateState({
                currentModal: <ConfirmPopupComponent
                    text={text}
                    onConfirm={() => {
                        console.log("Confirmation popup accepted");
                        this.updateState({ currentModal: undefined });
                        resolve();
                    }}
                    onCancel={() => {
                        console.log("Confirmation popup cancelled");
                        this.updateState({ currentModal: undefined });
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject();
                    }}
                />
            })
        });
    }

    showError(text?: React.ReactNode): void {
        this.logsComponentRef.current?.addLog("debug", "Error popup shown to user");

        this.updateState({
            currentModal: <ErrorPopupComponent
                text={text}
                onAck={() => {
                    console.log("Error popup acknowledged by user");
                    this.updateState({ currentModal: undefined });
                }}
            />
        });
    }

    render() {
        return (
            <>
                <div id="main-cell">
                    <div id="main-left-cell">
                        <DetailsComponent app={this} teamID={this.state.openedQuizTeamID} />
                    </div >
                    <div id="main-right-cell">
                        <div id="main-top-right-cell">
                            <LeaderboardComponent app={this} />
                        </div>
                        <div id="main-bottom-right-cell">
                            <ControlsComponent app={this} />
                        </div>
                    </div>
                </div>
                {this.state.currentModal}
            </>
        );
    }
}
