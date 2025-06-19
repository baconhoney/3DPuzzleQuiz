import { useState } from 'react'
import { useTranslation } from "react-i18next";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationHU from "./locales/hu/translation.json";
import translationEN from "./locales/en/translation.json";

const resources = {
	hu: {
		translation: translationHU,
	},
	en: {
		translation: translationEN,
	},
}

i18n.use(initReactI18next).init({
	resources,
	lng: 'hu',
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
})

function App() {
	const { i18n, t } = useTranslation();
	const [language, setLanguage] = useState('hu');

	const handleButtonClick = (lng) => {
		i18n.changeLanguage(lng);
		setLanguage(lng);
	}

	const isLanguageSelected = (lng) => {
		return language === lng ? "btn-active" : "";
	}

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen gap-16 w-full">
				<div className="flex items-center gap-2 ">
					<button className={"btn btn-info btn-outline" + isLanguageSelected("hu")} onClick={() => handleButtonClick("hu")}>🇭🇺 Magyar</button>
					<button className={"btn btn-info btn-outline" + isLanguageSelected("en")} onClick={() => handleButtonClick("en")}>🇬🇧 English</button>
				</div>
				<div className="flex flex-col items-center gap-5 w-2/3">
					<fieldset className="fieldset w-full">
						<legend className="fieldset-legend">{t("team_name")}</legend>
						<input type="text" className="input" placeholder={t("type_here")} />
					</fieldset>
					<button className="btn btn-primary btn-wide">{t("continue")}</button>
				</div>
			</div>
		</>
	)
}

export default App
