# Backend — Making the Agent Actually Drive the Browser

After the frontend fixes (commit `49912ac`), the system can:
- Open a browser via `cu_open_target` ✅
- Execute any tool the backend requests ✅
- Post the result back ✅

But you're seeing: **"It opens the browser but then stops — nothing happens."**

That's because the **backend agent loop is exiting after the first tool call**.
Real autonomous use needs an iterative **screenshot → think → act → repeat**
loop where the model gets the tool result back, decides the next action, and
keeps going until the goal is done.

This doc shows the three Python changes that make that loop work.

---

## The fundamental pattern

```
┌───────────────────────────────────────────────────────────────┐
│  while not done and iteration < max_iterations:                │
│      response = model.run(messages + accumulated_tool_results) │
│      for tool_use in response.tool_uses:                      │
│          result = await dispatch_tool_call(tool_use)          │
│          messages.append(tool_result(tool_use.id, result))    │
│      if response.stop_reason == "end_turn" and no tools:      │
│          done = True                                          │
└───────────────────────────────────────────────────────────────┘
```

The model **does not autonomously call multiple tools per turn**. It calls one
(or a few in parallel), waits for results, then decides what to do next. So
"autonomous" really means: the **server loops** the model with each result,
until the model itself decides to stop.

---

## Bug — Agent loop exits after first tool call

If your code looks like this (simplified):

```python
async def chat_stream(req: ChatRequest):
    messages = req.messages
    response = await anthropic.messages.create(messages=messages, tools=tools, ...)
    for block in response.content:
        if block.type == "tool_use":
            result = await dispatch_tool_call(block, ...)
            # ... emit result ...
    # ❌ DONE. No further iteration. Browser is open but no follow-up actions.
```

…that's a **single-shot** agent. It needs to be a loop:

```python
async def chat_stream(req: ChatRequest):
    messages: list[dict] = req.messages.copy()
    max_iterations = 30   # safety brake
    for iteration in range(max_iterations):
        response = await anthropic.messages.create(
            messages=messages,
            tools=tools,
            system=system_prompt_with_cu_instructions,  # see §3 below
            max_tokens=4096,
        )
        # Stream assistant text + tool calls back to the client.
        assistant_blocks: list[dict] = []
        tool_result_blocks: list[dict] = []
        for block in response.content:
            if block.type == "text":
                assistant_blocks.append({"type": "text", "text": block.text})
                yield sse({"type": "text-delta", "text": block.text})
            elif block.type == "tool_use":
                assistant_blocks.append({
                    "type": "tool_use",
                    "id": block.id, "name": block.name, "input": block.input,
                })
                # Dispatch (may be client-executed; awaits the future).
                tool_output = await dispatch_tool_call(block,
                    conversation_id=req.conversation_id,
                    sse_sink=lambda evt: yield sse(evt))
                # Build the tool_result block for the NEXT model turn.
                tool_result_blocks.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": (
                        json.dumps(tool_output) if not isinstance(tool_output, str)
                        else tool_output
                    ),
                    "is_error": isinstance(tool_output, dict) and "error" in tool_output,
                })
        # Append the assistant turn + the tool results to the running history.
        messages.append({"role": "assistant", "content": assistant_blocks})
        if tool_result_blocks:
            messages.append({"role": "user", "content": tool_result_blocks})
        # Termination: if the model didn't call any tools this turn,
        # OR explicitly said `stop_reason == "end_turn"`, the loop ends.
        if response.stop_reason == "end_turn" and not tool_result_blocks:
            yield sse({"type": "done"})
            return
    yield sse({"type": "done", "reason": "max_iterations_reached"})
```

Three things matter:

1. **Loop** until `stop_reason == "end_turn"` AND no tools called this turn.
2. After each tool call, append `tool_result` to messages so the next iteration
   sees the result.
3. Cap iterations (`max_iterations=30`) so a confused model can't burn money
   forever.

---

## The system prompt that makes the model act autonomously

The model needs explicit guidance to use the screenshot-act loop. Append this
to your existing system prompt when `client.capabilities` includes
`"computer"` or `"yang_cu"`:

```python
COMPUTER_USE_INSTRUCTIONS = """
You have access to background computer-use tools that let you drive
applications on the user's machine without disturbing their mouse:

  - cu_open_target({kind:"browser"|"native"|"virtual-desktop", url|app})
    → returns {id:"browser:N"|"native:N", title, url}
  - cu_screenshot(targetId) → returns {pngBase64, width, height}
  - cu_get_content(targetId) → returns DOM/a11y tree (often more useful than vision)
  - cu_click(targetId, x, y, button?)
  - cu_double_click(targetId, x, y)
  - cu_type(targetId, text)
  - cu_key(targetId, combo)  e.g. "Ctrl+S", "Enter", "Tab"
  - cu_scroll(targetId, x, y, dx, dy)
  - cu_close(targetId)
  - browser_navigate(targetId, url)
  - browser_fill(targetId, selector, value)  # for inputs/textareas
  - browser_wait_for(targetId, selector, timeoutMs?)
  - browser_download(targetId, url, filename?)  # saves to <workspace>/Downloads
  - browser_eval(targetId, script)  # JS in page context

THE LOOP YOU MUST FOLLOW for any autonomous task:

  1. CALL cu_open_target FIRST. Save the returned `id` — every subsequent call
     needs it as `targetId`.

  2. CALL cu_screenshot to see the current state. Look at the image.

  3. DECIDE the single next concrete action: click here, type this, scroll, etc.

  4. EXECUTE that action via cu_click / cu_type / cu_key etc.

  5. CALL cu_screenshot AGAIN to verify the action worked.

  6. REPEAT from step 3 until the goal is achieved or you hit an obstacle.

  7. ONLY when the task is complete (or definitively blocked), reply with a
     plain-text summary of what you did. Do NOT stop after one tool call.

CRITICAL RULES:
  - NEVER call cu_open_target a second time for the same goal. Re-use the
    existing targetId.
  - ALWAYS take a screenshot before AND after every action you're not 100%
    sure about. Visual verification beats assumptions.
  - For form inputs, prefer browser_fill(selector, value) over coordinate
    typing — it's much more reliable.
  - For navigation, prefer browser_navigate(targetId, url) over typing a URL
    into the address bar.
  - If a screenshot shows the same state two iterations in a row, your action
    didn't work — try a different selector or coordinate, don't just retry.
  - If you need text content from a page, call cu_get_content first; it
    returns the accessibility tree which is more reliable than reading
    coordinates from a screenshot.

EXAMPLE GOAL: "Research tactical real-assets investing"

  1. cu_open_target({kind:"browser", url:"https://www.google.com"})
     → {id:"browser:1", ...}
  2. cu_screenshot("browser:1")  → image of Google homepage
  3. browser_fill("browser:1", "textarea[name='q']", "tactical real assets investing strategy")
  4. cu_key("browser:1", "Enter")
  5. cu_screenshot("browser:1")  → image of results
  6. cu_click("browser:1", x, y)  on the most relevant result
  7. cu_screenshot("browser:1")  → image of the article
  8. cu_get_content("browser:1")  → returns the article text
  9. ...continue gathering, possibly taking notes via fs_write_file...
 10. Reply: "I gathered N sources on tactical real assets. Key takeaways: ..."

NEVER stop after step 1. Step 1 only OPENS the page — the work happens in
steps 2-10.
"""
```

Add it to your system prompt:

```python
async def build_system_prompt(req: ChatRequest) -> str:
    base = "...your existing system prompt..."
    caps = req.client.capabilities if req.client else []
    if "computer" in caps or "yang_cu" in caps:
        base += "\n\n" + COMPUTER_USE_INSTRUCTIONS
    return base
```

---

## Optional but recommended — let the model see screenshots as images

Anthropic's API accepts images directly. When emitting `tool_result` for
`cu_screenshot`, wrap the base64 PNG as an image block so the model can
actually *see* it instead of seeing a blob of base64 in text:

```python
def tool_result_for_screenshot(tc_id: str, result: dict) -> dict:
    return {
        "type": "tool_result",
        "tool_use_id": tc_id,
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": result["pngBase64"],
                },
            },
            {"type": "text", "text": f"Screenshot {result['width']}x{result['height']}px"},
        ],
        "is_error": False,
    }
```

Use this branch when `block.name == "cu_screenshot"` or
`block.name == "computer_screenshot"`. The model will then *see* what's on the
screen and ground its next action in pixels rather than guessing.

---

## Quick checklist to debug "it opens the browser then nothing happens"

1. **Is the agent loop iterating?** Add a log at the top of the loop:
   ```python
   print(f"[agent] iteration={iteration} stop_reason={response.stop_reason if iteration>0 else 'first'}")
   ```
   You should see `iteration=0, 1, 2, ...` in Railway logs. If you only ever see
   `iteration=0`, the loop is exiting after the first turn. Apply §1.

2. **Is the tool result being fed back to the model?**
   ```python
   print(f"[agent] appending {len(tool_result_blocks)} tool_results")
   ```
   Should print 1+ after every iteration that called a tool.

3. **Is the model receiving images?** If you're shipping `cu_screenshot` PNG
   as base64 text instead of an image block, the model is essentially blind.
   Apply §3.

4. **Is the system prompt instructing the loop?** Without the
   `COMPUTER_USE_INSTRUCTIONS` block, Claude will often stop after one tool
   call because it doesn't know it should iterate. Apply §2.

If after all 4, the model still stops at iteration 1 — copy-paste the Railway
log for one full chat run and check whether the model is responding with
`stop_reason: "end_turn"` and zero tool calls. If yes, the model itself
decided to stop — adjust the system prompt.

---

## What the user will see when it works

After the four pieces are in place, sending `/goal Open Google, research
tactical real assets investing, take 5 notes` should produce, in the desktop
app:

1. A Chromium window pops up on screen (Playwright headed, separate cursor).
2. The window navigates to google.com.
3. Search box gets typed into.
4. Search results appear.
5. The agent clicks a result.
6. The agent reads the page.
7. (Optionally) Notepad opens via `cu_open_target({kind:"native",app:"notepad.exe"})`.
8. Agent types notes via `cu_type(notepadId, "Note 1: ...")`.
9. Agent saves via `cu_key(notepadId, "Ctrl+S")` + a file-save dialog interaction.
10. The agent reports back: "Researched and saved 5 notes to ~/PotomacWorkspace/notes.txt".

All while your real cursor sits exactly where you left it.
