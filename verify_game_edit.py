import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir="/home/jules/verification/videos/",
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        print("Navigating to http://localhost:8081/games")
        await page.goto("http://localhost:8081/games")

        await page.wait_for_selector("text=View Details")

        print("Clicking 'View Details' on an active game...")
        cards = await page.locator(".rounded-xl.border").all()
        active_card = None
        for card in cards:
            text = await card.inner_text()
            if "created" in text or "in progress" in text:
                active_card = card
                break

        if active_card:
            await active_card.locator("text=View Details").click()
        else:
            await page.locator("text=View Details").first.click()

        print("Navigated to game details page.")
        await page.wait_for_selector("h1")

        await page.screenshot(path="/home/jules/verification/screenshots/header_initial.png")

        edit_button = page.locator('button[aria-label="Edit game name"]')

        if await edit_button.is_visible():
            print("Found Edit button! Clicking it...")
            await edit_button.click()

            await page.wait_for_selector('input')
            await page.screenshot(path="/home/jules/verification/screenshots/header_editing.png")

            await page.locator('input').fill("Updated Playwright Game")

            save_button = page.locator('button[aria-label="Save game name"]')
            print("Clicking Save button...")

            click_task = asyncio.create_task(save_button.click())

            await asyncio.sleep(0.05)
            await page.screenshot(path="/home/jules/verification/screenshots/header_saving.png")

            await click_task

            await page.wait_for_selector('input', state='hidden')

            await page.screenshot(path="/home/jules/verification/screenshots/header_saved.png")
            print("Edit flow successful!")
        else:
            print("Edit button not visible on this game page. It might be completed.")
            await page.screenshot(path="/home/jules/verification/screenshots/header_no_edit.png")

        await context.close()
        await browser.close()

        print(f"Video saved to: {await page.video.path()}")

if __name__ == "__main__":
    asyncio.run(main())
