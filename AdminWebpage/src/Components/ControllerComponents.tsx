import { Component } from "react";

import App from "../App.tsx";

import "./ControllerComponents.css";
import { getHHMMFromDate } from "../utils.ts";


interface NextChangeAtProperties {
    app: App;
    timeTillNext: Date;
}

export class NextChangeAtComponent extends Component<NextChangeAtProperties, unknown> {
    constructor(properties: NextChangeAtProperties) {
        super(properties);
    }

    render() {
        return (
            <span>
                Idő lejár:
                <input
                    style={{ marginLeft: "10px", marginRight: "10px" }}
                    type="time"
                    className="timeLeftInput"
                    value={getHHMMFromDate(this.props.timeTillNext)}
                    onChange={e => {
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
    ref: React.RefObject<ConfirmPopupComponent | null>;
    text: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface ConfirmPopupState {
    isVisible: boolean;
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, ConfirmPopupState> {
    constructor(properties: ConfirmPopupProperties) {
        super(properties);
        this.state = {
            isVisible: false,
        };
    }

    show() {
        this.setState({ isVisible: true });
    }

    render() {
        return (
            <>
                {this.state.isVisible ? (
                    <div className="confirmPopup">
                        <p>{this.props.text}</p>
                        <div>
                            <button className="cancel" onClick={() => { this.props.onCancel(); this.setState({ isVisible: false }); }}>Nem</button>
                            <button className="confirm" onClick={() => { this.props.onConfirm(); this.setState({ isVisible: false }); }}>Igen</button>
                        </div>
                    </div>
                ) : null}
            </>
        );
    }
}
