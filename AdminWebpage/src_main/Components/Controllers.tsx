import { Component } from "react";

import "./Controllers.css";


interface ConfirmPopupProperties {
    ref: React.RefObject<ConfirmPopupComponent | null>;
    text: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface ConfirmPopupState {
    isVisible: boolean;
    callerData: any
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, ConfirmPopupState> {
    constructor(properties: ConfirmPopupProperties) {
        super(properties);
        this.state = {
            isVisible: false,
            callerData: null
        };
    }

    updateState(newState: Partial<ConfirmPopupState>){
        this.setState({ ...this.state, ...newState });
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
                            <button className="cancel" onClick={() => { this.props.onCancel(); this.updateState({ isVisible: false }); }}>Nem</button>
                            <button className="confirm" onClick={() => { this.props.onConfirm(); this.updateState({ isVisible: false }); }}>Igen</button>
                        </div>
                    </div>
                ) : null}
            </>
        );
    }
}
