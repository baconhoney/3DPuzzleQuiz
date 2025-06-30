import React from 'react'
import { useLanguage } from './App'

const Register = () => {
    const { language, changeLng, t } = useLanguage();

    const isLanguageSelected = (lng) => {
        return language === lng ? " btn-active" : "";
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
                    <input type="text" className="input w-full" placeholder={t("type_here")} />
                </fieldset>
                <button className="btn btn-primary btn-wide">{t("continue")}</button>
            </div>
        </div>
    )
}

export default Register