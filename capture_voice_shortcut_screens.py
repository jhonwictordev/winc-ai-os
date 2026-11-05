"""Capture visual screenshots of WINC OS Key F shortcut HUD and Settings."""

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
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            permissions=["microphone"]
        )
        page = await context.new_page()

        # Mock speech recognition for visual capture if headless has no physical mic
        await page.add_init_script("""
            window.SpeechRecognition = window.SpeechRecognition || class {
                constructor() {
                    this.continuous = true;
                    this.interimResults = true;
                    this.lang = 'pt-BR';
                }
                start() {
                    setTimeout(() => {
                        if (this.onresult) {
                            this.onresult({
                                resultIndex: 0,
                                results: [
                                    [{ transcript: "WINC, abra meu projeto da agência e verifique os erros do frontend." }]
                                ]
                            });
                        }
                    }, 500);
                }
                stop() {}
                abort() {}
            };
            window.webkitSpeechRecognition = window.SpeechRecognition;
        """)

        # 1. Dashboard and press Key F to show HUD
        await page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Press physical key 'F'
        await page.keyboard.press("KeyF")
        await page.wait_for_timeout(1800)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_voice_hud_recording.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_voice_hud_recording.png"))
        print("Captured winc_voice_hud_recording.png")

        # Press ESC to test cancel
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)

        # 2. Settings Page with Key F configuration
        await page.locator("nav button:has-text('Configurações')").click()
        await page.wait_for_timeout(2000)
        # Scroll down main container to show Virtual Assistant & Voice Shortcut card clearly
        await page.evaluate("const m = document.querySelector('main'); if(m) m.scrollTop = m.scrollHeight;")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUTPUT_DIR / "winc_settings_shortcut.png"))
        await page.screenshot(path=str(SCRATCH_DIR / "winc_settings_shortcut.png"))
        print("Captured winc_settings_shortcut.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture())
