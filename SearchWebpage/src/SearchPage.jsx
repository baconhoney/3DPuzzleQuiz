import { useState, useEffect, useMemo } from "react";
import { masterList } from "./masterList";

export default function SearchPage() {
    const [data, setData] = useState(masterList);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState("name_hu");
    const [sortAsc, setSortAsc] = useState(true);

    const columns = [
        { key: "name_hu", label: "Név", width: "180px" },
        { key: "country_hu", label: "Ország", width: "140px" },
        { key: "city_hu", label: "Város", width: "140px" },
        { key: "name_en", label: "Angol Név", width: "180px" },
        { key: "country_en", label: "Angol Ország", width: "140px" },
        { key: "city_en", label: "Angol Város", width: "140px" },
        { key: "id", label: "ID", width: "60px", numeric: true },
        { key: "box", label: "Doboz", width: "80px", numeric: true },
        { key: "answer", label: "Szám", width: "90px", numeric: true },
    ];

    const labelToKeyMap = columns.reduce((acc, col) => {
        acc[col.label.toLowerCase()] = col.key;
        return acc;
    }, {});

    const handleSort = (key) => {
        if (key === sortKey) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    function tokenize(query) {
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

    function parseTokens(tokens) {
        let pos = 0;

        function parseExpression(precedence = 0) {
            let left = null;

            if (tokens[pos] === "(") {
                pos++;
                left = parseExpression();
                if (tokens[pos] !== ")") throw new Error("Expected )");
                pos++;
            } else {
                left = tokens[pos++];
            }

            while (pos < tokens.length) {
                const op = tokens[pos];
                const opPrecedence = (op === "&") ? 2 : (op === "|") ? 1 : 0;
                if (opPrecedence === 0 || opPrecedence <= precedence) break;

                pos++;
                const right = parseExpression(opPrecedence);
                left = { op, left, right };
            }

            return left;
        }

        const expr = parseExpression();
        if (pos !== tokens.length) throw new Error("Unexpected tokens at end");
        return expr;
    }

    function evaluateNode(node, item, labelToKeyMap, columns, regex) {
        if (typeof node === "string") {

            let cond = node;
            let key = null;
            let search = cond;

            if (cond.includes(":") && !cond.startsWith("re:")) {
                const split = cond.split(":");
                const label = split[0].trim().toLowerCase();
                search = split.slice(1).join(":").trim();

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

            const check = (val) => String(val).toLowerCase().includes(search.toLowerCase());

            if (key) {
                return check(item[key]);
            } else {
                return columns.some(col => check(item[col.key]));
            }
        }
        if (node.op === "&") {
            return evaluateNode(node.left, item, labelToKeyMap, columns, regex) && evaluateNode(node.right, item, labelToKeyMap, columns, regex);
        }
        if (node.op === "|") {
            return evaluateNode(node.left, item, labelToKeyMap, columns, regex) || evaluateNode(node.right, item, labelToKeyMap, columns, regex);
        }

        return false;
    }

    const regex = /^re:(.+)$/i;

    const filtered = useMemo(() => {
        const values = Object.values(data);
        const q = query.trim();

        if (!q) return sortItems(values);

        let exprTree;
        try {
            const tokens = tokenize(q);
            exprTree = parseTokens(tokens);
        } catch (e) {
            console.error("Query parse error:", e);
            return sortItems(values);
        }

        const filteredItems = values.filter(item => evaluateNode(exprTree, item, labelToKeyMap, columns, regex));

        return sortItems(filteredItems);
    }, [data, query, sortKey, sortAsc, columns]);

    function sortItems(items) {
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

    function highlight(text, query) {
        if (!query || typeof text !== "string") return text;
        const flatQuery = query.replace(/[()]/g, "");

        const parts = flatQuery
            .split(/(?<!\\)[&|]/)
            .map(s => s.trim())
            .filter(Boolean);
        const terms = [];

        parts.forEach(term => {
            const regexColMatch = term.match(/^([^:]+):re:(.+)$/i);
            const regexMatch = term.match(/^re:(.+)$/i);

            if (regexColMatch) {
                try {
                    const pattern = new RegExp(regexColMatch[2], "gi");
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        terms.push(match[0]);
                        if (match.index === pattern.lastIndex) pattern.lastIndex++;
                    }
                } catch {
                }
            } else if (regexMatch) {
                try {
                    const pattern = new RegExp(regexMatch[1], "gi");
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        terms.push(match[0]);
                        if (match.index === pattern.lastIndex) pattern.lastIndex++;
                    }
                } catch {
                }
            } else {
                const colSplit = term.split(":");
                const val = colSplit.length > 1 ? colSplit.slice(1).join(":") : term;
                terms.push(val);
            }
        });
        if (terms.length === 0) return text;
        const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        const combinedRegex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
        const partsToRender = [];
        let lastIndex = 0;

        text.replace(combinedRegex, (match, p1, offset) => {
            if (offset > lastIndex) {
                partsToRender.push(text.slice(lastIndex, offset));
            }
            partsToRender.push(<mark key={offset} className="bg-yellow-200">{match}</mark>);
            lastIndex = offset + match.length;
        });

        if (lastIndex < text.length) {
            partsToRender.push(text.slice(lastIndex));
        }

        return <>{partsToRender.length ? partsToRender : text}</>;
    }

    return (
        <div className="w-full max-w-full bg-white p-2 sm:p-8 rounded-2xl shadow-xl">
            <div className="sticky top-0 bg-white pt-4 pb-4 z-30 border-b border-gray-300">
                <input
                    type="text"
                    placeholder="🔍 Keresés minden mezőben..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base"
                />
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[80vh] rounded-lg shadow-sm mt-4">
                <table className="min-w-full text-sm sm:text-base text-left table-auto border-collapse">
                    <thead
                        className="bg-blue-100 text-gray-700 select-none sticky top-0 z-20 border-b border-gray-300"
                        style={{ backgroundClip: 'padding-box' }}
                    >
                        <tr>
                            {columns.map((col, idx) => {
                                const isNumeric = col.numeric;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{ height: 48 }}
                                        className={`px-3 py-2 sm:px-4 sm:py-3 cursor-pointer whitespace-nowrap hover:bg-blue-200 transition-colors ${isNumeric ? "text-center" : "text-left"
                                            } ${idx !== columns.length - 1 ? "border-r border-gray-300" : ""}`}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                <span className="ml-1 text-xs select-none">
                                                    {sortAsc ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((item) => (
                                <tr
                                    key={item.id}
                                    className="even:bg-gray-50 hover:bg-blue-50 transition-shadow"
                                    style={{ height: 48 }}
                                >
                                    {columns.map((col, idx) => {
                                        const isNumeric = col.numeric;
                                        return (
                                            <td
                                                key={col.key}
                                                style={{ height: 48 }}
                                                className={`px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-800 ${isNumeric ? "text-center" : "text-left"
                                                    } ${idx !== columns.length - 1 ? "border-r border-gray-200" : ""}`}
                                            >
                                                {(() => {
                                                    const value = item[col.key];
                                                    if (typeof value === "string" || typeof value === "number") {
                                                        return highlight(String(value), query);
                                                    } else {
                                                        return "";
                                                    }
                                                })()}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="p-6 text-center text-gray-500 italic"
                                >
                                    Nincs találat a keresésre.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}