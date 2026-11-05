import asyncio
import json
import subprocess
import time
import urllib.request
import base64
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_PATH = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_dashboard_1640.png"
USER_DATA_DIR = r"C:\Users\dhivy\AppData\Local\Temp\chrome_debug_profile"

async def capture():
    # Kill any existing chrome instances on debug port if running
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1640,920",
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--no-first-run",
        "--no-default-browser-check",
        "about:blank"
    ])
    
    try:
        # Wait for debugging port to be ready
        version_info = None
        for _ in range(30):
            try:
                with urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=1) as resp:
                    version_info = json.loads(resp.read().decode())
                    break
            except Exception:
                await asyncio.sleep(0.3)
                
        if not version_info:
            print("Failed to connect to Chrome debugging port")
            return

        ws_url = version_info["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url, max_size=20 * 1024 * 1024) as ws:
            # 1. Capture Map View
            await ws.send(json.dumps({"id": 1, "method": "Target.createTarget", "params": {"url": "http://localhost:3000/#/map-view"}}))
            res = json.loads(await ws.recv())
            target_id = res["result"]["targetId"]

            await ws.send(json.dumps({"id": 2, "method": "Target.attachToTarget", "params": {"targetId": target_id, "flatten": True}}))
            attach_res = json.loads(await ws.recv())
            session_id = attach_res["params"]["sessionId"]

            await ws.send(json.dumps({
                "id": 3,
                "sessionId": session_id,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 1640, "height": 920, "deviceScaleFactor": 1, "mobile": False}
            }))
            await ws.recv()
            await asyncio.sleep(10.0)

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
                    map_out = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_map_view_1640.png"
                    with open(map_out, "wb") as f:
                        f.write(data)
                    print(f"Map screenshot saved successfully ({len(data)} bytes) to {map_out}")
                    break

            # 2. Capture Dashboard View at 1648x1024 (user requested verification resolution)
            await ws.send(json.dumps({"id": 5, "method": "Target.createTarget", "params": {"url": "http://localhost:3000/#/dashboard"}}))
            res = json.loads(await ws.recv())
            target_id_db = res["result"]["targetId"]

            await ws.send(json.dumps({"id": 6, "method": "Target.attachToTarget", "params": {"targetId": target_id_db, "flatten": True}}))
            attach_res = json.loads(await ws.recv())
            session_id_db = attach_res["params"]["sessionId"]

            await ws.send(json.dumps({
                "id": 7,
                "sessionId": session_id_db,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 1536, "height": 1024, "deviceScaleFactor": 1, "mobile": False}
            }))
            await ws.recv()
            await asyncio.sleep(5.0)

            await ws.send(json.dumps({
                "id": 8,
                "sessionId": session_id_db,
                "method": "Page.captureScreenshot",
                "params": {"format": "png"}
            }))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get("id") == 8:
                    data = base64.b64decode(msg["result"]["data"])
                    out_1648 = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_dashboard_1648.png"
                    out_1536 = r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\live_dashboard_1536.png"
                    with open(out_1648, "wb") as f:
                        f.write(data)
                    with open(out_1536, "wb") as f:
                        f.write(data)
                    with open(OUTPUT_PATH, "wb") as f:
                        f.write(data)
                    print(f"Dashboard screenshot saved successfully ({len(data)} bytes) to {out_1648} and {OUTPUT_PATH}")
                    break
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture())
