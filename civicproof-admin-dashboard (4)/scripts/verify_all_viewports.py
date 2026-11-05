import asyncio
import json
import subprocess
import urllib.request
import base64
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\dhivy\AppData\Local\Temp\chrome_debug_profile_db_all"

VIEWPORTS = [
    (1897, 991, r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\dashboard_1897x991.png"),
    (1536, 864, r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\dashboard_1536x864.png"),
    (1920, 1080, r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\dashboard_1920x1080.png"),
    (1366, 768, r"C:\Namma Ooru\civicproof-admin-dashboard (4)\public\dashboard_1366x768.png"),
]

async def send_cmd(ws, msg_id, method, params=None, session_id=None):
    payload = {"id": msg_id, "method": method}
    if params:
        payload["params"] = params
    if session_id:
        payload["sessionId"] = session_id
    await ws.send(json.dumps(payload))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp

async def capture_all():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9227",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1897,991",
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--no-first-run",
        "--no-default-browser-check",
        "about:blank"
    ])
    
    try:
        await asyncio.sleep(1.5)
        with urllib.request.urlopen("http://127.0.0.1:9227/json/version") as resp:
            version_info = json.loads(resp.read().decode())
        ws_url = version_info["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25 * 1024 * 1024) as ws:
            # Create target
            t_res = await send_cmd(ws, 1, "Target.createTarget", {"url": "http://localhost:3000/#/dashboard"})
            target_id = t_res["result"]["targetId"]

            # Attach target
            att_res = await send_cmd(ws, 2, "Target.attachToTarget", {"targetId": target_id, "flatten": True})
            session_id = att_res["params"]["sessionId"] if "params" in att_res else att_res["result"]["sessionId"]

            # Wait initial load
            await asyncio.sleep(6.0)

            msg_counter = 10
            for width, height, outfile in VIEWPORTS:
                # Set viewport metrics
                msg_counter += 1
                await send_cmd(ws, msg_counter, "Emulation.setDeviceMetricsOverride", {
                    "width": width, "height": height, "deviceScaleFactor": 1, "mobile": False
                }, session_id=session_id)
                await asyncio.sleep(2.0)

                eval_js = """
                (() => {
                  const heroEl = document.getElementById('hero-row');
                  const kpiEl = document.getElementById('kpi-row');
                  const lowerEl = document.getElementById('lower-section');
                  const mapEl = document.getElementById('map-container');
                  const trendsEl = document.getElementById('trends-card');
                  const deptEl = document.getElementById('dept-card');
                  const navbarEl = document.querySelector('.admin-navbar');
                  const contentEl = document.querySelector('.dashboard-content-grid');
                  
                  const getH = (el) => el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : 0;
                  const getLeft = (el) => el ? Math.round(el.getBoundingClientRect().left * 10) / 10 : 0;
                  const getRight = (el) => el ? Math.round(el.getBoundingClientRect().right * 10) / 10 : 0;

                  const sparklines = kpiEl ? kpiEl.querySelectorAll('svg').length : 0;
                  const trendsYAxisTicks = Array.from(document.querySelectorAll('#trends-card .recharts-yAxis .recharts-cartesian-axis-tick-value, #trends-card .recharts-yAxis text, #trends-card .recharts-cartesian-axis.yAxis text')).map(t => t.textContent.trim()).filter(Boolean);
                  const deptYAxisTicks = Array.from(document.querySelectorAll('#dept-card .recharts-yAxis .recharts-cartesian-axis-tick-value, #dept-card .recharts-yAxis text, #dept-card .recharts-cartesian-axis.yAxis text')).map(t => t.textContent.trim()).filter(Boolean);

                  return JSON.stringify({
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    scrollHeight: document.documentElement.scrollHeight,
                    innerHeight: window.innerHeight,
                    noScroll: document.documentElement.scrollHeight <= window.innerHeight,
                    heroHeight: getH(heroEl),
                    kpiHeight: getH(kpiEl),
                    lowerHeight: getH(lowerEl),
                    trendsHeight: getH(trendsEl),
                    deptHeight: getH(deptEl),
                    mapHeight: getH(mapEl),
                    sparklinesCount: sparklines,
                    trendsTicks: trendsYAxisTicks,
                    deptTicks: deptYAxisTicks,
                    navbarLeft: getLeft(navbarEl),
                    navbarRight: getRight(navbarEl),
                    contentLeft: getLeft(contentEl),
                    contentRight: getRight(contentEl),
                    edgesAligned: Math.abs(getLeft(navbarEl) - getLeft(contentEl)) < 2 && Math.abs(getRight(navbarEl) - getRight(contentEl)) < 2
                  }, null, 2);
                })()
                """
                eval_res = await send_cmd(ws, msg_counter, "Runtime.evaluate", {
                    "expression": eval_js,
                    "returnByValue": True
                }, session_id=session_id)
                val = eval_res.get("result", {}).get("result", {}).get("value")
                print(f"\\n--- Viewport {width}x{height} Metrics ---\\n{val}")

                # Capture screenshot
                msg_counter += 1
                shot_res = await send_cmd(ws, msg_counter, "Page.captureScreenshot", {"format": "png"}, session_id=session_id)
                data = base64.b64decode(shot_res["result"]["data"])
                with open(outfile, "wb") as f:
                    f.write(data)
                print(f"Saved {outfile} ({width}x{height})")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture_all())
