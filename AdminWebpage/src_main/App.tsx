import { Component, PureComponent } from "react";

import LeaderboardComponent from "./Components/Leaderboard.tsx";
import DetailsComponent from "./Components/Details.tsx";

import "./websocketHandler.ts";

import "./App.css";
import ControlsComponent from "./Components/Controls.tsx";


interface AppState {
    openedQuizTeamID: number | null;
}

export default class App extends Component<unknown, AppState> {

    constructor(props: unknown) {
        super(props);
        this.state = {
            openedQuizTeamID: null,
        };
    }

    updateState(newState: Partial<AppState>) {
        this.setState({ ...this.state, ...newState });
    }

    prompConfirm() {

    }

    render() {
        return (
            <div id="main-cell">
                <div id="main-left-cell" style={{ position: "relative" }}>
                    <DetailsComponent app={this} teamID={this.state.openedQuizTeamID} />
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
                        <ControlsComponent app={this} />
                    </div>
                </div>
            </div>
        );
    }
}

