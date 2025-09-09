import { Component } from "react";

import App from "../App.tsx";
import { fetchData, getTimeFromDate, type QuizLanguage, type LeaderboardItems, type JsonLeaderboardItems, type QuizSize, QuizSizes, type LeaderboardItem } from "../utils.ts";

import "./Leaderboard.css";

import { getResultsData } from "../Testdata.ts";
import { addListener, removeListener } from "../websocketHandler.ts";


const _sizeFilters = [...QuizSizes, null];

interface Props {
    app: App;
}

interface State {
    leaderboardItems: LeaderboardItems,
    sizeFilter: QuizSize | null,
    roundFilter: number | null,
}

export default class LeaderboardComponent extends Component<Props, State> {
    private leaderboardUpdatedListener: number | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            leaderboardItems: [],
            sizeFilter: null,
            roundFilter: 1,
        };
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        this.leaderboardUpdatedListener = addListener("leaderboardUpdated", () => this.updateLeaderboard());
        this.updateLeaderboard();
    }

    componentWillUnmount() {
        removeListener(this.leaderboardUpdatedListener);
    }

    componentDidUpdate(_: Readonly<Props>, prevState: Readonly<State>): void {
        if (prevState.roundFilter !== this.state.roundFilter || prevState.sizeFilter !== this.state.sizeFilter) {
            this.updateLeaderboard();
        }
    }

    private updateLeaderboard() {
        const convertFn = (json: JsonLeaderboardItems) =>
            json.map((item) => ({
                ...item,
                language: item.language as QuizLanguage,
                size: item.size as QuizSize,
                submittedAt: item.submittedAt ? new Date(item.submittedAt) : null,
            }));
        if (import.meta.env.MODE == "production") {
            const params = new Array<string>();
            if (this.state.sizeFilter !== null) params.push(`size=${this.state.sizeFilter}`);
            if (this.state.roundFilter !== null) params.push(`round=${this.state.roundFilter}`);
            const url = "/api/admin/getLeaderboard" + (params.length > 0 ? "?" + params.join("&") : "");
            //console.log("Request url is:", url);
            fetchData(url, data =>
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

    private formatExtraData(data: LeaderboardItem){
        return <div className="extra">
            <p>teamID: {data.teamID}</p>
            <p>teamname: {data.teamname}</p>
            <p>codeword: {data.codeword}</p>
            <p>language: {data.language}</p>
            <p>size: {data.size}</p>
            <p>score: {data.score}</p>
            <p>submittedAt: {data.submittedAt ? getTimeFromDate(data.submittedAt) : ""}</p>
        </div>
    }

    render() {
        return (
            <div className="leaderboard">
                <div className="buttons">
                    <div className="refresh">
                        <button className="image" onClick={() => this.updateLeaderboard()}><img src="refresh_icon.svg" /></button>
                    </div>
                    <div className="size-filter">
                        <button className="text" onClick={() => this.updateState({ sizeFilter: _sizeFilters[_sizeFilters.indexOf(this.state.sizeFilter) > 0 ? (_sizeFilters.indexOf(this.state.sizeFilter) - 1) : _sizeFilters.length - 1] })}>{"<"}</button>
                        <button className="text" onClick={() => this.updateState({ sizeFilter: null })}>{this.state.sizeFilter ?? "-"}</button>
                        <button className="text" onClick={() => this.updateState({ sizeFilter: _sizeFilters[(_sizeFilters.indexOf(this.state.sizeFilter) + 1) % _sizeFilters.length] })}>{">"}</button>
                    </div>
                    <div className="round-filter">
                        <button className="text" onClick={() => this.updateState({
                            roundFilter: this.state.roundFilter === null ? 0 : (this.state.roundFilter > 0 ? this.state.roundFilter - 1 : 0)
                        })}>{"<"}</button>
                        <button className="text" onClick={() => this.updateState({ roundFilter: null })}>{this.state.roundFilter === null ? "-" : (this.state.roundFilter || "C").toString()}</button>
                        <button className="text" onClick={() => this.updateState({
                            roundFilter: this.state.roundFilter === null ? 0 : (this.state.roundFilter < 100 ? this.state.roundFilter + 1 : 100)
                        })}>{">"}</button>
                    </div>
                </div>
                <div className="display">
                    <table>
                        <thead>
                            <tr onClick={() => this.props.app.updateState({ openedQuizTeamID: null })}>
                                <th className="teamID">teamID</th>
                                <th className="language">Ny</th>
                                <th className="teamname">Csapatnév</th>
                                <th className="score">Pont-szám</th>
                                <th className="timestamp">Leadás ideje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.leaderboardItems.map((elem, i) => (
                                <tr key={i} onClick={() => { this.props.app.updateState({ openedQuizTeamID: elem.teamID }); }}
                                    className={elem.teamID === this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                                    <td className="teamID">{elem.teamID}{this.formatExtraData(elem)}</td>
                                    <td className="language">{elem.language.toUpperCase()}</td>
                                    <td className="teamname">{elem.teamname}</td>
                                    <td className="score">{elem.score}</td>
                                    <td className="timestamp">{elem.submittedAt ? getTimeFromDate(elem.submittedAt) : ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
