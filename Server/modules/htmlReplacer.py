import logging
import re
import sys


_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


def tokenize(template_str):
    # Handle escaped braces first
    template_str = template_str.replace("{{{{", "__LITERAL_LEFT__").replace("}}}}", "__LITERAL_RIGHT__")

    # Match all template tags
    pattern = re.compile(r"(\{\{.*?\}\})", re.DOTALL)
    parts = pattern.split(template_str)

    tokens = []
    for part in parts:
        if not part:
            continue
        if part.startswith("{{") and part.endswith("}}"):
            inner = part[2:-2].strip()
            if inner.startswith("foreach "):
                tokens.append(("tag", ("foreach_start", inner[8:].strip())))
            elif inner == "endforeach":
                tokens.append(("tag", ("foreach_end", None)))
            elif inner.startswith("if "):
                tokens.append(("tag", ("if_start", inner[3:].strip())))
            elif inner == "else":
                tokens.append(("tag", ("else", None)))
            elif inner == "endif":
                tokens.append(("tag", ("if_end", None)))
            else:
                tokens.append(("var", inner))
        else:
            tokens.append(("text", part))

    # Restore escaped braces
    for i, (ttype, tval) in enumerate(tokens):
        if ttype == "text":
            tokens[i] = ("text", tval.replace("__LITERAL_LEFT__", "{{").replace("__LITERAL_RIGHT__", "}}"))

    return tokens


# AST format
# {
#     "type": "root" | "each" | "if",
#     "cond": str | None,
#     "iterable": str | None,
#     "true": list,     # for if
#     "false": list,    # for if
#     "body": list,     # for each/root
#     "in_else": bool   # for if
# }


def parse_template(template_str):
    stack = [{"type": "root", "body": []}]
    tokens = tokenize(template_str)

    for ttype, tval in tokens:
        current = stack[-1]

        if ttype in ("text", "var"):
            if current["type"] == "if" and current.get("in_else"):
                current["false"].append((ttype, tval))
            elif current["type"] == "if":
                current["true"].append((ttype, tval))
            else:
                current["body"].append((ttype, tval))

        elif ttype == "tag":
            tag, val = tval

            if tag == "foreach_start":
                stack.append({"type": "foreach", "iterable": val, "body": []})
            elif tag == "foreach_end":
                if stack[-1]["type"] != "foreach":
                    raise SyntaxError("Mismatched {{endforeach}} tag")
                block = stack.pop()
                newblock = ("foreach", block["iterable"], block["body"])
                curr = stack[-1]
                if curr["type"] == "if":
                    if curr.get("in_else"):
                        curr["false"].append(newblock)
                    else:
                        curr["true"].append(newblock)
                else:
                    curr["body"].append(newblock)

            elif tag == "if_start":
                stack.append({"type": "if", "cond": val, "true": [], "false": [], "in_else": False})
            elif tag == "else":
                if stack[-1]["type"] != "if":
                    raise SyntaxError("Misplaced {{else}} tag")
                stack[-1]["in_else"] = True
            elif tag == "if_end":
                if stack[-1]["type"] != "if":
                    raise SyntaxError("Mismatched {{endif}} tag")
                block = stack.pop()
                newblock = ("if", block["cond"], block["true"], block["false"])
                curr = stack[-1]
                if curr["type"] == "if":
                    if curr.get("in_else"):
                        curr["false"].append(newblock)
                    else:
                        curr["true"].append(newblock)
                else:
                    curr["body"].append(newblock)
            else:
                raise SyntaxError(f"Unknown tag: {tag}")

    if len(stack) != 1:
        raise SyntaxError("Unclosed block(s) in template")

    return stack[0]["body"]


def resolve_var(key: str, context: dict, parents: list):
    if key in context:
        return context[key]
    for parent in reversed(parents):
        if key in parent:
            return parent[key]
    raise KeyError(f"Variable '{key}' not found in context or parents")


def build_scope(context, parents):
    scope = {}
    for parent in parents + [context]:
        scope.update(parent)
    return scope


def render_ast(ast, context: dict, parents: list):
    output = []
    for node in ast:
        ntype = node[0]

        if ntype == "text":
            output.append(node[1])
        elif ntype == "var":
            output.append(str(resolve_var(node[1], context, parents)))
        elif ntype == "foreach":
            iterable = resolve_var(node[1], context, parents)
            if not isinstance(iterable, list):
                raise TypeError(f"Expected list for foreach '{node[1]}', got {type(iterable)}")
            for item in iterable:
                output.append(render_ast(node[2], item, parents + [context]).strip())
        elif ntype == "if":
            cond, true_body, false_body = node[1], node[2], node[3]
            scope = build_scope(context, parents)
            try:
                result = eval(cond, {}, scope)
            except Exception as e:
                raise ValueError(f"Error evaluating condition '{cond}': {e}")
            if result:
                output.append(render_ast(true_body, context, parents).strip())
            else:
                output.append(render_ast(false_body, context, parents).strip())
        else:
            raise ValueError(f"Unknown AST node type: {ntype}")

    return "".join(output)


def render_template(template_str: str, context: dict, parents: list = None) -> str:
    if parents is None:
        parents = []
    ast = parse_template(template_str)
    return render_ast(ast, context, parents)


# Example usage
if __name__ == "__main__":
    logging.basicConfig(
        level="DEBUG",
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    html_template = """
<html>
<body>
    <h1>{{title}}</h1>
    <p>{{{{this is escaped}}}}</p>
    {{if page_no == 1}}
        <p>This is the first page.</p>
    {{else}}
        <p>This is page {{page_no}}.</p>
    {{endif}}
    <ul>
        {{foreach items}}
            <li>
                {{name}} - {{unit}} {{value}}
                {{if value == "10"}}<b>Special!</b>{{endif}}
            </li>
        {{endforeach}}
    </ul>
</body>
</html>
    """
    data = {
        "title": "Fruit List",
        "page_no": 1,
        "unit": "kg",
        "items": [
            {"name": "Apple", "value": "10"},
            {"name": "Banana", "value": "20"},
            {"name": "Cherry", "value": "30"},
        ],
    }
    final_html = render_template(html_template, data)
    print(final_html)
    print("Template rendered with nested loops and conditionals.")
