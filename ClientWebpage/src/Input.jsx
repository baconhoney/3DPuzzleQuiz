import React from 'react'

const Input = ({ id, type, className, min, max, defaultValue, onInput }) => {

    const defaultClass = "focus-visible:border-gray-400 border-gray-500 focus:border-gray-500 focus-visible:ring-0 focus:outline-none answer-input";
    const validateClass = "border-info focus:border-info focus-visible:ring-0 focus:outline-none answer-input";

    const [extraClass, setExtraClass] = React.useState(() => {
        return defaultValue ? validateClass : defaultClass;
    });

    function handleInputChange(e) {
        if (e.target.value) {
            setExtraClass(validateClass);
        } else {
            setExtraClass(defaultClass);
        }
    }

    return (
        <input
            id={id}
            type={type}
            className={className + ' ' + extraClass}
            min={min}
            max={max}
            defaultValue={defaultValue}
            onInput={onInput}
            onChange={handleInputChange}
        />
    )
}

export default Input