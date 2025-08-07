import { useState } from "react";

export default function ChecklistGroup({ group, state, toggle }) {
    const [open, setOpen] = useState(false);

    const checkedCount = group.items.filter(
        (item) => state[`${group.title}__${item}`]
    ).length;
    const total = group.items.length;
    const progress = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

    let progressColor = "progress-error";
    if (progress > 60) progressColor = "progress-success";
    else if (progress > 30) progressColor = "progress-warning";

    return (
        <div className="border border-base-300 rounded-lg bg-base-100 shadow p-2">
            <div
                onClick={() => setOpen(!open)}
                className="cursor-pointer px-4 py-2 font-semibold bg-base-200 rounded hover:bg-base-300 flex justify-between items-center select-none text-sm"
            >
                <span>
                    {group.title} — <strong>✅ {checkedCount}/{total}</strong>
                </span>
                <span className="text-2xl font-bold">{open ? "−" : "+"}</span>
            </div>

            <progress
                className={`progress progress-xs w-full my-1 rounded ${progressColor}`}
                value={progress}
                max="100"
            ></progress>

            {open && (
                <div className="p-2 space-y-2">
                    {group.items.map((item) => {
                        const key = `${group.title}__${item}`;
                        const checked = !!state[key];
                        return (
                            <label
                                key={key}
                                htmlFor={key}
                                className={`flex items-center justify-between px-4 py-2 rounded cursor-pointer text-sm ${checked
                                    ? "bg-success bg-opacity-30 border border-success"
                                    : "bg-base-200 border border-base-300 hover:bg-base-300"
                                    }`}
                            >
                                <span className="select-none">{item}</span>
                                <input
                                    id={key}
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(key)}
                                    className="checkbox checkbox-sm checkbox-primary"
                                />
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
