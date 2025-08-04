import { useState, useMemo, useEffect } from "react";
import { masterList } from "./masterList";
import { tokenize, parseTokens, evaluateNode, highlight, sortItems, removeAccents } from "./utils";

export default function SearchPage() {
    const [data, setData] = useState([]);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState("name_hu");
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        const isGitHubPages = location.hostname.includes("github.io");
        if (isGitHubPages) {
            setData(masterList);
        } else {
            fetch("http://192.168.0.101:1006/api/admin/getAllBuildingsData")
                .then(res => res.json())
                .then(json => setData(json))
                .catch(err => {
                    console.error("API fetch error, falling back to local data:", err);
                    setData(masterList);
                });
        }
    }, []);

    const columns = [
        { key: "id", label: "ID", numeric: true },
        { key: "box", label: "Doboz", numeric: true },
        { key: "answer", label: "Válasz", numeric: true },
        { key: "name_hu", label: "Név" },
        { key: "country_hu", label: "Ország" },
        { key: "city_hu", label: "Város" },
        { key: "name_en", label: "Angol Név" },
        { key: "country_en", label: "Angol Ország" },
        { key: "city_en", label: "Angol Város" },
    ];

    const labelToKeyMap = useMemo(() => {
        return columns.reduce((acc, col) => {
            const originalKey = col.label.toLowerCase();
            const noAccentKey = removeAccents(originalKey);
            acc[originalKey] = col.key;
            acc[noAccentKey] = col.key;
            return acc;
        }, {});
    }, [columns]);

    const handleSort = (key) => {
        if (key === sortKey) {
            setSortAsc(prev => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const regex = /^re:(.+)$/iu;

    function trimTrailingOperators(query) {
        return query.replace(/[\s&|]+$/g, "").trim();
    }

    const filtered = useMemo(() => {
        let q = query.trim();
        q = trimTrailingOperators(q);
        if (!q) return sortItems(Object.values(data), sortKey, sortAsc, columns);

        let exprTree;
        try {
            const tokens = tokenize(q);
            exprTree = parseTokens(tokens);
        } catch (e) {
            console.error("Query parse error:", e);
            return sortItems(Object.values(data), sortKey, sortAsc, columns);
        }

        const filteredItems = Object.values(data).filter(item =>
            evaluateNode(exprTree, item, labelToKeyMap, columns, regex)
        );

        return sortItems(filteredItems, sortKey, sortAsc, columns);
    }, [data, query, sortKey, sortAsc, columns]);

    return (
        <div className="w-full max-w-full bg-white p-2 rounded-2xl">
            <div className="sticky top-0 bg-white pt-4 pb-4 z-30 border-b border-gray-300">
                <input
                    type="text"
                    placeholder="🔍 Keresés minden mezőben..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base"
                />
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[80vh] rounded-lg shadow-sm mt-4">
                <table className="min-w-full text-sm sm:text-base text-left table-auto border-collapse">
                    <thead className="bg-blue-100 text-gray-700 select-none sticky top-0 z-20 border-b border-gray-300">
                        <tr>
                            {columns.map((col, idx) => {
                                const isNumeric = col.numeric;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{ height: 48 }}
                                        className={`px-3 py-2 sm:px-4 sm:py-3 cursor-pointer whitespace-nowrap hover:bg-blue-200 transition-colors ${isNumeric ? "text-center" : "text-left"} ${idx !== columns.length - 1 ? "border-r border-gray-300" : ""}`}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                <span className="ml-1 text-xs select-none">{sortAsc ? "▲" : "▼"}</span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map(item => (
                                <tr key={item.id} className="even:bg-gray-50 hover:bg-blue-50 transition-shadow" style={{ height: 48 }}>
                                    {columns.map((col, idx) => {
                                        const isNumeric = col.numeric;
                                        const value = item[col.key];
                                        return (
                                            <td
                                                key={col.key}
                                                style={{ height: 48 }}
                                                className={`px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-800 ${isNumeric ? "text-center" : "text-left"} ${idx !== columns.length - 1 ? "border-r border-gray-200" : ""}`}
                                            >
                                                {typeof value === "string" || typeof value === "number"
                                                    ? highlight(String(value), query, col.label)
                                                    : ""}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="p-6 text-center text-gray-500 italic">
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
