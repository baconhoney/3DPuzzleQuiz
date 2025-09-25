import { Component } from "react"

import App from "../App.tsx"
import {
    fetchData,
    getTimeFromDate,
    type QuizLanguage,
    type LeaderboardItems,
    type JsonLeaderboardItems,
    type QuizSize,
    QuizSizes,
    type LeaderboardItem,
} from "../utils.ts"

import "./Leaderboard.css"

import { getResultsData } from "../Testdata.ts"
import { addListener, removeListener } from "../websocketHandler.ts"

const _sizeFilters = [...QuizSizes, null]

interface Props {
    app: App
}

interface State {
    leaderboardItems: LeaderboardItems
    sizeFilter: QuizSize | null
    roundFilter: number | null
    isModalOpen: boolean
    selectedItem: LeaderboardItem | null
}

export default class LeaderboardComponent extends Component<Props, State> {
    private leaderboardUpdatedListener: number | null = null

    constructor(props: Props) {
        super(props)
        this.state = {
            leaderboardItems: [],
            sizeFilter: null,
            roundFilter: 0,
            isModalOpen: false,
            selectedItem: null,
        }
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState })
    }

    private openModal(item: LeaderboardItem) {
        this.updateState({
            isModalOpen: true,
            selectedItem: item,
        })
    }

    private closeModal() {
        this.updateState({
            isModalOpen: false,
            selectedItem: null,
        })
    }

    componentDidMount() {
        this.leaderboardUpdatedListener = addListener(
            "leaderboardUpdated",
            () => this.updateLeaderboard()
        )
        this.updateLeaderboard()
    }

    componentWillUnmount() {
        removeListener(this.leaderboardUpdatedListener)
    }

    componentDidUpdate(_: Readonly<Props>, prevState: Readonly<State>): void {
        if (
            prevState.roundFilter !== this.state.roundFilter ||
            prevState.sizeFilter !== this.state.sizeFilter
        ) {
            this.updateLeaderboard()
        }
    }

    private updateLeaderboard() {
        const convertFn = (json: JsonLeaderboardItems) =>
            json.map((item) => ({
                ...item,
                language: item.language as QuizLanguage,
                size: item.size as QuizSize,
                submittedAt: item.submittedAt
                    ? new Date(item.submittedAt)
                    : null,
            }))
        if (import.meta.env.MODE == "production") {
            const params = new Array<string>()
            if (this.state.sizeFilter !== null)
                params.push(`size=${this.state.sizeFilter}`)
            if (this.state.roundFilter !== null)
                params.push(`round=${this.state.roundFilter}`)
            const url =
                "/api/admin/getLeaderboard" +
                (params.length > 0 ? "?" + params.join("&") : "")
            //console.log("Request url is:", url);
            fetchData(url, (data) =>
                this.updateState({
                    leaderboardItems: convertFn(data as JsonLeaderboardItems),
                })
            )
        } else {
            // temp code for testing
            this.updateState({
                leaderboardItems: convertFn(getResultsData()),
            })
        }
    }

    private renderModal() {
        if (!this.state.isModalOpen || !this.state.selectedItem) {
            return null
        }

        const item = this.state.selectedItem

        return (
            <div className="modal-overlay" onClick={() => this.closeModal()}>
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h3>Csapat részletei</h3>
                        <button
                            className="close-button"
                            onClick={() => this.closeModal()}
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        <p>
                            <strong>Csapat ID:</strong> {item.teamID}
                        </p>
                        <p>
                            <strong>Csapatnév:</strong> {item.teamname}
                        </p>
                        <p>
                            <strong>Kódszó:</strong> {item.codeword}
                        </p>
                        <p>
                            <strong>Nyelv:</strong> {item.language}
                        </p>
                        <p>
                            <strong>Méret:</strong> {item.size}
                        </p>
                        <p>
                            <strong>Pontszám:</strong> {item.score}
                        </p>
                        <p>
                            <strong>Leadás ideje:</strong>{" "}
                            {item.submittedAt
                                ? getTimeFromDate(item.submittedAt)
                                : "Nincs adat"}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    render() {
        return (
            <div className="leaderboard">
                <div className="buttons">
                    <div className="refresh">
                        <button
                            className="image"
                            onClick={() => this.updateLeaderboard()}
                        >
                            <img src="refresh_icon.svg" />
                        </button>
                    </div>
                    <div className="size-filter">
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    sizeFilter:
                                        _sizeFilters[
                                            _sizeFilters.indexOf(
                                                this.state.sizeFilter
                                            ) > 0
                                                ? _sizeFilters.indexOf(
                                                      this.state.sizeFilter
                                                  ) - 1
                                                : _sizeFilters.length - 1
                                        ],
                                })
                            }
                        >
                            {"<"}
                        </button>
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    sizeFilter: null,
                                })
                            }
                        >
                            {this.state.sizeFilter ?? "-"}
                        </button>
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    sizeFilter:
                                        _sizeFilters[
                                            (_sizeFilters.indexOf(
                                                this.state.sizeFilter
                                            ) +
                                                1) %
                                                _sizeFilters.length
                                        ],
                                })
                            }
                        >
                            {">"}
                        </button>
                    </div>
                    <div className="round-filter">
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    roundFilter:
                                        this.state.roundFilter === null
                                            ? 0
                                            : this.state.roundFilter > 0
                                            ? this.state.roundFilter - 1
                                            : 0,
                                })
                            }
                        >
                            {"<"}
                        </button>
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    roundFilter: null,
                                })
                            }
                        >
                            {this.state.roundFilter === null
                                ? "-"
                                : (this.state.roundFilter || "C").toString()}
                        </button>
                        <button
                            className="text"
                            onClick={() =>
                                this.updateState({
                                    roundFilter:
                                        this.state.roundFilter === null
                                            ? 0
                                            : this.state.roundFilter < 100
                                            ? this.state.roundFilter + 1
                                            : 100,
                                })
                            }
                        >
                            {">"}
                        </button>
                    </div>
                </div>
                <div className="display">
                    <table>
                        <thead>
                            <tr>
                                <th className="language">Ny</th>
                                <th className="teamname">Csapatnév</th>
                                <th className="score">Pont-szám</th>
                                <th className="timestamp">Leadás ideje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.leaderboardItems.map((elem, i) => (
                                <tr key={i}>
                                    <td
                                        className="language"
                                        onClick={() => this.openModal(elem)}
                                    >
                                        {elem.language.toUpperCase()}
                                    </td>
                                    <td className="teamname">
                                        {elem.teamname}
                                    </td>
                                    <td className="score">{elem.score}</td>
                                    <td className="timestamp">
                                        {elem.submittedAt
                                            ? getTimeFromDate(elem.submittedAt)
                                            : ""}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {this.renderModal()}
            </div>
        )
    }
}
