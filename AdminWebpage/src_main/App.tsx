import React, { Component } from "react";

import LeaderboardComponent from "./Components/Leaderboard.tsx";
import DetailsComponent from "./Components/Details.tsx";

import "./websocketHandler.ts";

import "./App.css";
import ControlsComponent from "./Components/Controls.tsx";
import { ConfirmPopupComponent, ErrorPopupComponent } from "./Components/Controllers.tsx";
import { addListener, removeListener } from "./websocketHandler.ts";


interface AppState {
    openedQuizTeamID: number | null;
    currentModal: React.ReactNode | undefined;
}

export default class App extends Component<unknown, AppState> {
    private showQuizListener: number | null = null;

    constructor(props: unknown) {
        super(props);
        this.state = {
            openedQuizTeamID: null,
            currentModal: undefined,
        };
    }

    updateState(newState: Partial<AppState>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount(): void {
        this.showQuizListener = addListener("showQuiz", (data: { teamID: number }) => {
            if (this.state.openedQuizTeamID == null) {
                this.updateState({ openedQuizTeamID: data.teamID });
            }
        })
    }

    componentWillUnmount(): void {
        removeListener(this.showQuizListener);
    }

    promptConfirm(text?: React.ReactNode): Promise<void> {
        return new Promise((resolve, reject) => {
            this.updateState({
                currentModal: <ConfirmPopupComponent
                    text={text}
                    onConfirm={() => {
                        this.updateState({ currentModal: undefined });
                        resolve();
                    }}
                    onCancel={() => {
                        this.updateState({ currentModal: undefined });
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject();
                    }} />
            })
        });
    }

    showError(text?: React.ReactNode): void {
        this.updateState({
            currentModal: <ErrorPopupComponent
                text={text}
                onAck={() => this.updateState({ currentModal: undefined })} />
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

