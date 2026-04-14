#!/usr/bin/env python3
import sys, os, platform, subprocess, json, threading, time, re, zipfile, base64
import urllib.request, urllib.error
import concurrent.futures
from shutil import which

try:
    import tty, termios
    IS_WINDOWS = False
except ImportError:
    import msvcrt
    IS_WINDOWS = True

VERSION = "1.0.0"
UPDATE_URL = "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling.py"

# --- CORELING STEALTH SANDBOX ---
cdir = os.path.expanduser("~/.coreling")
art_dir = os.path.join(cdir, "artifacts")
save_dir = os.path.join(cdir, "saved")  # User file storage
brain_path = os.path.join(cdir, "brain.md") # The local brain

os.makedirs(art_dir, exist_ok=True)
os.makedirs(save_dir, exist_ok=True)
os.environ["OLLAMA_MODELS"] = art_dir

DAEMON_NAME = "corelingd.exe" if IS_WINDOWS else "corelingd"
DAEMON_PATH = os.path.join(cdir, DAEMON_NAME)

R  = "\033[0m"
BD = "\033[1m"
DM = "\033[2m"
W  = "\033[97m"
GR = "\033[90m"
GN = "\033[92m"
CY = "\033[96m"
DG = "\033[32m"

UPDATE_AVAILABLE = False

def check_for_updates():
    global UPDATE_AVAILABLE
    try:
        req = urllib.request.Request(UPDATE_URL, headers={'Range': 'bytes=0-500'})
        with urllib.request.urlopen(req, timeout=2) as r:
            match = re.search(r'VERSION\s*=\s*"([^"]+)"', r.read().decode('utf-8'))
            if match and match.group(1) != VERSION:
                UPDATE_AVAILABLE = match.group(1)
    except: pass

def pull_default_brain():
    # If the user doesn't have a local brain, fetch the default from GitHub
    if not os.path.exists(brain_path):
        try:
            brain_url = "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/brain.md"
            req = urllib.request.Request(brain_url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                with open(brain_path, "wb") as f:
                    f.write(resp.read())
        except:
            # Fallback if offline
            with open(brain_path, "w") as f:
                f.write("You are Coreling, an advanced AI orchestrator by Coreling Corp. Be highly human, engaging, and never robotic.")

def clr(): os.system("cls" if IS_WINDOWS else "clear")
def hide_cur(): sys.stdout.write("\033[?25l"); sys.stdout.flush()
def show_cur(): sys.stdout.write("\033[?25h"); sys.stdout.flush()
def alt_screen_enter(): sys.stdout.write("\033[?1049h\033[H"); sys.stdout.flush()
def alt_screen_exit(): sys.stdout.write("\033[?1049l"); sys.stdout.flush()
def br(): print()
def ok(m): print(f"  {GN}✓{R}  {m}")
def info(m): print(f"  {CY}·{R}  {m}")
def sep(): print(f"  {GR}{'─'*50}{R}")

def flush_input():
    if IS_WINDOWS:
        while msvcrt.kbhit(): msvcrt.getch()
    else:
        try: termios.tcflush(sys.stdin, termios.TCIFLUSH)
        except: pass

def set_terminal_echo(en: bool):
    if IS_WINDOWS: return
    try:
        fd = sys.stdin.fileno()
        attr = termios.tcgetattr(fd)
        if en: attr[3] |= termios.ECHO
        else: attr[3] &= ~termios.ECHO
        termios.tcsetattr(fd, termios.TCSANOW, attr)
    except: pass

USER = os.environ.get("USER", os.environ.get("USERNAME", "Developer")).capitalize()
LOGO = f"""
{DG}╭──────────────────────────────────────────┬─────────────────────────────────╮{R}
{DG}│{R}                                          {DG}│{R} {DG}Coreling v{VERSION:<21}{R}{DG}│{R}
{DG}│{R}{BD}{W}{f"Welcome back, {USER}!".center(42)}{R}{DG}│{R} Local AI Orchestrator           {DG}│{R}
{DG}│{R}                                          {DG}│{R} 100% Private Execution          {DG}│{R}
{DG}│{R}               {DG}▄▄██▓▄{R}                     {DG}├─────────────────────────────────┤{R}
{DG}│{R}           {DG},▄█████▀─,{R}                     {DG}│{R} {DG}System Status{R}                   {DG}│{R}
{DG}│{R}        {DG}▄███████▀└ ¬▀█▌{R}                   {DG}│{R} Engine: Online                  {DG}│{R}
{DG}│{R}        {DG}████▀╙╓▄████▄▄─{R}                   {DG}│{R} Memory: Active                  {DG}│{R}
{DG}│{R}        {DG}████ ▐████████▌ ▓▄{R}                {DG}│{R} Artifact Path: Secure           {DG}│{R}
{DG}│{R}        {DG}████ ▐████████▌ ██▀─{R}              {DG}│{R}                                 {DG}│{R}
{DG}│{R}        {DG}████ └███████▀ ▄▄██{R}               {DG}│{R}                                 {DG}│{R}
{DG}│{R}        {DG}██████▄▄╙▀▀╙,▄██████{R}              {DG}│{R}                                 {DG}│{R}
{DG}│{R}         {DG}└▀██████████████▀└{R}               {DG}│{R}                                 {DG}│{R}
{DG}│{R}             {DG}╙▀██████▀╙{R}                   {DG}│{R}                                 {DG}│{R}
{DG}│{R}                                          {DG}│{R}                                 {DG}│{R}
{DG}╰──────────────────────────────────────────┴─────────────────────────────────╯{R}
"""

def read_key() -> str:
    if IS_WINDOWS:
        ch = msvcrt.getch()
        if ch in (b'\x03', b'\x04'): raise KeyboardInterrupt
        if ch in (b'\r', b'\n'): return "enter"
        if ch in (b'\xe0', b'\x00'):
            arr = msvcrt.getch()
            if arr == b'H': return "up"
            if arr == b'P': return "down"
        return ""
    else:
        fd = sys.stdin.fileno()
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
            if ch == "\x03": raise KeyboardInterrupt
            return ch
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old)

def menu(opts: list, title: str = "") -> int:
    cur = 0
    def bl(sel: int):
        r = [f"  {BD}{W}{title}{R}", f"  {GR}{'─'*50}{R}"]
        for i, o in enumerate(opts):
            if i == sel: r.append(f"  {CY}▶{R} {BD}{W}{o['label']}{R}  {CY}{o.get('badge','')}{R}  {GR}{o.get('meta','')}{R}")
            else:        r.append(f"    {GR}{o['label']}{R}  {o.get('badge','')}  {o.get('meta','')}")
        return r + [""]
    hide_cur(); fl = bl(cur)
    sys.stdout.write("\n".join(fl) + "\n"); sys.stdout.flush()
    try:
        while True:
            k = read_key(); m = False
            if k == "up" and cur > 0: cur -= 1; m = True
            elif k == "down" and cur < len(opts) - 1: cur += 1; m = True
            elif k == "enter": print(); return cur
            if m:
                nl = bl(cur)
                sys.stdout.write(f"\033[{len(fl)}A")
                for l in nl: sys.stdout.write(f"\033[2K{l}\n")
                sys.stdout.flush()
    except KeyboardInterrupt: raise

class HypeSpinner:
    F = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
    def __init__(self, msg="Processing"):
        self.m = msg; self.s = threading.Event()
        self.t = threading.Thread(target=self.r, daemon=True)
    def r(self):
        i = 0; hide_cur()
        while not self.s.is_set():
            sys.stdout.write(f"\r\033[2K  {CY}{self.F[i % len(self.F)]}{R}  {GR}{self.m}{R} ")
            sys.stdout.flush(); time.sleep(0.08); i += 1
    def __enter__(self): self.t.start(); return self
    def __exit__(self, *_):
        self.s.set(); self.t.join()
        sys.stdout.write("\r\033[2K"); sys.stdout.flush(); show_cur()
    def update(self, msg: str): self.m = msg

def silent_pull(tag: str):
    subprocess.run([DAEMON_PATH, "pull", tag], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def api_check(path: str):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:11434{path}", timeout=2) as r:
            return json.loads(r.read().decode())
    except: return None

def wake_engine():
    # ── FAST BOOT CHECK ──
    if api_check("/") is not None: return

    if not os.path.exists(DAEMON_PATH):
        with HypeSpinner("Forging Coreling Daemon..."):
            if IS_WINDOWS:
                z_path = os.path.join(cdir, "temp.zip")
                req = urllib.request.Request("https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip", headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as resp, open(z_path, 'wb') as out:
                    out.write(resp.read())
                with zipfile.ZipFile(z_path, 'r') as z:
                    z.extract("ollama.exe", cdir)
                os.rename(os.path.join(cdir, "ollama.exe"), DAEMON_PATH)
                os.remove(z_path)
            else:
                arch = "arm64" if platform.machine().lower() in ["arm64", "aarch64"] else "amd64"
                url = "https://github.com/ollama/ollama/releases/latest/download/ollama-darwin" if platform.system() == "Darwin" else f"https://github.com/ollama/ollama/releases/latest/download/ollama-linux-{arch}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as resp, open(DAEMON_PATH, 'wb') as out:
                    out.write(resp.read())
                os.chmod(DAEMON_PATH, 0o755) 
            
    with HypeSpinner("Aligning neural pathways...") as sp:
        if IS_WINDOWS: subprocess.run(["taskkill", "/F", "/IM", DAEMON_NAME], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        else:          subprocess.run(["pkill", "-f", DAEMON_NAME], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        time.sleep(0.5)
        
        env = os.environ.copy()
        env["OLLAMA_NUM_PARALLEL"] = "2"
        subprocess.Popen([DAEMON_PATH, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
        
        for _ in range(40):
            time.sleep(0.4)
            if api_check("/") is not None: break

def extract_math(tx: str):
    c = tx.strip().rstrip("?!.")
    for p in ["what is", "calculate", "compute", "solve", "evaluate"]:
        if c.lower().startswith(p): c = c[len(p):].lstrip(", ")
    r = []; curr = []
    for ch in c:
        if ch in "0123456789.+-*/() ": curr.append(ch)
        else:
            if curr: r.append("".join(curr).strip()); curr = []
    if curr: r.append("".join(curr).strip())
    b = ""
    for x in r:
        if any(o in x for o in "+-*/") and any(d.isdigit() for d in x) and len(x) > len(b): b = x
    return b

def decompose_task(ui: str):
    e = extract_math(ui)
    if not e: return None
    d = 0; ix, op = -1, None
    for i in range(len(e) - 1, 0, -1):
        c = e[i]
        if c == ")": d += 1
        elif c == "(": d -= 1
        elif d == 0 and c in "+-":
            if e[i-1] not in "+-*/(": ix, op = i, c; break
    if ix < 0:
        d = 0
        for i in range(len(e) - 1, 0, -1):
            c = e[i]
            if c == ")": d += 1
            elif c == "(": d -= 1
            elif d == 0 and c in "*/": ix, op = i, c; break
    if ix < 0: return None
    a = e[:ix].strip(); b = e[ix+1:].strip()
    if not any(c.isdigit() for c in a) or not any(c.isdigit() for c in b): return None
    return {"a": f"Calculate: {a}", "b": f"Calculate: {b}", "o": op, "fm": e}

def chat_stream(tag: str, msgs: list) -> str:
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat", data=json.dumps({"model": tag, "messages": msgs, "stream": True}).encode(), headers={"Content-Type": "application/json"}, method="POST")
    f = []
    try:
        with urllib.request.urlopen(req, timeout=120) as rs:
            for rw in rs:
                try:
                    tk = json.loads(rw.decode().strip()).get("message", {}).get("content", "")
                    if tk: sys.stdout.write(tk); sys.stdout.flush(); f.append(tk)
                except: pass
    except: pass
    print(); return "".join(f)

def chat_collect(tag: str, msgs: list) -> str:
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat", data=json.dumps({"model": tag, "messages": msgs, "stream": False}).encode(), headers={"Content-Type": "application/json"}, method="POST")
    try: return json.loads(urllib.request.urlopen(req, timeout=120).read().decode()).get("message", {}).get("content", "").strip()
    except: return "error"

def session(md: str):
    clr(); print(LOGO)
    mt = "llama3.2" if md == "uni" else "llama3.2:1b"
    print(f"  {GR}mode   {R}{BD}{DG if md=='uni' else CY}{'Uni-Agent' if md=='uni' else 'Multi-Agent'}{R}   {GR}({mt}){R}")
    br(); sep(); print(f"  {GR}/clear  {R}reset    {GR}/exit  {R}quit"); sep(); br()

    threading.Thread(target=silent_pull, args=(mt,), daemon=True).start()
    
    # Read the brain file
    try:
        with open(brain_path, "r", encoding="utf-8") as f:
            custom_brain = f.read().strip()
    except:
        custom_brain = "You are Coreling, an advanced AI orchestrator by Coreling Corp. Be highly human, engaging, and never robotic."

    hs = [{"role": "system", "content": custom_brain}]

    while True:
        set_terminal_echo(True); flush_input()
        try: u = input(f"  {DG}❯ {R}{BD}{W}you{R}  ").strip()
        except KeyboardInterrupt: raise
        set_terminal_echo(False)
        if not u: continue
        if u.lower() in ("/exit", "/quit"): raise KeyboardInterrupt
        if u.lower() == "/clear": hs = [hs[0]]; clr(); continue

        # ── VISION INTERCEPTOR ──
        cleaned_input = u.strip('"\'') 
        img_payload = None
        if os.path.isfile(cleaned_input) and cleaned_input.lower().endswith(('.png', '.jpg', '.jpeg')):
            with HypeSpinner("Analyzing image layout...") as sp:
                with open(cleaned_input, "rb") as img:
                    b64_image = base64.b64encode(img.read()).decode('utf-8')
                
                img_payload = {
                    "role": "user", 
                    "content": "Analyze this image.", 
                    "images": [b64_image]
                }
                # Fallback to text representation in chat
                hs.append(img_payload)
                u = f"[Attached Image: {os.path.basename(cleaned_input)}]"
                br(); print(f"  {CY}·{R} {GR}{u}{R}"); br()
        else:
            hs.append({"role": "user", "content": u}); br()


        if md == "multi" and img_payload is None:
            sp = decompose_task(u)
            if sp:
                with HypeSpinner("Decomposing task...") as s:
                    time.sleep(0.4)
                    s.update("Routing to deterministic coprocessor...")
                    time.sleep(0.3)
                    try:
                        ra = eval(sp["fm"])
                        ea = f"{ra:,.4f}" if isinstance(ra, float) else f"{ra:,}"
                    except: ea = "Calculation error."
                    s.update("Synthesizing...")
                    fn = chat_collect(mt, [{"role": "system", "content": "You are a precise synthesizer."}, {"role": "user", "content": f"The exact calculated truth for '{u}' is {ea}. State this final answer concisely."}])
                    time.sleep(0.2)

                sys.stdout.write(f"  {DG}● {R}{BD}{DG}coreling{R}  "); sys.stdout.flush()
                for c in fn: sys.stdout.write(c); sys.stdout.flush(); time.sleep(0.01)
                print(); hs.append({"role": "assistant", "content": fn})
                br(); print(f"  {GR}{'─'*16}{R}"); br(); continue

        sys.stdout.write(f"  {DG}● {R}{BD}{DG}coreling{R}  "); sys.stdout.flush()
        
        # We need a multimodal model if images are present. Llama 3.2 11B is the vision model.
        active_model = "llama3.2-vision" if img_payload else mt
        
        # Ensure the vision model is pulled if needed
        if img_payload:
            threading.Thread(target=silent_pull, args=("llama3.2-vision",), daemon=True).start()

        # ... existing chat stream code ...
        rs = chat_stream(active_model, hs)
        
        if not rs:
            rs = f"[{CY}Coreling is pulling the neural weights for '{active_model}'. This only happens once. Give it a minute and try again!{R}]"
            sys.stdout.write(rs); print();
            hs.pop() 
        else:
            hs.append({"role": "assistant", "content": rs})
            memories = re.findall(r'<LEARN>(.*?)</LEARN>', rs, re.IGNORECASE | re.DOTALL)
            if memories:
                with open(brain_path, "a", encoding="utf-8") as f:
                    for mem in memories:
                        f.write(f"\n\n[Learned Memory]: {mem.strip()}")
            
        br(); print(f"  {GR}{'─'*16}{R}"); br()

def main():
    clr(); print(LOGO)
    threading.Thread(target=check_for_updates, daemon=True).start()
    pull_default_brain() # Ensures the user has the brain.md
    wake_engine(); br()
    m_idx = menu([
        {"label": "Uni-Agent", "badge": "llama3.2", "meta": "Standard Chat"},
        {"label": "Multi-Agent", "badge": "llama3.2:1b", "meta": "Parallel Orchestration"}
    ], title="Select Engine Mode")
    session("uni" if m_idx == 0 else "multi")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--update":
        print(f"\n  {CY}⚡ Pulling latest Coreling update...{R}\n")
        if IS_WINDOWS: os.system('powershell -Command "irm https://raw.githubusercontent.com/frien-frozen/corelingpy/main/install.ps1 | iex"')
        else: os.system('curl -fsSL https://raw.githubusercontent.com/frien-frozen/corelingpy/main/install.sh | bash')
        sys.exit(0)

    try:
        alt_screen_enter()
        main()
    except KeyboardInterrupt: pass
    finally:
        set_terminal_echo(True)
        alt_screen_exit(); show_cur()
        print(f"\n{DG}.coreling{R} session closed.")
        if UPDATE_AVAILABLE:
            print(f"\n  {CY}⚡ Update available:{R} {GR}v{VERSION} → {W}v{UPDATE_AVAILABLE}{R}")
            print(f"  {GR}Run {W}coreling --update{GR} in your terminal to upgrade.{R}\n")