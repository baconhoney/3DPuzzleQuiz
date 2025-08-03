import { Component } from "react";
import App from "../App";
import "./QuizDetailsComponent.css";

interface Properties {
    app: App,
}

interface State {
    quiz: Question[];
}

export interface Question {
    buildingID?: number,
    name: string,
    country: string,
    city: string,
    answer?: string,
    correct?: boolean,
}

export interface Quiz {
    teamID: number,
    name: string,
    language: string,
    score: number,
    timestamp: Date,
    questions: Question[],
}

export default class QuizDetailsComponent extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.state ={
            quiz: [],
        };
    }

    render() {
        return <table style={{ width: '80%', maxWidth: '1200px' }} className="centered">
            <thead>
                <tr>
                    <td style={{ width: 'auto' }}>
                        <span id="testGroupName" style={{ padding: '0px 5px', fontSize: '1.5rem' }}>Csapatnév</span>
                    </td>
                    <td style={{ width: '45px', textAlign: 'center' }}>
                        <span id="testLang" style={{ padding: '0px 5px' }}>??</span>
                    </td>
                    <td style={{ padding: '0px 5px', width: '120px', textAlign: 'center' }}>
                        <span id="testScore" style={{ fontSize: '2rem' }}>14</span>
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colSpan={3}>
                        {this.props.app.state.openedQuizTeamID ?
                            <table className="test-content">
                                <thead>
                                    <tr>
                                        <th className="testcontent-name">Név</th>
                                        <th className="testcontent-location">Ország, Város</th>
                                        <th className="testcontent-id">ID</th>
                                        <th className="testcontent-number">Válasz</th>
                                        <th className="testcontent-correct">Helyes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.quiz.map((question: Question, index: number) => {
                                        return <tr key={index.toString()}>
                                            <td className="testcontent-name">{question.name}</td>
                                            <td className="testcontent-location">{question.country}{question.city == "-" ? ", " + question.city : ""}</td>
                                            <td className="testcontent-id">{question?.buildingID ?? ""}</td>
                                            <td className="testcontent-number">{question?.answer}</td>
                                            <td className="testcontent-correct">{question?.correct ? (question.correct ? "✅" : "❌") : ""}</td>
                                        </tr>
                                    })}
                                </tbody>
                            </table> : "Kattints egy kvízre az részletek megjelenítésehez!"}
                    </td>
                </tr>
            </tbody>
        </table >;
    }
}

