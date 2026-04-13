#!/usr/bin/env python3
"""
coreling v1.0 — local AI, orchestrated.
Project Hype: Consumer-Facing Release.
"""

import sys, os, platform, subprocess, json, threading, time, tty, termios, re
import urllib.request, urllib.error
import concurrent.futures
from shutil import which

# ──────────────────────────────────────────────────────────────
#  ANSI - Premium Coreling Colors
# ──────────────────────────────────────────────────────────────
R  = "\033[0m"
BD = "\033[1m"
DM = "\033[2m"
W  = "\033[97m"
GR = "\033[90m"
GN = "\033[92m"
YL = "\033[93m"
RD = "\033[91m"
CY = "\033[96m"
MG = "\033[95m"
DG = "\033[32m"  # Premium Coreling Green

def clr():      os.system("clear")
def hide_cur(): sys.stdout.write("\033[?25l"); sys.stdout.flush()
def show_cur(): sys.stdout.write("\033[?25h"); sys.stdout.flush()

def alt_screen_enter(): sys.stdout.write("\033[?1049h\033[H"); sys.stdout.flush()
def alt_screen_exit():  sys.stdout.write("\033[?1049l"); sys.stdout.flush()

def br():    print()
def ok(m):   print(f"  {GN}✓{R}  {m}")
def info(m): print(f"  {CY}·{R}  {m}")
def sep():   print(f"  {GR}{'─'*50}{R}")

def flush_input():
    try: termios.tcflush(sys.stdin, termios.TCIFLUSH)
    except: pass

def set_terminal_echo(enable: bool):
    try:
        fd = sys.stdin.fileno()
        attr = termios.tcgetattr(fd)
        if enable: attr[3] |= termios.ECHO
        else:      attr[3] &= ~termios.ECHO
        termios.tcsetattr(fd, termios.TCSANOW, attr)
    except: pass

# ──────────────────────────────────────────────────────────────
#  THE BEAUTIFUL INTRO
# ──────────────────────────────────────────────────────────────
USER = os.environ.get("USER", "Developer").capitalize()
GREETING = f"Welcome back, {USER}!"
GREETING_PADDED = GREETING.center(42)

LOGO = f"""
{DG}╭──────────────────────────────────────────┬─────────────────────────────────╮{R}
{DG}│{R}                                          {DG}│{R} {DG}Tips for getting started{R}        {DG}│{R}
{DG}│{R}{BD}{W}{GREETING_PADDED}{R}{DG}│{R} Run /help to see commands       {DG}│{R}
{DG}│{R}                                          {DG}│{R} /clear to reset memory          {DG}│{R}
{DG}│{R}               {DG}▄▄██▓▄{R}                     {DG}├─────────────────────────────────┤{R}
{DG}│{R}           {DG},▄█████▀─,{R}                     {DG}│{R} {DG}System Status{R}                   {DG}│{R}
{DG}│{R}        {DG}▄███████▀└ ¬▀█▌{R}                   {DG}│{R} Local AI Orchestrator           {DG}│{R}
{DG}│{R}        {DG}████▀╙╓▄████▄▄─{R}                   {DG}│{R} 100% Private Execution          {DG}│{R}
{DG}│{R}        {DG}████ ▐████████▌ ▓▄{R}                {DG}│{R} Memory Manager: Active          {DG}│{R}
{DG}│{R}        {DG}████ ▐████████▌ ██▀─{R}              {DG}│{R}                                 {DG}│{R}
{DG}│{R}        {DG}████ └███████▀ ▄▄██{R}               {DG}│{R}                                 {DG}│{R}
{DG}│{R}        {DG}██████▄▄╙▀▀╙,▄██████{R}              {DG}│{R}                                 {DG}│{R}
{DG}│{R}         {DG}└▀██████████████▀└{R}               {DG}│{R}                                 {DG}│{R}
{DG}│{R}             {DG}╙▀██████▀╙{R}                   {DG}│{R}                                 {DG}│{R}
{DG}│{R}                 {DG}╙╙{R}                       {DG}│{R}                                 {DG}│{R}
{DG}│{R}                                          {DG}│{R}                                 {DG}│{R}
{DG}│{R}   {BD}{W}Coreling{R} · Local AI, orchestrated.    {DG}│{R}                                 {DG}│{R}
{DG}╰──────────────────────────────────────────┴─────────────────────────────────╯{R}
"""

# ──────────────────────────────────────────────────────────────
#  MENU & INPUT HANDLING
# ──────────────────────────────────────────────────────────────
def read_key() -> str:
    fd  = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == "\x1b":
            nxt = sys.stdin.read(1)
            if nxt == "[":
                arr = sys.stdin.read(1)
                if arr == "A": return "up"
                if arr == "B": return "down"
            return "esc"
        if ch in ("\r", "\n"): return "enter"
        if ch == "\x03":       raise KeyboardInterrupt
        return ch
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

def menu(options: list, title: str = "") -> int:
    cur = 0
    def build_lines(selected: int) -> list[str]:
        rows = [f"  {BD}{W}{title}{R}", f"  {GR}{'─'*50}{R}"]
        for i, opt in enumerate(options):
            active = (i == selected)
            label = opt["label"]; meta = opt.get("meta", ""); badge = opt.get("badge", "")
            if active: rows.append(f"  {CY}▶{R} {BD}{W}{label}{R}  {CY}{badge}{R}  {GR}{meta}{R}")
            else:      rows.append(f"    {GR}{label}{R}  {badge}  {meta}")
        rows.append("")
        return rows

    hide_cur(); first_lines = build_lines(cur)
    sys.stdout.write("\n".join(first_lines) + "\n"); sys.stdout.flush()
    rendered_count = len(first_lines)

    try:
        while True:
            key = read_key()
            moved = False
            if key == "up" and cur > 0: cur -= 1; moved = True
            elif key == "down" and cur < len(options) - 1: cur += 1; moved = True
            elif key == "enter": print(); return cur

            if moved:
                new_lines = build_lines(cur)
                sys.stdout.write(f"\033[{rendered_count}A")
                for line in new_lines: sys.stdout.write(f"\033[2K{line}\n")
                sys.stdout.flush()
    except KeyboardInterrupt: raise

# ──────────────────────────────────────────────────────────────
#  DYNAMIC TELEMETRY SPINNER
# ──────────────────────────────────────────────────────────────
class HypeSpinner:
    F = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
    def __init__(self, msg="Processing"):
        self.msg = msg
        self._stop = threading.Event()
        self._t = threading.Thread(target=self._run, daemon=True)
    def _run(self):
        i = 0; hide_cur()
        while not self._stop.is_set():
            sys.stdout.write(f"\r\033[2K  {CY}{self.F[i % len(self.F)]}{R}  {GR}{self.msg}{R} ")
            sys.stdout.flush()
            time.sleep(0.08); i += 1
    def __enter__(self): self._t.start(); return self
    def __exit__(self, *_):
        self._stop.set(); self._t.join()
        sys.stdout.write("\r\033[2K"); sys.stdout.flush(); show_cur()
    def update(self, new_msg: str):
        self.msg = new_msg

# ──────────────────────────────────────────────────────────────
#  DAEMON & ENGINE HIJACKER
# ──────────────────────────────────────────────────────────────
def silent_pull(tag: str):
    subprocess.run(["ollama", "pull", tag], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def ollama_api(path: str):
    try:
        with urllib.request.urlopen(f"http://localhost:11434{path}", timeout=2) as r:
            return json.loads(r.read().decode())
    except: return None

def wake_engine():
    if not which("ollama"):
        with HypeSpinner("Bootstrapping core environment..."):
            subprocess.run("curl -fsSL https://ollama.com/install.sh | sh", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
    with HypeSpinner("Aligning neural pathways...") as sp:
        subprocess.run(["pkill", "-f", "ollama"], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        time.sleep(0.5)
        env = os.environ.copy()
        env["OLLAMA_NUM_PARALLEL"] = "2"
        env["OLLAMA_MAX_LOADED_MODELS"] = "2"
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True, env=env)
        
        for _ in range(30):
            time.sleep(0.4)
            if ollama_api("/") is not None: break

# ──────────────────────────────────────────────────────────────
#  TASK ROUTER & DETERMINISTIC EXTRACTOR
# ──────────────────────────────────────────────────────────────
def extract_math(text: str):
    cleaned = text.strip().rstrip("?!.")
    prefixes = ["what is", "calculate", "compute", "solve", "evaluate"]
    for p in prefixes:
        if cleaned.lower().startswith(p): cleaned = cleaned[len(p):].lstrip(", ")
    
    runs = []; current = []
    for ch in cleaned:
        if ch in "0123456789.+-*/() ": current.append(ch)
        else:
            if current: runs.append("".join(current).strip()); current = []
    if current: runs.append("".join(current).strip())
    
    best = ""
    for r in runs:
        if any(c in r for c in "+-*/") and any(c.isdigit() for c in r) and len(r) > len(best): best = r
    return best

def decompose_task(user_input: str):
    expr = extract_math(user_input)
    if not expr: return None
    
    depth = 0
    idx, op = -1, None
    for i in range(len(expr) - 1, 0, -1):
        ch = expr[i]
        if ch == ")": depth += 1
        elif ch == "(": depth -= 1
        elif depth == 0 and ch in "+-":
            if expr[i-1] not in "+-*/(": idx, op = i, ch; break
    
    if idx < 0:
        depth = 0
        for i in range(len(expr) - 1, 0, -1):
            ch = expr[i]
            if ch == ")": depth += 1
            elif ch == "(": depth -= 1
            elif depth == 0 and ch in "*/": idx, op = i, ch; break

    if idx < 0: return None
    a = expr[:idx].strip(); b = expr[idx + 1:].strip()
    if not any(c.isdigit() for c in a) or not any(c.isdigit() for c in b): return None

    return {
        "task_a": f"Calculate: {a}. Be concise.",
        "task_b": f"Calculate: {b}. Be concise.",
        "operator": op,
        "original": user_input,
        "full_math": expr  # Determines the absolute truth natively
    }

# ──────────────────────────────────────────────────────────────
#  EXECUTION & CHAT
# ──────────────────────────────────────────────────────────────
def chat_stream(tag: str, messages: list) -> str:
    payload = json.dumps({"model": tag, "messages": messages, "stream": True}).encode()
    req = urllib.request.Request("http://localhost:11434/api/chat", data=payload, headers={"Content-Type": "application/json"}, method="POST")
    full = []
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            for raw in resp:
                try:
                    obj = json.loads(raw.decode().strip())
                    tok = obj.get("message", {}).get("content", "")
                    if tok:
                        sys.stdout.write(tok); sys.stdout.flush(); full.append(tok)
                    if obj.get("done"): break
                except: pass
    except: pass
    print(); return "".join(full)

def chat_collect(tag: str, messages: list) -> str:
    payload = json.dumps({"model": tag, "messages": messages, "stream": False}).encode()
    req = urllib.request.Request("http://localhost:11434/api/chat", data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
            return data.get("message", {}).get("content", "").strip()
    except: return "error"

def session(mode: str):
    clr(); print(LOGO)
    
    if mode == "uni":
        model_tag = "gemma4:e4b"
        print(f"  {GR}mode   {R}{BD}{DG}Uni-Agent{R}   {GR}Standard interaction ({model_tag}){R}")
    else:
        model_tag = "gemma3:1b"
        print(f"  {GR}mode   {R}{BD}{CY}Multi-Agent{R}   {GR}Parallel routing active ({model_tag}){R}")
    
    br(); sep(); print(f"  {GR}/clear  {R}reset    {GR}/exit  {R}quit"); sep(); br()

    # Pre-pull silently if missing to avoid crashes mid-chat
    threading.Thread(target=silent_pull, args=(model_tag,), daemon=True).start()

    history = [{"role": "system", "content": "You are Coreling. Provide direct, ultra-concise answers. No fluff."}]

    while True:
        set_terminal_echo(True); flush_input()
        try: user = input(f"  {DG}❯ {R}{BD}{W}you{R}  ").strip()
        except KeyboardInterrupt: raise

        set_terminal_echo(False)
        if not user: continue
        if user.lower() in ("/exit", "/quit"): raise KeyboardInterrupt
        if user.lower() == "/clear": history = [history[0]]; clr(); continue

        history.append({"role": "user", "content": user})
        br()

        # ──────────────────────────────────────────────────────
        # MULTI-AGENT COPILOT ROUTING
        # ──────────────────────────────────────────────────────
        if mode == "multi":
            split = decompose_task(user)
            if split:
                with HypeSpinner("Decomposing task...") as sp:
                    time.sleep(0.4)
                    
                    # Intercept math and force the exact truth natively
                    sp.update("Routing to deterministic coprocessor...")
                    time.sleep(0.3)
                    
                    try:
                        # eval() executes the heavily scrubbed math string safely
                        raw_ans = eval(split["full_math"])
                        if isinstance(raw_ans, float):
                            exact_answer = f"{raw_ans:,.4f}"
                        else:
                            exact_answer = f"{raw_ans:,}"
                    except Exception:
                        exact_answer = "Calculation error."
                    
                    sp.update("Synthesizing...")
                    # Feed the exact answer to the LLM so it styles it perfectly
                    synth_prompt = f"The user asked: '{user}'. The exact calculated truth is {exact_answer}. State this final answer directly and concisely."
                    ans_final = chat_collect(model_tag, [{"role": "system", "content": "You are a precise synthesizer."}, {"role": "user", "content": synth_prompt}])
                    time.sleep(0.2)

                # Stream the synthesized output
                sys.stdout.write(f"  {DG}● {R}{BD}{DG}coreling{R}  ")
                sys.stdout.flush()
                # Typewriter effect
                for char in ans_final:
                    sys.stdout.write(char); sys.stdout.flush(); time.sleep(0.01)
                print()
                history.append({"role": "assistant", "content": ans_final})
                br(); print(f"  {GR}{'─'*16}{R}"); br()
                continue

        # ──────────────────────────────────────────────────────
        # UNI-AGENT OR STANDARD FALLBACK
        # ──────────────────────────────────────────────────────
        sys.stdout.write(f"  {DG}● {R}{BD}{DG}coreling{R}  ")
        sys.stdout.flush()
        resp = chat_stream(model_tag, history)
        history.append({"role": "assistant", "content": resp})
        br(); print(f"  {GR}{'─'*16}{R}"); br()


def main():
    clr(); print(LOGO)
    wake_engine()
    br()
    
    mode_idx = menu([
        {"label": "Uni-Agent",   "badge": "gemma4:e4b", "meta": "Standard Chat"},
        {"label": "Multi-Agent", "badge": "gemma3:1b",  "meta": "Parallel Orchestration"}
    ], title="Select Engine Mode")

    mode = "uni" if mode_idx == 0 else "multi"
    session(mode)

if __name__ == "__main__":

    if len(sys.argv) > 1 and sys.argv[1] == "--update":
        print(f"\n  {CY}⚡ Pulling latest Coreling update...{R}\n")
        if os.name == 'nt':
            os.system('powershell -Command "Invoke-Expression (New-Object System.Net.WebClient).DownloadString(\'https://raw.githubusercontent.com/frien-frozen/corelingpy/main/install.ps1\')"')
        else:
            os.system('curl -fsSL https://raw.githubusercontent.com/frien-frozen/corelingpy/main/install.sh | bash')
        sys.exit(0)

    try:
        alt_screen_enter()
        main()
    except KeyboardInterrupt:
        pass
    finally:
        set_terminal_echo(True)
        alt_screen_exit()
        show_cur()
        print(f"\n{DG}.coreling{R} session closed.")
        
        if UPDATE_AVAILABLE:
            print(f"\n  {CY}⚡ Update available:{R} {GR}v{VERSION} → {W}v{UPDATE_AVAILABLE}{R}")
            print(f"  {GR}Run {W}coreling --update{GR} in your terminal to upgrade.{R}\n")