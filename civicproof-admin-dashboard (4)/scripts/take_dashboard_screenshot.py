import asyncio
import json
import subprocess
import urllib.request
import base64
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_1536 = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_dashboard_1536.png"
USER_DATA_DIR = r"C:\Users\dhivy\AppData\Local\Temp\chrome_debug_profile_db"

async def capture():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9223",
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
        version_info = None
        for _ in range(30):
            try:
                with urllib.request.urlopen("http://127.0.0.1:9223/json/version", timeout=1) as resp:
                    version_info = json.loads(resp.read().decode())
                    break
            except Exception:
                await asyncio.sleep(0.3)
                
        if not version_info:
            print("Failed to connect to Chrome debugging port")
            return

        ws_url = version_info["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url, max_size=20 * 1024 * 1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Target.createTarget", "params": {"url": "http://localhost:3000/#/dashboard"}}))
            res = json.loads(await ws.recv())
            target_id = res["result"]["targetId"]

            await ws.send(json.dumps({"id": 2, "method": "Target.attachToTarget", "params": {"targetId": target_id, "flatten": True}}))
            attach_res = json.loads(await ws.recv())
            session_id = attach_res["params"]["sessionId"]

            await ws.send(json.dumps({
                "id": 3,
                "sessionId": session_id,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 1536, "height": 1024, "deviceScaleFactor": 1, "mobile": False}
            }))
            await ws.recv()
            await asyncio.sleep(8.0)

            await ws.send(json.dumps({
                "id": 4,
                "sessionId": session_id,
                "method": "Page.captureScreenshot",
                "params": {"format": "png"}
            }))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get("id") == 4:
                    data = base64.b64decode(msg["result"]["data"])
                    with open(OUTPUT_1536, "wb") as f:
                        f.write(data)
                    print(f"Saved {OUTPUT_1536} ({len(data)} bytes)")
                    break
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture())
