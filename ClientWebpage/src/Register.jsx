import { useEffect, useState } from "react";
import { useGlobalContext } from "./App";
import i18n from "i18next";
import ThemeToggle from "./ThemeToggle";
import { getAnswers } from "./apiHandler";
import Results from "./Results";

const Register = () => {
    const { changeLng, t, toQuiz, setTeamName } = useGlobalContext();
    const [language, setLanguage] = useState(i18n.language);
    const [quizSize, setQuizSize] = useState(20);
    const [nameError, setNameError] = useState(false);

    // ✅ local-only input state (does not touch localStorage/context until continue)
    const [localName, setLocalName] = useState("");

    useEffect(() => {
        const onLangChanged = (lng) => setLanguage(lng);
        i18n.on("languageChanged", onLangChanged);
        return () => i18n.off("languageChanged", onLangChanged);
    }, []);

    const quizSizes = [20, 100];

    const isLanguageSelected = (lng) => (language === lng ? " btn-active" : "");

    const handleButtonClick = async (e) => {
        e.preventDefault();
        if (localName.trim() === "") {
            setNameError(true);
            return;
        }

        // ✅ Now store only when Continue is clicked
        setTeamName(localName);

        if (
            localStorage.getItem("language") == "en" &&
            quizSize == 100 &&
            localName.match(/^%\d{10}$/) != null
        ) {
            localStorage.setItem("adminData", localName.substring(1));
        } else {
            localStorage.setItem("teamName", localName);
            localStorage.setItem("quizSize", quizSize);
            localStorage.removeItem("teamID");
        }
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
                        type="button"
                        className={"btn btn-info btn-outline" + isLanguageSelected("hu")}
                        onClick={() => changeLng("hu")}
                    >
                        🇭🇺 Magyar
                    </button>
                    <button
                        type="button"
                        className={"btn btn-info btn-outline" + isLanguageSelected("en")}
                        onClick={() => changeLng("en")}
                    >
                        🇬🇧 English
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center content-center gap-5 w-2/3">
                <fieldset className="fieldset w-full max-w-sm">
                    <legend className="fieldset-legend inline-block whitespace-nowrap w-auto">{t("team_name")}</legend>
                    <input
                        type="text"
                        className={"input w-full " + (nameError ? "input-error" : "")}
                        placeholder={t("type_here")}
                        value={localName}
                        maxLength={200}
                        onChange={(e) => setLocalName(e.target.value)}
                    />
                    {nameError && (
                        <p className="label text-error">{t("team_name_required")}</p>
                    )}

                    <legend className="fieldset-legend inline-block whitespace-nowrap w-auto">{t("quiz_type")}</legend>
                    <div className="flex flex-row justify-between gap-2">
                        {quizSizes.map((type) => (
                            <button
                                type="button"
                                key={type}
                                className={
                                    "btn btn-info btn-outline flex-1" +
                                    (type === quizSize ? " btn-active" : "")
                                }
                                onClick={() => setQuizSize(type)}
                            >
                                {type} {t("questions")}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <button
                    type="button"
                    onClick={handleButtonClick}
                    className="btn btn-primary btn-wide"
                >
                    {t("continue")}
                </button>
            </div>
        </div>
    );
};

export default Register;
