import tkinter as tk
from tkinter import ttk

# Sample row click handler
def on_row_click(event):
    region = tree.identify("region", event.x, event.y)
    if region != "cell":
        # Clicked outside any row
        tree.selection_remove(tree.selection())
        print("selection cleared")
        return
    selected_item = tree.focus()  # Get selected item ID
    item_data = tree.item(selected_item)['values']
    print("Row clicked:", item_data)

# Sample data
data = [
    ("John Doe", 28, "Engineer"),
    ("Jane Smith", 34, "Designer"),
    ("Alice Brown", 22, "Developer"),
    ("Bob White", 45, "Manager"),
] * 5

# Setup root window
root = tk.Tk()
root.title("Scrollable Table with Click Events")

# Frame for layout
frame = ttk.Frame(root)
frame.pack(fill="both", expand=True)

# Treeview widget
columns = ("Name", "Age", "Occupation")
tree = ttk.Treeview(frame, columns=columns, show='headings', selectmode="browse")

# Define column headings
for col in columns:
    tree.heading(col, text=col)
    tree.column(col, width=100, stretch=False)

# Insert data
for row in data:
    tree.insert("", "end", values=row)

# Scrollbar
vsb = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
tree.configure(yscrollcommand=vsb.set)

# Pack widgets
tree.grid(row=0, column=0, sticky="ns")
vsb.grid(row=0, column=1, sticky="ns")

# Configure grid weights
frame.rowconfigure(0, weight=1)
frame.columnconfigure(0, weight=1)

# Bind click event
tree.bind("<ButtonRelease-1>", on_row_click)

# Start the app
root.mainloop()
