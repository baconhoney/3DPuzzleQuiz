import { useState } from 'react'
import { useLanguage } from './App'

const Register = () => {
    const { language, changeLng, t, toQuiz, teamName, setTeamName } = useLanguage();

    const [nameError, setNameError] = useState(false);

    const isLanguageSelected = (lng) => {
        return language === lng ? " btn-active" : "";
    }

    function handleInputChange(e) {
        setTeamName(e.target.value);
    }

    function handleButtonClick() {
        if (teamName.trim() === "") {
            setNameError(true);
            return;
        }
        toQuiz();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-16 w-full">
            <div className="flex items-center gap-2 ">
                <button className={"btn btn-info btn-outline" + isLanguageSelected("hu")} onClick={() => changeLng("hu")}>🇭🇺 Magyar</button>
                <button className={"btn btn-info btn-outline" + isLanguageSelected("en")} onClick={() => changeLng("en")}>🇬🇧 English</button>
            </div>
            <div className="flex flex-col items-center content-center gap-5 w-2/3">
                <fieldset className="fieldset w-full max-w-sm">
                    <legend className="fieldset-legend">{t("team_name")}</legend>
                    <input type="text" className={"input w-full " + (nameError ? "input-error" : "")} placeholder={t("type_here")} value={teamName} onChange={(e) => handleInputChange(e)} />
                    {nameError ? <p className="label text-error">{t("team_name_required")}</p> : null}
                </fieldset>
                <button className="btn btn-primary btn-wide" onClick={handleButtonClick}>{t("continue")}</button>
            </div>
        </div>
    )
}

export default Register