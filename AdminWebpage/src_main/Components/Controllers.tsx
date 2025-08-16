import { Component } from "react";

import "./Controllers.css";


interface ConfirmPopupProperties {
    ref: React.RefObject<ConfirmPopupComponent | null>;
    text?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ConfirmPopupState {
    isVisible: boolean;
    callerData: any
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, ConfirmPopupState> {
    onConfirm: () => void = () => { };
    onCancel: () => void = () => { };

    constructor(properties: ConfirmPopupProperties) {
        super(properties);
        this.state = {
            isVisible: false,
            callerData: null
        };
    }

    private updateState(newState: Partial<ConfirmPopupState>){
        this.setState({ ...this.state, ...newState });
    }

    show() {
        this.updateState({ isVisible: true });
    }

    render() {
        return (
            <>
                {this.state.isVisible ? (
                    <div className="confirmPopup">
                        <p>{this.props.text ?? "Biztos benne?"}</p>
                        <div>
                            <button className="cancel" onClick={() => { this.onCancel?.(); this.updateState({ isVisible: false }); }}>Nem</button>
                            <button className="confirm" onClick={() => { this.onConfirm?.(); this.updateState({ isVisible: false }); }}>Igen</button>
                        </div>
                    </div>
                ) : null}
            </>
        );
    }
}
