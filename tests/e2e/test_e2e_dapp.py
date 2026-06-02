import asyncio
import re
from playwright.async_api import async_playwright, expect

# KỊCH BẢN: test_e2e_dapp.py (Playwright + Python)
# Thực thi Luồng Thuê Sách Cơ Bản (SC-01) từ E2E_SCENARIOS.md

FRONTEND_URL = "http://localhost:3000"
HARDHAT_ACCOUNT1_PRIVKEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" 
HARDHAT_ACCOUNT1_PUBKEY = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

async def run(playwright):
    browser = await playwright.chromium.launch(headless=False, slow_mo=500) 
    # Mở 1 context mới
    context = await browser.new_context(
        viewport={'width': 1280, 'height': 720},
        ignore_https_errors=True
    )

    # ==== INJECT MOCK ETHEREUM PROVIDER ====
    # Để bypass MetaMask extension, ta inject 1 proxy object vào window.ethereum
    # cho phép Frontend pass qua bước "Vui lòng cài đặt ví".
    # (Trong test nâng cao ta sẽ dùng thư viện DAppeteer hoặc Synpress. 
    # Tại đây ta mock hàm eth_requestAccounts để auto-trả về Acc1)
    
    mock_provider_script = f"""
        window.ethereum = {{
            isMetaMask: true,
            request: async (args) => {{
                console.log("[Mock provider] request", args);
                if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {{
                    return ["{HARDHAT_ACCOUNT1_PUBKEY}"];
                }}
                if (args.method === 'eth_chainId') {{
                    return '0x7a69'; // Hardhat local (31337)
                }}
                if (args.method === 'net_version') {{
                    return '31337';
                }}
                if (args.method === 'eth_sendTransaction') {{
                    console.log("[Mock provider] eth_sendTransaction called", args.params);
                    // Giả lập trả về TxHash ảo
                    return "0xmockedtxhash1234567890abcdef1234567890abcdef1234567890abcdef1234";
                }}
                return null;
            }},
            on: (eventName, callback) => {{ console.log("[Mock provider] event listener bound for", eventName); }},
            removeListener: () => {{}}
        }};
    """
    await context.add_init_script(mock_provider_script)

    page = await context.new_page()

    print(f"Bắt đầu điều hướng tới ứng dụng {FRONTEND_URL}...")
    try:
        await page.goto(FRONTEND_URL)
        await page.wait_for_load_state("networkidle")
    except Exception as e:
        print(f"❌ Không thể tải trang {FRONTEND_URL}. Đảm bảo Vite đang chạy. Lỗi: {e}")
        await browser.close()
        return

    # 1. Đăng nhập / Kết nối Ví
    print("Tiến hành kết nối ví MetaMask Mock...")
    # Giả định nút "Connect Wallet" có text "Connect Wallet" hoặc "Kết nối Ví"
    # Hoặc Frontend tự động detect nếu window.ethereum có sẵn.
    connect_btn = page.get_by_text(re.compile(r"(Connect Wallet|Kết nối ví|Đăng nhập|Login)", re.IGNORECASE)).first
    if await connect_btn.is_visible():
        await connect_btn.click()
        print("Đã nhấp 'Connect Wallet'.")
        # Chờ load cập nhật User Profile
        await page.wait_for_timeout(2000)

    # Nếu Frontend yêu cầu nhập Username truyền thống cho Web2 compatibility fallback
    input_username = page.locator('input[placeholder="Username"]')
    if await input_username.is_visible():
        print("Nhận diện form login Web2. Điền thông tin Mock...")
        await input_username.fill("user1")
        await page.locator('input[type="password"]').fill("password")
        await page.get_by_role("button", name=re.compile("Đăng nhập|Login")).click()
        await page.wait_for_timeout(2000)

    # 2. Tìm và Chọn Sách
    print("Chuyển tới Dashboard / Trang chủ tìm sách...")
    
    await page.wait_for_timeout(2000)

    # Tìm danh sách thẻ sách (ví dụ: các the chứa "Chi tiết", "Thuê ngay")
    book_card_btn = page.get_by_role("button", name="🛒 Chọn").first
    if await book_card_btn.is_visible():
         print("Nhận diện thẻ sách có sẵn, nhấp vào thẻ đầu tiên.")
         await book_card_btn.click()
         await page.wait_for_timeout(1000)
    else:
         print("❌ Không tìm thấy Sách nào hiển thị trên màn hình. DOM rỗng.")
         # Chụp ảnh báo lỗi
         await page.screenshot(path="test-output/error_no_books.png")
         await browser.close()
         return

    # 3. Ký hợp đồng & Thanh toán (Check luồng Contract Preview / Action)
    await page.wait_for_timeout(3000)
    print("Trang Chi Tiết: Nhấp tiến hành Thuê (Request Rent).")
    
    # Ở phiên bản hiện tại, Booking Controller sẽ gọi POST /api/booking => tạo ra Hợp đồng (PENDING_ACCEPTANCE)
    rent_action_btn = page.get_by_role("button", name="📝 Tạo Hợp Đồng Thuê").first
    if await rent_action_btn.is_visible():
        await rent_action_btn.click()
    
    await page.wait_for_timeout(4000)

    # Bước Chấp nhận hợp đồng (Ký tên và chuyển tiền) - Có thể chuyển sang route `/contract-preview`
    print("Màn hình Thanh toán / Ký hợp đồng On-chain.")
    sign_pay_btn = page.get_by_role("button", name=re.compile(r"Ký & Thanh Toán|Create Rental|Chấp nhận|Accept", re.IGNORECASE)).first
    
    if await sign_pay_btn.is_visible():
        await sign_pay_btn.click()
        print("Đã xác nhận thanh toán/Ký hợp đồng (Mocking Tx...).")
        
        # Chờ hệ thống backend phản hồi và UI cập nhật sang trạng thái Hoàn tất
        await page.wait_for_timeout(5000) 
        
        success_msg = page.get_by_text(re.compile(r"Thành công|Success|PAID|ACTIVE", re.IGNORECASE)).first
        if await success_msg.is_visible() or await page.url.endswith("dashboard"):
            print("✅ Flow cốt lõi Passed. Tx được Frontend chấp nhận.")
            import os
            os.makedirs("test-output", exist_ok=True)
            await page.screenshot(path="test-output/sc01_success.png")
        else:
            print("⚠️ Cảnh báo: Tx có thể đã chạy nhưng UI không báo Success Message rõ ràng.")
            await page.screenshot(path="test-output/sc01_warning_no_success_msg.png")
    else:
        print("❌ Không tìm thấy Nút Chấp nhận / Ký thanh toán.")
        await page.screenshot(path="test-output/error_no_sign_btn.png")

    # Hoàn thành
    await browser.close()
    print("Đóng phiên kiểm thử tự động.")

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

if __name__ == "__main__":
    asyncio.run(main())
