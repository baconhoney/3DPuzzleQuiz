import React from "react";

export function tokenize(query) {
    const tokens = [];
    let buffer = "";
    for (let i = 0; i < query.length; i++) {
        const c = query[i];
        if (c === "(" || c === ")" || c === "&" || c === "|") {
            if (buffer.trim()) {
                tokens.push(buffer.trim());
                buffer = "";
            }
            tokens.push(c);
        } else {
            buffer += c;
        }
    }
    if (buffer.trim()) tokens.push(buffer.trim());
    return tokens;
}

export function parseTokens(tokens) {
    let pos = 0;

    function parseExpression(precedence = 0) {
        let left = null;

        if (tokens[pos] === "(") {
            pos++;
            left = parseExpression();
            if (tokens[pos] !== ")") throw new Error("Expected )");
            pos++;
        } else if (pos < tokens.length && !["&", "|", ")", "("].includes(tokens[pos])) {
            left = tokens[pos++];
        } else {
            throw new Error("Expected expression but got " + (tokens[pos] ?? "end of input"));
        }

        while (pos < tokens.length) {
            const op = tokens[pos];
            const opPrecedence = (op === "&") ? 2 : (op === "|") ? 1 : 0;
            if (opPrecedence === 0 || opPrecedence <= precedence) break;

            pos++;

            if (pos >= tokens.length) {
                throw new Error(`Expected expression after operator '${op}' but got end of input`);
            }

            const right = parseExpression(opPrecedence);
            left = { op, left, right };
        }

        return left;
    }

    const expr = parseExpression();
    if (pos !== tokens.length) throw new Error("Unexpected tokens at end");
    return expr;
}

export function evaluateNode(node, item, labelToKeyMap, columns, regex) {
    if (typeof node === "string") {
        let cond = node;
        let key = null;
        let search = cond;

        if (cond.includes(":") && !cond.startsWith("re:")) {
            const split = cond.split(":");
            const label = split[0].trim().toLowerCase();
            search = split.slice(1).join(":").trim();

            if (!search) {
                return false;
            }

            key = labelToKeyMap[label] || null;
            if (!key || !columns.find(c => c.key === key)) return false;
        }

        const regexMatch = search.match(regex);
        if (regexMatch) {
            try {
                const pattern = new RegExp(regexMatch[1], "i");
                if (key) return pattern.test(item[key]);
                return columns.some(col => pattern.test(String(item[col.key])));
            } catch {
                return false;
            }
        }

        const check = (val) => {
            if (!search) return false;
            return String(val).toLowerCase().includes(search.toLowerCase());
        };

        if (key) {
            const col = columns.find(c => c.key === key);
            if (col?.numeric) {
                return Number(item[key]) === Number(search);
            } else {
                return check(item[key]);
            }
        } else {
            return columns.some(col => check(item[col.key]));
        }
    }

    if (node.op === "&") {
        return evaluateNode(node.left, item, labelToKeyMap, columns, regex) &&
            evaluateNode(node.right, item, labelToKeyMap, columns, regex);
    }

    if (node.op === "|") {
        return evaluateNode(node.left, item, labelToKeyMap, columns, regex) ||
            evaluateNode(node.right, item, labelToKeyMap, columns, regex);
    }

    return false;
}

export function sortItems(items, sortKey, sortAsc, columns) {
    if (!sortKey) return items;

    const isNumeric = columns.find((col) => col.key === sortKey)?.numeric;

    return [...items].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (isNumeric) {
            const aNum = Number(aVal) || 0;
            const bNum = Number(bVal) || 0;
            return sortAsc ? aNum - bNum : bNum - aNum;
        } else {
            const aStr = String(aVal || "").toLowerCase();
            const bStr = String(bVal || "").toLowerCase();
            return sortAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }
    });
}

export function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isSafeRegex(pattern) {
    // Egyszerű példa, ne legyen üres és ne kezdődjön kvantorral
    if (!pattern || pattern.trim() === "") return false;
    if (/^[*+?]/.test(pattern.trim())) return false;
    return true;
}

export function highlight(text, query, colLabel) {
    if (!query || typeof text !== "string") return text;

    // Remove parentheses
    const flatQuery = query.replace(/[()]/g, "");

    // Tokenize by & and | (not escaped)
    const parts = flatQuery
        .split(/(?<!\\)[&|]/)
        .map(s => s.trim())
        .filter(Boolean);

    const terms = [];

    parts.forEach(term => {
        const regexColMatch = term.match(/^([^:]+):re:(.+)$/i);
        const regexMatch = term.match(/^re:(.+)$/i);
        const colSplit = term.split(":");

        if (regexColMatch) {
            const label = regexColMatch[1].toLowerCase();
            if (label === colLabel.toLowerCase() || !term.includes(":")) {
                try {
                    const pattern = new RegExp(regexColMatch[2], "gi");
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        if (match[0] === "") {
                            pattern.lastIndex++;
                            continue;
                        }
                        terms.push(match[0]);
                    }
                } catch { }
            }
        } else if (regexMatch) {
            try {
                const pattern = new RegExp(regexMatch[1], "gi"); // regex from user
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    if (match[0] === "") {
                        pattern.lastIndex++;
                        continue;
                    }
                    terms.push(match[0]);
                }
            } catch {
                // Invalid regex, skip
            }
        } else {
            if (colSplit.length > 1) {
                const label = colSplit[0].toLowerCase();
                if (label === colLabel.toLowerCase()) {
                    const val = colSplit.slice(1).join(":");
                    if (val) terms.push(val);
                }
            } else {
                // Oszlop nélküli általános keresés
                terms.push(term);
            }
        }
    });

    if (terms.length === 0) return text;

    const textLower = text.toLowerCase();
    const textNoAccents = removeAccents(textLower);
    const termsNoAccents = terms.map(t => removeAccents(t.toLowerCase()));

    let lastIndex = 0;
    const partsToRender = [];

    while (lastIndex < text.length) {
        let earliestMatchIndex = -1;
        let earliestMatchLength = 0;

        for (const term of termsNoAccents) {
            const index = textNoAccents.indexOf(term, lastIndex);
            if (index !== -1 && (earliestMatchIndex === -1 || index < earliestMatchIndex)) {
                earliestMatchIndex = index;
                earliestMatchLength = term.length;
            }
        }

        if (earliestMatchIndex === -1) {
            partsToRender.push(text.slice(lastIndex));
            break;
        }

        if (earliestMatchIndex > lastIndex) {
            partsToRender.push(text.slice(lastIndex, earliestMatchIndex));
        }

        const matchText = text.slice(earliestMatchIndex, earliestMatchIndex + earliestMatchLength);
        partsToRender.push(
            <mark key={earliestMatchIndex} className="bg-yellow-200">
                {matchText}
            </mark>
        );

        lastIndex = earliestMatchIndex + earliestMatchLength;
    }

    return <>{partsToRender.length ? partsToRender : text}</>;
}
