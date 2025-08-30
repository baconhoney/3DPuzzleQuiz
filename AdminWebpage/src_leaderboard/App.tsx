import { Component } from "react";

import LeaderboardComponent from "./Components/Leaderboard.tsx";
import "./websocketHandler.ts";

import "./App.css";

export default class App extends Component<unknown, unknown> {

    constructor(props: unknown) {
        super(props);
        this.state = {
            openedQuizTeamID: null,
        };
    }

    render() {
        return (
            <LeaderboardComponent app={this} />
        );
    }
}

