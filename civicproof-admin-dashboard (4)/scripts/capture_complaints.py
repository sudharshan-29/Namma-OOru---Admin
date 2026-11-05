import asyncio
import json
import subprocess
import time
import urllib.request
import base64
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_PATH = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_complaints_1640.png"
OUTPUT_1720 = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_complaints_1720x900.png"
USER_DATA_DIR = r"C:\Users\dhivy\AppData\Local\Temp\chrome_debug_profile_complaints"

async def capture():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9223",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1720,900",
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
            # 1. Capture All Complaints at 1720x900
            await ws.send(json.dumps({"id": 1, "method": "Target.createTarget", "params": {"url": "http://localhost:3000/#/all-complaints"}}))
            res = json.loads(await ws.recv())
            target_id = res["result"]["targetId"]

            await ws.send(json.dumps({"id": 2, "method": "Target.attachToTarget", "params": {"targetId": target_id, "flatten": True}}))
            attach_res = json.loads(await ws.recv())
            session_id = attach_res["params"]["sessionId"]

            await ws.send(json.dumps({
                "id": 3,
                "sessionId": session_id,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 1720, "height": 900, "deviceScaleFactor": 1, "mobile": False}
            }))
            await ws.recv()
            await asyncio.sleep(3.5)

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
                    with open(OUTPUT_1720, "wb") as f:
                        f.write(data)
                    print(f"Complaints 1720x900 screenshot saved successfully ({len(data)} bytes) to {OUTPUT_1720}")
                    break

            # 2. Capture All Complaints at 1640x920
            await ws.send(json.dumps({
                "id": 5,
                "sessionId": session_id,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 1640, "height": 920, "deviceScaleFactor": 1, "mobile": False}
            }))
            await ws.recv()
            await asyncio.sleep(1.5)

            await ws.send(json.dumps({
                "id": 6,
                "sessionId": session_id,
                "method": "Page.captureScreenshot",
                "params": {"format": "png"}
            }))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get("id") == 6:
                    data = base64.b64decode(msg["result"]["data"])
                    with open(OUTPUT_PATH, "wb") as f:
                        f.write(data)
                    print(f"Complaints 1640 screenshot saved successfully ({len(data)} bytes) to {OUTPUT_PATH}")
                    break

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture())
