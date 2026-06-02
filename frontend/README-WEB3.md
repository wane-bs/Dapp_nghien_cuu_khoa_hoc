# Web3 Integration Layer

Thư mục này được sinh ra tự động bởi `QuyTrinhTichHopGiaoDien.md` ở Bước 3 (`MODE_REFACTOR`). Nó cung cấp các công cụ để giao tiếp với Smart Contracts của VinaLib.

## Cấu trúc Cốt lõi
- `config.ts`: Chứa địa chỉ Deploy (yêu cầu cập nhật khi deploy lên mạng thực tế) và Human-Readable ABI được trích xuất từ Bước 3 của Giai đoạn Phân tích.
- `Web3Provider.tsx`: React Context bọc toàn app (hoặc các tuyến điểm cần gọi Blockchain). Quản lý tiêm ví (MetaMask), `Provider`, `Signer` (chuẩn Ethers v6).
- `ContractService.ts`: Class Service trừu tượng hóa các gọi hàm đến Smart Contracts: `VinaLibVault`, `BookAsset`, `RentalAgreementSBT`.

## Hướng dẫn Sử dụng (Bước 4: Đồng bộ trạng thái)
1. **Bọc App bằng Web3Provider** (tại `src/index.tsx`)
2. **Gọi Wallet Connect** ở các nút bấm Login/Connect:
```tsx
import { useWeb3 } from '../shared/web3/Web3Provider';

const Navbar = () => {
  const { connectWallet, address } = useWeb3();
  return <button onClick={connectWallet}>{address ? "Connected" : "Connect MetaMask"}</button>
}
```
3. **Thực thi Giao dịch** với `ContractService`:
```tsx
import { useWeb3 } from '../shared/web3/Web3Provider';
import { ContractService } from '../shared/web3/ContractService';

const { signer } = useWeb3();
const service = new ContractService(signer);

// Ví dụ yêu cầu trả sách:
await service.requestReturn(bookTokenId, deliveryHash);
```
