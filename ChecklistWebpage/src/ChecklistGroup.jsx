import { useState } from "react";

export default function ChecklistGroup({ group, state, toggle, level = 0 }) {
    const [open, setOpen] = useState(false);

    const flatItems = group.items.filter(item => typeof item === "string");
    const checkedCount = flatItems.filter(item => state[`${group.title}__${item}`]).length;
    const allChecked = checkedCount === flatItems.length && flatItems.length > 0;

    return (
        <div
            className={`border-2 rounded shadow-sm ${level > 0 ? "ml-4" : ""}
                ${allChecked ? "border-green-500" : "border-base-300"} bg-base-100`}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-3 py-2 bg-base-200 hover:bg-base-300 rounded-t text-sm font-medium"
            >
                <span>{group.title}</span>
                <span className="flex items-center gap-2">
                    <span className="text-sm font-normal text-base-content/70">{checkedCount}/{flatItems.length}</span>
                    <span className="text-xl">{open ? "−" : "+"}</span>
                </span>
            </button>

            {open && (
                <div className="p-2 space-y-1">
                    {group.items.map((item, idx) => {
                        if (typeof item === "string") {
                            const key = `${group.title}__${item}`;
                            const checked = !!state[key];
                            return (
                                <label
                                    key={key}
                                    htmlFor={key}
                                    className="flex justify-between items-center px-3 py-2 rounded text-sm cursor-pointer border bg-base-200 border-base-300 hover:bg-base-300"
                                >
                                    <span>{item}</span>
                                    <input
                                        id={key}
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(key)}
                                        className="checkbox checkbox-sm checkbox-primary"
                                    />
                                </label>
                            );
                        }

                        if (typeof item === "object" && item !== null) {
                            return (
                                <ChecklistGroup
                                    key={idx}
                                    group={item}
                                    state={state}
                                    toggle={toggle}
                                    level={level + 1}
                                />
                            );
                        }

                        return null;
                    })}
                </div>
            )}
        </div>
    );
}
