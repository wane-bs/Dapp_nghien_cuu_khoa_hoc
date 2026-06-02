// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IBookAsset.sol";

// Contract chính quản lý Rental Workflow
// Tuân thủ QUY_LUAT_TOI_CAO.md Section 5: Security & Access Control
// Bước 1 Fix: Thêm ReentrancyGuard theo Checks-Effects-Interactions pattern

error InvalidBookId();
error InvalidRentalStatus();
error NotAuthorized();
error BookNotVerifiedByAdmin();
error ExternalCallFailed();

contract VinaLibVault is
    FunctionsClient,
    AutomationCompatibleInterface,
    ReentrancyGuard,
    Ownable
{
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;

    struct LogData {
        string logContent;
        uint256 timestamp;
    }

    LogData[] public logs;
    bytes public lastUpkeepData;

    constructor(address router) FunctionsClient(router) Ownable(msg.sender) {
        // Initialize simple values
    }

    function setConfig(
        uint64 _subscriptionId,
        bytes32 _donId,
        uint32 _gasLimit
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        donId = _donId;
        gasLimit = _gasLimit;
    }

    // --- Chainlink Functions ---
    function sendRequest(
        string memory source,
        string[] memory args,
        bytes[] memory /* secrets */
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);

        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
    }

    event FunctionsRequestFulfilled(
        bytes32 indexed requestId,
        bytes response,
        bytes err
    );

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            // Handle error
        } else {
            logs.push(
                LogData({
                    logContent: string(response),
                    timestamp: block.timestamp
                })
            );
        }
        emit FunctionsRequestFulfilled(requestId, response, err);
    }

    // --- Chainlink Automation ---
    // To make checkUpkeep actually check rentals, it needs to iterate or have a way to query.
    // For this example, we'll assume a simple check for *any* pending return.
    // In a real scenario, a more efficient data structure (e.g., a queue of bookTokenIds needing attention)
    // would be used, or checkData would specify which bookTokenId to check.
    // For now, we'll make it return true if there's any active rental that has requested return.
    // This requires iterating over activeRentals, which is not directly possible with a mapping.
    // We'll add a simple array to track active rental IDs for iteration.
    uint256[] public activeRentalBookIds; // To allow iteration for checkUpkeep

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        for (uint256 i = 0; i < activeRentalBookIds.length; i++) {
            uint256 bookId = activeRentalBookIds[i];
            EvidencePack storage rental = activeRentals[bookId];
            if (rental.status == RentalStatus.ReturnRequested) {
                return (true, abi.encode(bookId, uint8(0)));
            } else if (
                rental.status == RentalStatus.Active &&
                block.timestamp > rental.expires
            ) {
                return (true, abi.encode(bookId, uint8(1)));
            }
        }
        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        // Decode the bookId from performData
        (uint256 bookId, uint8 upkeepType) = abi.decode(
            performData,
            (uint256, uint8)
        );

        EvidencePack storage rental = activeRentals[bookId];

        if (upkeepType == 0) {
            if (rental.status != RentalStatus.ReturnRequested)
                revert InvalidRentalStatus();
            // Typically trigger external service via Chainlink
        } else if (upkeepType == 1) {
            if (rental.status != RentalStatus.Active)
                revert InvalidRentalStatus();

            // Clear user rights on BookAsset
            IBookAsset(bookAssetAddress).setUser(bookId, address(0), 0);

            // Verify return as NOT damaged
            IBookAsset(bookAssetAddress).verifyReturn(bookId, false);

            rental.status = RentalStatus.Concluded;

            for (uint256 i = 0; i < activeRentalBookIds.length; i++) {
                if (activeRentalBookIds[i] == bookId) {
                    activeRentalBookIds[i] = activeRentalBookIds[
                        activeRentalBookIds.length - 1
                    ];
                    activeRentalBookIds.pop();
                    break;
                }
            }

            emit RentalConcluded(
                bookId,
                rental.renter,
                block.timestamp,
                false,
                "Auto-concluded due to timeout"
            );
        }

        lastUpkeepData = performData;
        emit UpkeepPerformed(bookId, rental.renter, rental.status);
    }

    event UpkeepPerformed(
        uint256 indexed bookId,
        address indexed renter,
        RentalStatus status
    );

    // --- Business Logic (RentalManager) ---

    // External contracts
    address public bookAssetAddress;
    address public rentalSBTAddress;

    // Bước 2 Fix: Storage Optimization — slot-packing
    // Slot 1: termsHash (bytes32 = 32 bytes)
    // Slot 2: deliveryHash (bytes32 = 32 bytes)
    // Slot 3: renter (address 20) + version (uint16 2) + status (enum/uint8 1) = 23 bytes → 1 slot
    // Slot 4: timestamp (uint256 = 32 bytes)
    // Slot 5+: pspRef (string = dynamic, pointer 32 bytes)
    struct EvidencePack {
        bytes32 termsHash; // Slot 1
        bytes32 deliveryHash; // Slot 2
        address renter; // Slot 3 (20 bytes)
        uint16 version; // Slot 3 (2 bytes)
        RentalStatus status; // Slot 3 (1 byte)
        uint64 timestamp; // Slot 4 (8 bytes)
        uint64 expires; // Slot 4 (8 bytes)
        string pspRef; // Slot 5+ (dynamic)
    }

    enum RentalStatus {
        Active,
        ReturnRequested,
        Concluded
    }

    mapping(uint256 => EvidencePack) public activeRentals;
    mapping(uint256 => uint256) public rentalToSBT; // bookTokenId => SBT ID

    function verifyBookForListing(uint256 bookTokenId) external onlyOwner {
        IBookAsset(bookAssetAddress).verifyForListing(bookTokenId);
    }

    function setContracts(
        address _bookAsset,
        address _rentalSBT
    ) external onlyOwner {
        bookAssetAddress = _bookAsset;
        rentalSBTAddress = _rentalSBT;
    }

    // 1. Initiate Rental
    // Updated: Require book đã được Admin verify trước khi cho thuê
    // Tuân thủ QUY_LUAT Section 5: Two-way Confirmation
    function createRental(
        address user,
        uint256 bookTokenId,
        uint64 duration,
        bytes32 termsHash,
        uint16 version,
        string memory pspRef,
        uint256 existingSbtId // Added existingSbtId
    ) external nonReentrant {
        if (msg.sender != user) revert NotAuthorized();

        // 0. Verify book đã được Admin xác nhận
        if (!IBookAsset(bookAssetAddress).isVerified(bookTokenId))
            revert BookNotVerifiedByAdmin();

        // 1. Associate with existing Legal Proof (SBT)
        // Removed SBT minting. Now expects an existing SBT ID.
        rentalToSBT[bookTokenId] = existingSbtId;

        // 2. Mark book as Rented
        IBookAsset(bookAssetAddress).markAsRented(bookTokenId);

        // 3. Grant Usage Rights (User) on BookAsset
        uint64 expires = uint64(block.timestamp + duration);
        IBookAsset(bookAssetAddress).setUser(bookTokenId, user, expires);

        // 4. Store Evidence
        activeRentals[bookTokenId] = EvidencePack({
            termsHash: termsHash,
            deliveryHash: bytes32(0),
            renter: user,
            version: version,
            status: RentalStatus.Active,
            timestamp: uint64(block.timestamp),
            expires: expires,
            pspRef: pspRef
        });

        // Add bookId to the list for upkeep checks
        activeRentalBookIds.push(bookTokenId);

        emit RentalCreated(
            user,
            bookTokenId,
            expires,
            termsHash,
            version,
            pspRef,
            existingSbtId // Added existingSbtId to event
        );
    }

    event RentalCreated(
        address indexed user,
        uint256 indexed bookId,
        uint64 expires,
        bytes32 termsHash,
        uint16 version,
        string pspRef,
        uint256 sbtId // Added sbtId to event
    );

    // 2. Request Return (Two-way Confirmation Step 1)
    function requestReturn(
        uint256 bookTokenId,
        bytes32 deliveryHash
    ) external nonReentrant {
        EvidencePack storage rental = activeRentals[bookTokenId];
        if (rental.status != RentalStatus.Active) revert InvalidRentalStatus();
        if (msg.sender != rental.renter && msg.sender != owner())
            revert NotAuthorized();

        rental.deliveryHash = deliveryHash;
        rental.status = RentalStatus.ReturnRequested;

        emit ReturnRequested(bookTokenId, msg.sender, deliveryHash);
    }

    event ReturnRequested(
        uint256 indexed bookId,
        address indexed renter,
        bytes32 deliveryHash
    );

    // 3. Confirm Return (Two-way Confirmation Step 2)
    // Updated: Gọi verifyReturn trên BookAsset để cập nhật status
    function confirmReturn(
        uint256 bookTokenId,
        bool isDamaged,
        string memory notes
    ) external onlyOwner nonReentrant {
        EvidencePack storage rental = activeRentals[bookTokenId];
        if (
            rental.status != RentalStatus.ReturnRequested &&
            rental.status != RentalStatus.Active
        ) revert InvalidRentalStatus();

        // Clear user rights on BookAsset
        IBookAsset(bookAssetAddress).setUser(bookTokenId, address(0), 0);

        // Verify return và update book status
        IBookAsset(bookAssetAddress).verifyReturn(bookTokenId, isDamaged);

        rental.status = RentalStatus.Concluded;

        // Remove bookId from activeRentalBookIds array
        for (uint256 i = 0; i < activeRentalBookIds.length; i++) {
            if (activeRentalBookIds[i] == bookTokenId) {
                activeRentalBookIds[i] = activeRentalBookIds[
                    activeRentalBookIds.length - 1
                ];
                activeRentalBookIds.pop();
                break;
            }
        }

        emit RentalConcluded(
            bookTokenId,
            rental.renter,
            block.timestamp,
            isDamaged,
            notes
        );
    }

    event RentalConcluded(
        uint256 indexed bookId,
        address indexed renter,
        uint256 timestamp,
        bool isDamaged,
        string notes
    );

    // === Bước 1 Fix: cancelListing — Lessor/Admin hủy listing ===
    // Cho phép hủy rental đang Active (chưa có return request)
    function cancelListing(
        uint256 bookTokenId
    ) external onlyOwner nonReentrant {
        EvidencePack storage rental = activeRentals[bookTokenId];
        if (rental.status != RentalStatus.Active) revert InvalidRentalStatus();

        // Clear user rights on BookAsset
        IBookAsset(bookAssetAddress).setUser(bookTokenId, address(0), 0);

        // Verify return to restore book status
        IBookAsset(bookAssetAddress).verifyReturn(bookTokenId, false);

        rental.status = RentalStatus.Concluded;

        // Remove from activeRentalBookIds
        for (uint256 i = 0; i < activeRentalBookIds.length; i++) {
            if (activeRentalBookIds[i] == bookTokenId) {
                activeRentalBookIds[i] = activeRentalBookIds[
                    activeRentalBookIds.length - 1
                ];
                activeRentalBookIds.pop();
                break;
            }
        }

        emit RentalCancelled(bookTokenId, rental.renter, block.timestamp);
    }

    event RentalCancelled(
        uint256 indexed bookId,
        address indexed renter,
        uint256 timestamp
    );

    // === Bước 1 Fix: claimCollateral — Admin xử lý DISPUTE → LIQUIDATED ===
    // Dành cho trường hợp người thuê vi phạm nghiêm trọng (mất sách, hư hại nặng)
    function claimCollateral(
        uint256 bookTokenId,
        string memory reason
    ) external onlyOwner nonReentrant {
        EvidencePack storage rental = activeRentals[bookTokenId];
        if (
            rental.status != RentalStatus.Active &&
            rental.status != RentalStatus.ReturnRequested
        ) revert InvalidRentalStatus();

        // Clear user rights
        IBookAsset(bookAssetAddress).setUser(bookTokenId, address(0), 0);

        // Mark book as damaged (PendingVerification)
        IBookAsset(bookAssetAddress).verifyReturn(bookTokenId, true);

        rental.status = RentalStatus.Concluded;

        // Remove from activeRentalBookIds
        for (uint256 i = 0; i < activeRentalBookIds.length; i++) {
            if (activeRentalBookIds[i] == bookTokenId) {
                activeRentalBookIds[i] = activeRentalBookIds[
                    activeRentalBookIds.length - 1
                ];
                activeRentalBookIds.pop();
                break;
            }
        }

        emit CollateralClaimed(
            bookTokenId,
            rental.renter,
            block.timestamp,
            reason
        );
    }

    event CollateralClaimed(
        uint256 indexed bookId,
        address indexed renter,
        uint256 timestamp,
        string reason
    );

    // === Bước 3 Fix: View Functions cho Frontend ===

    /// @notice Tính thời gian thuê còn lại (seconds)
    /// @return seconds còn lại, 0 nếu đã hết hạn hoặc không có rental
    function calculateRemainingTime(
        uint256 bookTokenId
    ) external view returns (uint256) {
        EvidencePack storage rental = activeRentals[bookTokenId];
        if (
            rental.renter == address(0) || rental.status != RentalStatus.Active
        ) {
            return 0;
        }

        // Query userExpires từ BookAsset
        uint256 expires;
        try IBookAsset(bookAssetAddress).userExpires(bookTokenId) returns (
            uint256 _expires
        ) {
            expires = _expires;
        } catch {
            return 0;
        }

        if (block.timestamp >= expires) return 0;
        return expires - block.timestamp;
    }

    /// @notice Kiểm tra sách có sẵn sàng để thuê không
    /// @return true nếu không có active rental cho bookTokenId này
    function isAvailable(uint256 bookTokenId) external view returns (bool) {
        EvidencePack storage rental = activeRentals[bookTokenId];
        // Sách available nếu không có rental hoặc rental đã concluded
        return
            rental.renter == address(0) ||
            rental.status == RentalStatus.Concluded;
    }

    /// @notice Lấy toàn bộ thông tin rental
    /// @param bookTokenId Token ID của sách
    /// @return termsHash Hash điều khoản hợp đồng
    /// @return deliveryHash Hash biên bản giao nhận
    /// @return renter Địa chỉ người thuê
    /// @return version Phiên bản hợp đồng
    /// @return status Trạng thái rental
    /// @return timestamp Thời điểm tạo
    /// @return pspRef Payment Service Provider Reference
    function getRentalInfo(
        uint256 bookTokenId
    )
        external
        view
        returns (
            bytes32 termsHash,
            bytes32 deliveryHash,
            address renter,
            uint16 version,
            RentalStatus status,
            uint256 timestamp,
            string memory pspRef
        )
    {
        EvidencePack storage rental = activeRentals[bookTokenId];
        return (
            rental.termsHash,
            rental.deliveryHash,
            rental.renter,
            rental.version,
            rental.status,
            rental.timestamp,
            rental.pspRef
        );
    }
}
