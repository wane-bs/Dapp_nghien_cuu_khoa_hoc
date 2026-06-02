backend - xây dựng quanh lý thuyết Vertical Slice Architecture (VSA) đề xuất tổ chức mã nguồn xoay quanh Tính năng (Feature)
 -Cấu trúc Thư mục Đề xuất: {
    /src
  /Bootstrapper            # Entry point, Composition Root
    - Program.cs / index.ts
    - Startup.cs           # Cấu hình DI, Middleware
    - AppSettings.json
  /BuildingBlocks          # (Shared Kernel) Thư viện kỹ thuật dùng chung
    /Logging
    /Auth
    /EventBus
    /Resiliency            # Retry policies, Circuit Breaker
  /Modules                 # Các Bounded Contexts
    /Catalog               # Module Quản lý Sản phẩm
      /Api                 # Public Contract (Controllers/Endpoints)
      /Application         # Use Cases (MediatR Handlers)
      /Domain              # Domain Models, Value Objects, Logic cốt lõi
      /Infrastructure      # DB Context, Repositories, External APIs
      /IntegrationEvents   # Events publish ra ngoài cho module khác [21]
    /Ordering              # Module Quản lý Đơn hàng
      /Features            # Áp dụng VSA bên trong Module
        /PlaceOrder        # Slice: Đặt hàng
          - PlaceOrderEndpoint.cs   # API Controller
          - PlaceOrderCommand.cs    # Input DTO
          - PlaceOrderHandler.cs    # Business Logic
          - PlaceOrderValidator.cs  # Validation Rules
          - OrderPlacedEvent.cs     # Domain Event
        /GetOrderDetails   # Slice: Xem chi tiết đơn
          - GetOrderDetailsQuery.cs
          - OrderDto.cs             # Specific Read Model
          - GetOrderDetailsHandler.cs
      /Domain              # Shared Domain Entities (Order, OrderItem)
      /Data                # EF Core Config / Dapper Scripts
 }


Frontend - xây dựng quanh lý thuyết Feature-Sliced Design (FSD) chia ứng dụng thành các Layers (Tầng), Slices (Lát cắt nghiệp vụ), và Segments (Phân đoạn kỹ thuật). Quy tắc quan trọng nhất là Hướng phụ thuộc một chiều: Layer trên chỉ được import từ Layer dưới, tuyệt đối không được import ngược lại hoặc import ngang hàng giữa các Slice (Cross-import).   
  -Cấu trúc Thư mục Đề xuất: {
  /src
  /app                  # Layer 1: Khởi tạo (Providers, Global Styles, Router)
    /providers          # Redux Store, ThemeProvider, QueryClient
    /styles
  /processes            # Layer 2: Quy trình nghiệp vụ phức tạp đa bước (Optional)
    /checkout-flow
    /auth-flow
  /pages                # Layer 3: Các trang đầy đủ (Composition Root cho UI)
    /home
    /product-detail
    /cart
  /widgets              # Layer 4: Các khối UI lớn, độc lập (Self-contained)
    /header
    /product-feed
    /sidebar-menu
  /features             # Layer 5: Chức năng nghiệp vụ người dùng (User Interactions)
    /auth-by-phone      # Slice: Đăng nhập bằng SĐT
      /ui               # Segment: UI Components (Form)
      /model            # Segment: State management logic
      /api              # Segment: API calls
    /add-to-cart        # Slice: Nút thêm vào giỏ
    /product-filter     # Slice: Bộ lọc sản phẩm
  /entities             # Layer 6: Business Entities (Hiển thị dữ liệu, ít logic tương tác)
    /user               # Entity User
      /ui               # UserAvatar, UserCard
      /model            # Types, Interfaces, Selectors
    /product            # Entity Product
      /ui               # ProductCard, PriceTag
  /shared               # Layer 7: Hạ tầng dùng chung (Không chứa Business Logic)
    /ui                 # UI Kit (Button, Input, Modal - Dumb components)
    /lib                # Helpers (date formatting, currency, validation)
    /api                # Base HTTP Client (Axios instance)
  }

quản trị dữ liệu áp dụng:
-   Chiến lược Lai (Hybrid Strategy) :   

    Core Transactional Data (Dữ liệu Giao dịch Cốt lõi): Giữ ở dạng chuẩn hóa cao (Normalized). Ví dụ: Bảng Orders, OrderItems, Inventory cần nhất quán tuyệt đối.

    Read-Heavy Data (Dữ liệu Đọc nhiều): Áp dụng Denormalization một cách chiến lược.

    Precomputed Fields: Lưu trữ sẵn các giá trị tính toán. Ví dụ: Trong bảng Products, lưu thêm cột TotalSales và AverageRating. Các cột này được cập nhật bất đồng bộ (qua Domain Events) mỗi khi có đơn hàng hoặc đánh giá mới. Điều này loại bỏ nhu cầu COUNT() và AVG() trên hàng triệu dòng khi hiển thị danh sách sản phẩm.

    Json Columns: Với các thuộc tính động của sản phẩm (Màu sắc, Kích thước, Cấu hình), thay vì tạo bảng EAV (Entity-Attribute-Value) phức tạp, hãy sử dụng cột JSONB trong PostgreSQL hoặc JSON trong MySQL để lưu trữ. Điều này giúp schema linh hoạt mà vẫn giữ được khả năng query (đặc biệt với PostgreSQL).   

    -   Ngưỡng Quyết định Denormalization :   

        Nếu tỷ lệ Read/Write > 100:1 -> Denormalize.

        Nếu yêu cầu độ trễ API < 10ms -> Denormalize hoặc dùng Caching.

        Nếu dữ liệu thay đổi tần suất cao (>10% daily) -> Normalize để tránh chi phí cập nhật quá lớn.