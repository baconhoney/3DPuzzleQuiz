import { Component } from "react";

import App from "../App.tsx";
import { fetchData, type QuizDetails, type QuizLanguage, type JsonQuizDetails } from "../utils.ts";
import * as actions from "../Actions.ts";
import { getDetailsData } from "../Testdata.ts";

import "./Details.css";

interface Props {
    app: App;
    teamID: number | null;
}

interface State {
    details: QuizDetails | undefined;
}

export default class DetailsComponent extends Component<Props, State> {
    private inputRefs = new Map<number, HTMLInputElement | null>();

    constructor(props: Props) {
        super(props);
        this.state = {
            details: undefined,
        };
    }

    private updateState(newState: Partial<State>) {
        console.log("updateState called", newState);
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        console.log("DetailsComponent mounted");
        this.getQuizdata();
    }

    componentWillUnmount() {
        console.log("DetailsComponent will unmount");
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.teamID !== this.props.teamID) {
            console.log("teamID changed from", prevProps.teamID, "to", this.props.teamID);
            this.getQuizdata();
        }
    }

    private getQuizdata() {
        console.log("getQuizdata called for teamID:", this.props.teamID);
        this.props.app.logsComponentRef.current?.addLog("debug", `getQuizdata called for team ${this.props.teamID}`);
        const convertFn = (json: JsonQuizDetails) => ({
            ...json,
            language: json.language as QuizLanguage,
            submittedAt: json.submittedAt ? new Date(json.submittedAt) : null,
        });
        if (this.props.teamID) {
            if (import.meta.env.MODE == "production") {
                fetchData(`/api/admin/getQuizDetails?teamID=${this.props.teamID ?? 'null'}`, (data) => {
                    const res = convertFn(data as JsonQuizDetails);
                    this.updateState({ details: res });
                    console.log("Received details:", res);
                    this.props.app.logsComponentRef.current?.addLog("info", `Received quiz details for team ${this.props.teamID}`);
                });
            } else {
                const json = getDetailsData(this.props.teamID);
                if (!json) {
                    console.error(`No details found for teamID ${this.props.teamID}`);
                    this.props.app.logsComponentRef.current?.addLog("error", `No quiz details found for team ${this.props.teamID}`);
                    throw new Error(`No details found for teamID ${this.props.teamID}`);
                }
                const res = convertFn(json);
                this.updateState({ details: res });
                console.log("Dev mode: loaded test data for team", this.props.teamID);
                this.props.app.logsComponentRef.current?.addLog("debug", `Dev test data loaded for team ${this.props.teamID}`);
            }
        } else {
            this.updateState({ details: undefined });
            console.log("No teamID provided, details cleared");
            this.props.app.logsComponentRef.current?.addLog("debug", "No teamID, cleared details");
        }
    }

    render() {
        return (
            <div className="details">
                <div className="header">
                    <div className="teamname">
                        {this.props.teamID !== null && this.state.details !== undefined
                            ? (this.state.details.score !== null
                                ? <span>
                                    {this.state.details.codeword
                                        ? (
                                            this.state.details.teamname + (
                                                this.state.details.language == "hu"
                                                    ? ("aeiouéáűőúüóí".includes(this.state.details.codeword[0]) ? ", az " : ", a ")
                                                    : ", the "
                                            ) + this.state.details.codeword
                                        )
                                        : this.state.details.teamname
                                    }
                                </span>
                                : <input id={this.props.teamID.toString() ?? "null"} value={this.state.details.teamname ?? ""}
                                    onChange={e => this.updateState({ details: { ...this.state.details!, teamname: e.target.value } })}
                                />
                            )
                            : <span>Csapatnév</span>
                        }
                    </div>
                    <div className="button">
                        {this.props.teamID !== null && this.state.details !== undefined && this.state.details.submittedAt ? (
                            this.state.details.score !== null ? (
                                <button onClick={() => {
                                    console.log("Print button clicked for team", this.props.teamID);
                                    this.props.app.promptConfirm(<h1>Biztosan kinyomtatja a kvízt?</h1>).then(
                                        () => actions.printQuiz(this.props.teamID!),
                                        () => { }
                                    )
                                }}><img src="print_icon.svg" /></button>
                            ) : (
                                <button onClick={() => {
                                    console.log("Save button clicked for team", this.props.teamID);
                                    if (this.state.details!.teamname == null) {
                                        this.props.app.showError(<h1>Csapatnév hiányzik</h1>);
                                    } else if (this.state.details!.questions.some(entry => entry.answer === null)) {
                                        this.props.app.showError(<>
                                            <h1>A következő válaszok hiányoznak:</h1>
                                            {this.state.details!.questions.map((entry, index) => entry.answer === null ? <p key={entry.id}>{index + 1}. válasz (id: {entry.id}) hiányzik</p> : "")}
                                        </>);
                                    } else {
                                        this.props.app.promptConfirm(<h1>Biztosan menti a kvízt?</h1>).then(
                                            () => {
                                                actions.uploadAnswers(
                                                    this.props.teamID!,
                                                    this.state.details!.teamname!,
                                                    this.state.details!.questions.map(e => ({ id: e.id, answer: e.answer as number })),
                                                );
                                                this.props.app.updateState({ openedQuizTeamID: null });
                                            },
                                            () => { }
                                        );
                                    }
                                }}><img src="save_icon.svg" /></button>
                            )
                        ) : null}
                    </div>
                    <div className="language">
                        {this.state.details?.language.toUpperCase() ?? "Ny"}
                    </div>
                    <div className="score">
                        {this.state.details?.score ?? "??"} / {this.state.details?.questions.length ?? "??"}
                    </div>
                </div>
                <div className="table-container">
                    {this.props.teamID !== null && this.state.details !== undefined
                        ? <div className="inner-div">
                            <table key={this.props.teamID}>
                                <thead>
                                    <tr>
                                        <th className="name">Név</th>
                                        <th className="location">Elhelyezkedés</th>
                                        <th className="id">ID</th>
                                        <th className="number">Válasz</th>
                                        <th className="correct">Helyes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.details.questions.map((question, index) => {
                                        return (
                                            <tr key={question.id + "_" + index}>
                                                <td className="name">{question.name}</td>
                                                <td className="location">{question.location}</td>
                                                <td className="id">{question.id}</td>
                                                <td className="answer">
                                                    {this.state.details!.score !== null
                                                        ? question.answer
                                                        : <input
                                                            type="number"
                                                            autoComplete="off"
                                                            value={(question.answer ?? "").toString()}
                                                            id={question.id.toString()}
                                                            className="answer-input"
                                                            ref={ref => { this.inputRefs.set(index, ref) }}
                                                            onKeyUp={e => e.key == "Enter" && this.inputRefs.get(index + 1)?.select()}
                                                            onChange={(event) => {
                                                                const val = event.target.value ? parseInt(event.target.value) : null;
                                                                const newEntries = structuredClone(this.state.details!.questions);
                                                                newEntries[index].answer = val;
                                                                this.updateState({
                                                                    details: {
                                                                        ...this.state.details!,
                                                                        questions: newEntries,
                                                                    }
                                                                });
                                                                console.log("Answer changed for question", question.id, "to", val);
                                                            }}
                                                        />
                                                    }
                                                </td>
                                                <td className="correct">{question.correct !== null ? (question.correct ? "✅" : "❌") : ""}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        : <div className="text">Kattints egy kvízre a részletek megjelenítéséhez!</div>
                    }
                </div>
            </div>
        );
    }
}
