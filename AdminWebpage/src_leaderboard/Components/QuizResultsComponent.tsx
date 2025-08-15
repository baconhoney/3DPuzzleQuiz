import { Component } from "react";

import App from "../App.tsx";
import { fetchData, getTimeFromDate, type QuizLanguage, type QuizResults, type QuizSize, type RawQuizResults } from "../utils.ts";

import "./QuizResultsComponent.css";

import { getResultsData } from "../Testdata.ts";
import addListener, { removeListener, type listenerFunction } from "../websocketHandler.ts";


interface QuizResultsProperties {
    app: App;
}

interface QuizResultsState {
    quizResults: QuizResults;
}

export default class QuizResultsComponent extends Component<QuizResultsProperties, QuizResultsState> {
    private leaderboardUpdatedListener: listenerFunction | null = null;

    constructor(properties: QuizResultsProperties) {
        super(properties);
        this.state = {
            quizResults: [],
        };
    }

    private updateState(newState: Partial<QuizResultsState>) {
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
        const convertFn = (json: RawQuizResults) =>
            json.map((item) => ({
                ...item,
                language: item.language as QuizLanguage,
                quizSize: item.size as QuizSize,
                submittedAt: new Date(item.submittedAt),
            }));
        if (import.meta.env.MODE == "production") {
            fetchData("/api/admin/getLeaderboard", (data) =>
                this.updateState({
                    quizResults: convertFn(data as RawQuizResults),
                })
            );
        } else {
            // temp code for testing
            this.updateState({
                quizResults: convertFn(getResultsData()),
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
                    {this.state.quizResults.map((elem, i) => (
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
