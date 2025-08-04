import { Component } from "react";

import App from "../App.tsx";

import "./ControllerComponents.css";


interface TimeTillNextProperties {
    app: App,
    timeTillNext: Date,
}

export class TimeTillNextComponent extends Component<TimeTillNextProperties, unknown> {
    constructor(properties: TimeTillNextProperties) {
        super(properties);
    }

    private formatTime(localIsoDate: Date) {
        const f = (n: number) => (n > 9 ? "" : "0") + n;
        const hh = localIsoDate.getHours();
        const mm = localIsoDate.getMinutes();
        return f(hh) + ':' + f(mm);
    }

    render() {
        return (
            <span>Idő lejár:
                <input
                    style={{ marginLeft: '10px', marginRight: '10px' }}
                    type="time"
                    className="timeLeftInput"
                    value={this.formatTime(this.props.timeTillNext)}
                    onChange={(e) => {
                        this.props.app.updateState({
                            nextEventAt: new Date(this.props.timeTillNext.getFullYear(), this.props.timeTillNext.getMonth(), this.props.timeTillNext.getDate(),
                                parseInt(e.target.value.substring(0, 2)), parseInt(e.target.value.substring(3, 5)), 0)
                        });
                    }}
                />
            </span>
        );
    }
}

interface ConfirmPopupProperties {
    app: App,
    text: string,
    onConfirm: () => void,
    onCancel: () => void
    stateToUpdate: Partial<App["state"]>
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, unknown> {
    constructor(properties: ConfirmPopupProperties) {
        super(properties);
    }

    render() {
        return (
            <div className="confirmPopup">
                <p>{this.props.text}</p>
                <div>
                    <button className="cancel" onClick={() => { this.props.onCancel(); this.props.app.updateState(this.props.stateToUpdate); }}>Nem</button>
                    <button className="confirm" onClick={() => { this.props.onConfirm(); this.props.app.updateState(this.props.stateToUpdate); }}>Igen</button>
                </div>
            </div>
        );
    }
}

