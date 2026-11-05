"""Capture screenshots of WINC AI OS pt-BR UI using headless Microsoft Edge."""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT_DIR = Path(r"C:\Users\winc\.gemini\antigravity\brain\189eecd7-e93a-48ca-b615-7a23a9301d4f")
SCRATCH_DIR = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=EDGE_PATH,
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. Dashboard with Floating Assistant
        await page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_dashboard_pt.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_dashboard_pt.png"))
        await page.screenshot(path=str(OUTPUT_DIR / "winc_dashboard_floating_pt.png"))
        print("Captured winc_dashboard_pt.png and winc_dashboard_floating_pt.png")

        # 2. Master AI Page with Hero Character & Audiovisual Waveform
        await page.locator("nav button:has-text('WINC Master AI')").click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_master_voice_pt.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_master_voice_pt.png"))
        await page.screenshot(path=str(OUTPUT_DIR / "winc_master_pt.png"))
        print("Captured winc_master_voice_pt.png")

        # 3. Settings Page with Virtual Assistant Section
        await page.locator("nav button:has-text('Configurações')").click()
        await page.wait_for_timeout(2000)
        # Scroll down main container to show Virtual Assistant card clearly
        await page.evaluate("const m = document.querySelector('main'); if(m) m.scrollTop = m.scrollHeight;")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_settings_voice_pt.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_settings_voice_pt.png"))
        print("Captured winc_settings_voice_pt.png")

        # 4. Agents Catalog Page
        await page.locator("nav button:has-text('Agentes')").click()
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_agents_pt.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_agents_pt.png"))
        print("Captured winc_agents_pt.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture())
