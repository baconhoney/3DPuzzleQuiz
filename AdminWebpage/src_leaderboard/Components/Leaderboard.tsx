import { Component } from "react";

import App from "../App.tsx";
import { fetchData, getTimeFromDate, type QuizLanguage, type LeaderboardItems, type JsonLeaderboardItems, type QuizSize } from "../utils.ts";

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
                size: item.size as QuizSize,
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
                <div className="leaderboard">
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th className="language">Ny</th>
                                    <th className="groupname">Csapatnév</th>
                                    <th className="score">Pont-szám</th>
                                    <th className="timestamp">Leadás ideje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.leaderboardItems.map((elem, i) => (
                                    <tr key={i} onClick={() => console.log(elem.teamID)}>
                                        <td className="language">{elem.language.toUpperCase()}</td>
                                        <td className="groupname">{elem.teamname}</td>
                                        <td className="score">{elem.score}</td>
                                        <td className="timestamp">{elem.submittedAt ? getTimeFromDate(elem.submittedAt) : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={() => this.getLeaderboard()}><img src="../../icons/refresh_icon.svg" /></button>
                </div>
            </>
        );
    }
}
