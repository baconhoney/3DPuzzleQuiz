import { createContext, useState, useContext, useEffect } from 'react'
import { useTranslation } from "react-i18next";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationHU from "./locales/hu/translation.json";
import translationEN from "./locales/en/translation.json";
import Register from './Register';
import Quiz from './Quiz';

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

// Create a context for language management
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
}

function App() {
	const { i18n, t } = useTranslation();
	const [language, setLanguage] = useState('hu');

	// Load team name from localStorage
	const [teamName, setTeamName] = useState(() => localStorage.getItem("teamName") || "");
	const [isSet, setIsSet] = useState(() => !!localStorage.getItem("teamName"));

	// Persist team name changes
	useEffect(() => {
		if (teamName) {
			localStorage.setItem("teamName", teamName);
		}
	}, [teamName]);

	// Change language
	const changeLng = (lng) => {
		i18n.changeLanguage(lng);
		setLanguage(lng);
	}

	// Called when the team has registered and the quiz should be shown
	function toQuiz() {
		setIsSet(true);
	}

	const contextValue = {
		language,
		changeLng,
		toQuiz,
		teamName,
		setTeamName,
		t,
		i18n
	};

	return (
		<LanguageContext.Provider value={contextValue}>
			{isSet ? <Quiz /> : <Register />}
		</LanguageContext.Provider>
	)
}

export default App;
