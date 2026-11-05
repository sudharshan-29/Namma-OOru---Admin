import json
import subprocess
import urllib.request
import base64
import time
import websocket
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\dhivy\AppData\Local\Temp\chrome_debug_simple"
OUT_PATH = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\current_dashboard_capture.png"

def capture():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9229",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1536,1024",
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--no-first-run",
        "--no-default-browser-check",
        "about:blank"
    ])
    
    try:
        time.sleep(2.0)
        with urllib.request.urlopen("http://127.0.0.1:9229/json/version") as resp:
            version_info = json.loads(resp.read().decode())
        ws_url = version_info["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url)
        
        # Create target
        ws.send(json.dumps({"id": 1, "method": "Target.createTarget", "params": {"url": "http://localhost:3000/#/dashboard"}}))
        t_res = json.loads(ws.recv())
        target_id = t_res["result"]["targetId"]

        # Attach target
        ws.send(json.dumps({"id": 2, "method": "Target.attachToTarget", "params": {"targetId": target_id, "flatten": True}}))
        att_res = json.loads(ws.recv())
        session_id = att_res["params"]["sessionId"] if "params" in att_res else att_res["result"]["sessionId"]

        # Wait for page to render
        time.sleep(5.0)

        # Set device metrics to 1536x1024
        ws.send(json.dumps({
            "id": 3,
            "sessionId": session_id,
            "method": "Emulation.setDeviceMetricsOverride",
            "params": {"width": 1536, "height": 1024, "deviceScaleFactor": 1, "mobile": False}
        }))
        ws.recv()
        time.sleep(2.0)

        # Capture screenshot
        ws.send(json.dumps({
            "id": 4,
            "sessionId": session_id,
            "method": "Page.captureScreenshot",
            "params": {"format": "png"}
        }))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == 4:
                shot_data = resp["result"]["data"]
                break

        with open(OUT_PATH, "wb") as f:
            f.write(base64.b64decode(shot_data))
        print("Captured successfully to:", OUT_PATH)
        ws.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    capture()

