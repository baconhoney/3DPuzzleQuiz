import { useState, useMemo, useEffect, useRef } from "react";
import masterList from "./masterList";
import {
    tokenize,
    parseTokens,
    evaluateNode,
    highlight,
    sortItems,
    removeAccents,
} from "./utils";

import { Html5Qrcode } from "html5-qrcode";
import { Camera } from "lucide-react";

export default function SearchPage() {
    const [data, setData] = useState([]);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState("name_hu");
    const [sortAsc, setSortAsc] = useState(true);

    const [showScanner, setShowScanner] = useState(false);
    const isScannerActive = useRef(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        const isGitHubPages = location.hostname.includes("github.io");

        if (isGitHubPages) {
            setData(masterList.entries);
        } else {
            fetch("../api/admin/getAllBuildingsData")
                .then((res) => res.json())
                .then((json) => setData(json))
                .catch((err) => {
                    console.error("API fetch error, falling back to local data:", err);
                    setData(masterList.entries);
                });
        }
    }, []);

    const columns = [
        { key: "id", label: "ID", numeric: true },
        { key: "box", label: "Doboz", numeric: true },
        { key: "answer", label: "Válasz", numeric: true },
        { key: "name_hu", label: "Név" },
        { key: "location_hu", label: "Helyszín" },
        { key: "name_en", label: "Angol Név" },
        { key: "location_en", label: "Angol Helyszín" },
        { key: "type", label: "Típus" },
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
            setSortAsc((prev) => !prev);
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

        const filteredItems = Object.values(data).filter((item) =>
            evaluateNode(exprTree, item, labelToKeyMap, columns, regex)
        );

        return sortItems(filteredItems, sortKey, sortAsc, columns);
    }, [data, query, sortKey, sortAsc, columns]);

    // Safe stop function
    const stopScanner = async () => {
        if (!scannerRef.current) return;
        try {
            if (scannerRef.current.getState && scannerRef.current.getState() === "SCANNING") {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            }
        } catch (e) {
            console.warn("Scanner cleanup error:", e);
        } finally {
            scannerRef.current = null;
        }
    };

    useEffect(() => {
        if (showScanner) {
            isScannerActive.current = true;
            const html5QrCode = new Html5Qrcode("scanner-container");
            scannerRef.current = html5QrCode;

            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    if (!isScannerActive.current) return;
                    setQuery(decodedText);
                    setShowScanner(false);
                    stopScanner();
                },
                (err) => { }
            ).catch((err) => console.error("Camera start failed", err));

            return () => {
                isScannerActive.current = false;
                stopScanner();
            };
        }
    }, [showScanner]);

    return (
        <div className="w-full max-w-full bg-white p-2 rounded-2xl">
            <div className="sticky top-0 bg-white pt-4 pb-4 z-30 border-b border-gray-300">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="🔍 Keresés minden mezőben..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            className="w-full p-2 sm:p-3 pr-8 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base"
                        />
                        {query && (
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700 transition p-1"
                                aria-label="Clear search"
                                type="button"
                            >
                                <span className="text-lg font-bold">✕</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowScanner(true)}
                        className="btn btn-sm flex items-center gap-1 bg-blue-500 text-white px-2 py-3 rounded-lg shadow hover:bg-blue-600 transition"
                        type="button"
                    >
                        <Camera size={16} /> Scan
                    </button>
                </div>
            </div>

            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md relative">
                        <button
                            onClick={() => {
                                setShowScanner(false);
                                stopScanner();
                            }}
                            className="absolute top-2 right-2 text-red-500 font-bold"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg font-semibold mb-2">Scan DMC Code</h2>
                        <div
                            id="scanner-container"
                            style={{ width: "100%", height: "320px" }}
                        ></div>
                    </div>
                </div>
            )}

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
