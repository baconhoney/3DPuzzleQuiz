import { useEffect, useState } from 'react';
import { useLanguage } from './App';

const Register = () => {
    const { language, changeLng, t, toQuiz, teamName, setTeamName } = useLanguage();
    const [nameError, setNameError] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const isLanguageSelected = (lng) => language === lng ? " btn-active" : "";

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
        toQuiz();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-16 w-full">
            <div className="absolute top-4 right-4 z-50">
                <button className="btn btn-info btn-outline w-10" onClick={toggleTheme}>
                    {theme === 'light' ? t("🌙") : t("☀️")}
                </button>
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <button className={"btn btn-info btn-outline" + isLanguageSelected("hu")} onClick={() => changeLng("hu")}>🇭🇺 Magyar</button>
                    <button className={"btn btn-info btn-outline" + isLanguageSelected("en")} onClick={() => changeLng("en")}>🇬🇧 English</button>
                </div>
            </div>

            <form onSubmit={handleButtonClick} className="flex flex-col items-center content-center gap-5 w-2/3">
                <fieldset className="fieldset w-full max-w-sm">
                    <legend className="fieldset-legend">{t("team_name")}</legend>
                    <input
                        type="text"
                        className={"input w-full " + (nameError ? "input-error" : "")}
                        placeholder={t("type_here")}
                        value={teamName}
                        onChange={handleInputChange}
                    />
                    {nameError && <p className="label text-error">{t("team_name_required")}</p>}
                </fieldset>
                <button type="submit" className="btn btn-primary btn-wide">{t("continue")}</button>
            </form>
        </div>
    );
};

export default Register;
