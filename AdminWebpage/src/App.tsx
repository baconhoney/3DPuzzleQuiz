import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'

import QuizResultsComponent, { type QuizResults } from "./Components/QuizResultsComponent.tsx";
import QuizDetailsComponent, { type Question } from "./Components/QuizDetailsComponent.tsx";

import "./App.css";

import { getResultsData } from './Testdata.ts';


export interface JSONQuizResults {
    [index: string]: {
        teamID: number,
        name: string,
        score: number,
        timestamp: string
    }
}

export interface JSONQuizDetails {
    name: string,
    language: string,
    score: number,
    timestamp: string,
    questions: {
        [index: string]: Question
    }
}

interface State {
    openedQuizTeamID: number | null,
    quizResults: QuizResults,
}

export default class App extends Component<unknown, State> {
    private quizGetterHandler: number | undefined = undefined;

    constructor(properties: unknown) {
        super(properties);
        this.state = {
            openedQuizTeamID: null,
            quizResults: {},
        };
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        this.quizGetterHandler = setTimeout(() => {
            this.quizGetterHandler = setInterval(() => this.getQuizzes(), 10000);
            this.getQuizzes();
        }, 100);
    }

    componentWillUnmount() {
        clearTimeout(this.quizGetterHandler);
        clearInterval(this.quizGetterHandler);
    }

    private getQuizzes() {
        /*fetch("/api/admin/getQuizResults").then((response) => {
            response.json().then((data: QuizResult[]) => {
                this.updateState({
                    quizResults: data
                })
            })
        })*/
        // temp code for testing
        const json = getResultsData();
        const result: QuizResults = {};
        for (const key in json) {
            const item = json[key];
            result[key] = {
                ...item,
                timestamp: new Date(item.timestamp)
            }
        }
        this.updateState({
            quizResults: result,
        })
        clearInterval(this.quizGetterHandler);
    }

    setSelectedTab(tab: number | null) {
        this.setState({
            ...this.state,
            openedQuizTeamID: tab
        });
    }

    render() {
        return <div id="main-cell">
            <div id="main-left-cell" style={{ position: "relative" }}>
                <QuizDetailsComponent app={this} teamID={this.state.openedQuizTeamID} />
                <div className="vert-stack" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button>Mentés</button>
                    <button>Törlés</button>
                </div>
            </div>

            <div id="main-right-cell">
                <div id="main-top-right-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ overflow: 'auto' }}>
                            <QuizResultsComponent app={this} quizResults={this.state.quizResults} />
                        </div>
                    </div>
                </div>

                <div id="main-bottom-right-cell">
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <span style={{ marginRight: '5px' }}>Idő lejár:</span>
                                    <span id="timeLeft">HH:mm</span>
                                </td>
                                <td className="vert-stack">
                                    <button style={{ width: '50px', height: '50px' }}>+</button>
                                    <button style={{ width: '50px', height: '50px' }}>-</button>
                                </td>
                                <td>
                                    <button style={{ width: '100px', height: '50px' }}>Beállít</button>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={3}>
                                    <button style={{ width: '200px', height: '120px' }}>
                                        next phase
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    }
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)

