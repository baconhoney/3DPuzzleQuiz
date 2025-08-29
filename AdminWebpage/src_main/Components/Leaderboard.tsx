import { Component } from "react";

import App from "../App.tsx";
import { fetchData, getTimeFromDate, type QuizLanguage, type LeaderboardItems, type JsonLeaderboardItems } from "../utils.ts";

import "./Leaderboard.css";

import { getResultsData } from "../Testdata.ts";
import { addListener, removeListener } from "../websocketHandler.ts";


interface Props {
    app: App;
}

interface State {
    leaderboardItems: LeaderboardItems;
}

export default class LeaderboardComponent extends Component<Props, State> {
    private leaderboardUpdatedListener: number | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            leaderboardItems: [],
        };
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        this.leaderboardUpdatedListener = addListener("leaderboardUpdated", () => this.getLeaderboard());
        this.getLeaderboard();
    }

    componentWillUnmount() {
        removeListener(this.leaderboardUpdatedListener);
    }

    private getLeaderboard() {
        const convertFn = (json: JsonLeaderboardItems) =>
            json.map((item) => ({
                ...item,
                language: item.language as QuizLanguage,
                submittedAt: item.submittedAt ? new Date(item.submittedAt) : null,
            }));
        if (import.meta.env.MODE == "production") {
            fetchData("/api/admin/getLeaderboard", data =>
                this.updateState({
                    leaderboardItems: convertFn(data as JsonLeaderboardItems),
                })
            );
        } else {
            // temp code for testing
            this.updateState({
                leaderboardItems: convertFn(getResultsData()),
            });
        }
    }

    render() {
        return (
            <>
                <div style={{ position: "relative", maxHeight: "100%", height: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
                        <table className="quiz-results">
                            <thead style={{ position: "sticky", top: "0" }}>
                                <tr
                                    onClick={() => {
                                        this.props.app.updateState({ openedQuizTeamID: null });
                                    }}>
                                    <th className="teamID">teamID</th>
                                    <th className="groupname">Csapatnév</th>
                                    <th className="score">Pont-szám</th>
                                    <th className="timestamp">Leadás ideje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.leaderboardItems.map((elem, i) => (
                                    <tr key={i} onClick={() => { this.props.app.updateState({ openedQuizTeamID: elem.teamID }); }}
                                        className={elem.teamID === this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                                        <td className="teamID">{elem.teamID}</td>
                                        <td className="groupname">{elem.teamname}</td>
                                        <td className="score">{elem.score}</td>
                                        <td className="timestamp">{elem.submittedAt ? getTimeFromDate(elem.submittedAt) : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button style={{ position: "absolute", top: "0px", left: "0px" }} onClick={() => this.getLeaderboard()}>R</button>
                </div>
            </>
        );
    }
}
