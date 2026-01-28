import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        print("Fetching प्रोडक्ट्स...")
        try:
            resp = await client.get("/api/v1/products/")
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text}")
            else:
                data = resp.json()
                print(f"Success. Count: {len(data)}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
