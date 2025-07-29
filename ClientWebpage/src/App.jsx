import { createContext, useState, useContext, useEffect } from 'react'
import { useTranslation } from "react-i18next";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationHU from "./locales/hu/translation.json";
import translationEN from "./locales/en/translation.json";
import Register from './Register';
import Manager from './Manager';

const resources = {
	hu: {
		translation: translationHU,
	},
	en: {
		translation: translationEN,
	},
}

const savedLang = localStorage.getItem("language") || "hu";

i18n.use(initReactI18next).init({
	resources,
	lng: savedLang,
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
})

// Create a context for language management
const Context = createContext();

// Custom hook to use the language context
export const useGlobalContext = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error('useGlobalContext must be used within a Context.Provider');
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
		localStorage.setItem("language", lng);
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
		<Context.Provider value={contextValue}>
			{isSet ? <Manager /> : <Register />}
		</Context.Provider>
	)
}

export default App;
