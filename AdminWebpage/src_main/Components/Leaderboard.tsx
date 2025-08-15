import { Component } from "react";

import App from "../App.tsx";
import { fetchData, getTimeFromDate, type QuizLanguage, type LeaderboardItems, type JsonLeaderboardItems } from "../utils.ts";

import "./Leaderboard.css";

import { getResultsData } from "../Testdata.ts";
import { addListener, removeListener, type listenerFunction } from "../websocketHandler.ts";


interface Props {
    app: App;
}

interface State {
    leaderboardItems: LeaderboardItems;
}

export default class LeaderboardComponent extends Component<Props, State> {
    private leaderboardUpdatedListener: listenerFunction | null = null;

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
                submittedAt: new Date(item.submittedAt),
            }));
        if (import.meta.env.MODE == "production") {
            fetchData("/api/admin/getLeaderboard", (data) =>
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
            <table className="quiz-results">
                <thead style={{ position: "sticky", top: "0" }}>
                    <tr
                        onClick={() => {
                            this.props.app.updateState({ openedQuizTeamID: null });
                        }}>
                        <th className="groupname">Csapatnév</th>
                        <th className="score">Pont</th>
                        <th className="timestamp">Leadás ideje</th>
                        <th className="lang">Nyelv</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.leaderboardItems.map((elem, i) => (
                        <tr key={i} onClick={() => { this.props.app.updateState({ openedQuizTeamID: elem.teamID }); }}
                            className={elem.teamID === this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                            <td className="groupname">{elem.name}</td>
                            <td className="score">{elem.score}</td>
                            <td className="timestamp">{getTimeFromDate(elem.submittedAt)}</td>
                            <td className="lang">{elem.language}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}
