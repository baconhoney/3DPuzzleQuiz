import { useEffect, useState } from "react";
import { useGlobalContext } from "./App";
import i18n from "i18next";
import ThemeToggle from "./ThemeToggle";

const Register = () => {
    const { changeLng, t, toQuiz, teamName, setTeamName } = useGlobalContext();
    const [language, setLanguage] = useState(i18n.language);
    const [quizSize, setQuizSize] = useState(20);
    const [nameError, setNameError] = useState(false);

    useEffect(() => {
        const onLangChanged = (lng) => setLanguage(lng);
        i18n.on("languageChanged", onLangChanged);
        return () => i18n.off("languageChanged", onLangChanged);
    }, []);

    const quizSizes = [20, 100];

    const isLanguageSelected = (lng) => (language === lng ? " btn-active" : "");

    const handleInputChange = (e) => {
        setTeamName(e.target.value);
    };

    const handleButtonClick = (e) => {
        e.preventDefault();
        if (teamName.trim() === "") {
            setNameError(true);
            return;
        }

        localStorage.setItem("teamName", teamName);
        localStorage.setItem("quizSize", quizSize);
        localStorage.removeItem("teamID");

        toQuiz();
    };

    return (
        <div className="flex flex-col items-center min-h-screen gap-6 w-full">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="flex flex-col items-center gap-2 mt-20">
                <div className="flex items-center gap-2">
                    <button
                        className={"btn btn-info btn-outline" + isLanguageSelected("hu")}
                        onClick={() => changeLng("hu")}
                    >
                        🇭🇺 Magyar
                    </button>
                    <button
                        className={"btn btn-info btn-outline" + isLanguageSelected("en")}
                        onClick={() => changeLng("en")}
                    >
                        🇬🇧 English
                    </button>
                </div>
            </div>

            <div
                onSubmit={handleButtonClick}
                className="flex flex-col items-center content-center gap-5 w-2/3"
            >
                <fieldset className="fieldset w-full max-w-sm">
                    <legend className="fieldset-legend">{t("team_name")}</legend>
                    <input
                        type="text"
                        className={"input w-full " + (nameError ? "input-error" : "")}
                        placeholder={t("type_here")}
                        value={teamName}
                        maxLength={200}
                        onChange={handleInputChange}
                    />
                    {nameError && (
                        <p className="label text-error">{t("team_name_required")}</p>
                    )}

                    <legend className="fieldset-legend">{t("quiz_type")}</legend>
                    <div className="flex flex-row justify-between gap-2">
                        {quizSizes.map((type) => (
                            <button
                                key={type}
                                className={"btn btn-info btn-outline flex-1" + (type === quizSize ? " btn-active" : "")}
                                onClick={() => setQuizSize(type)}
                            >
                                {type} {t("questions")}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <button
                    onClick={handleButtonClick}
                    className="btn btn-primary w-full">
                    {t("continue")}
                </button>
            </div>
        </div>
    );
};

export default Register;
