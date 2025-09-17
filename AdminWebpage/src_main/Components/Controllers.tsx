import { Component, createRef } from "react";

import "./Controllers.css";
import type App from "../App";


interface ConfirmPopupProperties {
    text?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, unknown> {

    constructor(properties: ConfirmPopupProperties) {
        super(properties);
        console.log("ConfirmPopup ctor", properties);
    }

    render() {
        console.log("Render ConfirmPopup", this.props.text);
        return (
            <div className="confirmPopup">
                <div className="msg">{this.props.text ?? "Biztos benne?"}</div>
                <div className="buttons">
                    <button className="cancel" onClick={() => {
                        console.log("ConfirmPopup cancel clicked");
                        this.props.onCancel?.();
                    }}>Nem</button>
                    <button className="confirm" onClick={() => {
                        console.log("ConfirmPopup confirm clicked");
                        this.props.onConfirm?.();
                    }}>Igen</button>
                </div>
            </div>
        );
    }
}

interface ErrorPopupProperties {
    text?: React.ReactNode;
    onAck: () => void;
}

export class ErrorPopupComponent extends Component<ErrorPopupProperties, unknown> {

    constructor(props: ErrorPopupProperties) {
        super(props);
        console.log("ErrorPopup ctor", props);
    }

    render() {
        console.log("Render ErrorPopup", this.props.text);
        return (
            <div className="errorPopup">
                <div className="msg">{this.props.text ?? "Ismeretlen hiba"}</div>
                <div className="buttons">
                    <button className="aknowledge" onClick={() => {
                        console.log("ErrorPopup acknowledged");
                        this.props.onAck();
                    }}>Ok</button>
                </div>
            </div>
        );
    }
}


interface LogsProps {
    app: App;
}

interface LogsState {
    logStrings: Array<{ content: string, level: string }>;
}

export class LogsComponent extends Component<LogsProps, LogsState> {
    private containerRef = createRef<HTMLDivElement>();
    
    constructor(props: LogsProps) {
        super(props);
        this.state = {
            logStrings: [{content: "This is the start of the log", level: "info"}],
        };
        this.props.app.logsComponentRef.current = this;
    }

    componentDidMount(): void {
        console.log("LogsComponent mounted");
        this.scrollToTop();
    }

    componentDidUpdate(_: Readonly<LogsProps>, prevState: Readonly<LogsState>): void {
        console.log("LogsComponent updated");
        if (prevState.logStrings !== this.state.logStrings) {
            console.log("Logs changed, scrolling");
            this.scrollToTop();
        }
    }

    private scrollToTop() {
        console.log("ScrollToTop triggered");
        if (this.containerRef.current !== null) {
            this.containerRef.current.scrollTop = this.containerRef.current.scrollHeight;
            console.log("Scrolled logs to bottom");
        } else {
            console.error("No containerRef for logs");
        }
    }

    addLog(level: "debug" | "info" | "warning" | "error", text: string) {
        console.log("addLog called", level, text);
        if (this.containerRef.current !== null) {
            const loglevels = ["debug", "info", "warning", "error"];
            if (loglevels.indexOf(this.props.app.loglevel) >= loglevels.indexOf(level)){
                console.log("Adding log entry", level, text);
                const currLogs = [...this.state.logStrings];
                if (currLogs.push({level: level, content: `${level}: ${text.substring(0, 60)}`}) > 100) {
                    console.log("Log limit exceeded, removing oldest");
                    currLogs.shift();
                }
                this.setState({ logStrings: currLogs });
            } else {
                console.log("Log filtered out by level", level);
            }
        } else {
            console.error("addLog skipped, no containerRef");
        }
    }

    render() {
        return (
            <div className="logs">
                <div className="inner" ref={this.containerRef}>
                    {this.state.logStrings.map((s, i) => <p key={i} className={s.level}>{s.content}</p>)}
                </div>
            </div>
        );
    }
}
