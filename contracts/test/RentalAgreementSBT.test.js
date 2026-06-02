/**
 * Unit Tests: RentalAgreementSBT.sol (Soulbound Token)
 * 
 * Tái hiện yêu cầu từ hợp đồng pháp lý:
 * - Điều 11: termsHash + version gắn với token
 * - Phụ lục 5: Evidence Pack - lưu termsHash
 * - Soulbound: KHÔNG thể chuyển nhượng (transfer)
 * 
 * Từ định hướng hợp đồng.md:
 * - Lớp Chứng chỉ (Legal Layer - RentalAgreementSBT)
 * - Chặn hàm transfer qua ghi đè _update
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RentalAgreementSBT (Soulbound Token)", function () {
    let rentalSBT;
    let owner, renter, other;

    // Giả lập termsHash từ hợp đồng pháp lý
    const mockTermsHash = ethers.keccak256(ethers.toUtf8Bytes("Rental Agreement v1.0 - termsHash"));

    beforeEach(async function () {
        [owner, renter, other] = await ethers.getSigners();

        const RentalAgreementSBT = await ethers.getContractFactory("RentalAgreementSBT");
        rentalSBT = await RentalAgreementSBT.deploy();
        await rentalSBT.waitForDeployment();
    });

    describe("Minting (Điều 11 - Ký kết hợp đồng)", function () {
        it("Owner có thể mint SBT cho renter với termsHash", async function () {
            await rentalSBT.safeMint(renter.address, mockTermsHash);

            expect(await rentalSBT.ownerOf(0)).to.equal(renter.address);
            expect(await rentalSBT.rentalTerms(0)).to.equal(mockTermsHash);
        });

        it("Non-owner KHÔNG thể mint", async function () {
            await expect(
                rentalSBT.connect(other).safeMint(renter.address, mockTermsHash)
            ).to.be.revertedWith("Not authorized");
        });

        it("Có thể mint nhiều SBT cho cùng một người (nhiều hợp đồng)", async function () {
            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Contract 1"));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Contract 2"));

            await rentalSBT.safeMint(renter.address, hash1);
            await rentalSBT.safeMint(renter.address, hash2);

            expect(await rentalSBT.balanceOf(renter.address)).to.equal(2);
            expect(await rentalSBT.rentalTerms(0)).to.equal(hash1);
            expect(await rentalSBT.rentalTerms(1)).to.equal(hash2);
        });
    });

    describe("Soulbound Logic (Định hướng - Cấm chuyển nhượng)", function () {
        beforeEach(async function () {
            await rentalSBT.safeMint(renter.address, mockTermsHash);
        });

        it("KHÔNG thể transfer SBT", async function () {
            await expect(
                rentalSBT.connect(renter).transferFrom(renter.address, other.address, 0)
            ).to.be.revertedWith("SBT: Token is Soulbound and cannot be transferred");
        });

        it("KHÔNG thể safeTransferFrom SBT", async function () {
            await expect(
                rentalSBT.connect(renter)["safeTransferFrom(address,address,uint256)"](
                    renter.address, other.address, 0
                )
            ).to.be.revertedWith("SBT: Token is Soulbound and cannot be transferred");
        });

        it("KHÔNG thể approve rồi transfer", async function () {
            await rentalSBT.connect(renter).approve(other.address, 0);

            await expect(
                rentalSBT.connect(other).transferFrom(renter.address, other.address, 0)
            ).to.be.revertedWith("SBT: Token is Soulbound and cannot be transferred");
        });
    });

    describe("Evidence Pack (Phụ lục 5 - Gói chứng cứ)", function () {
        it("termsHash được lưu chính xác và không thể thay đổi", async function () {
            await rentalSBT.safeMint(renter.address, mockTermsHash);

            const storedHash = await rentalSBT.rentalTerms(0);
            expect(storedHash).to.equal(mockTermsHash);

            // Không có function để update termsHash (immutable evidence)
        });

        it("termsHash phân biệt được các hợp đồng khác nhau", async function () {
            // Phí thuê/ngày: x VND, Đặt cọc: y VND, Phí trễ: z VND
            const contract1 = JSON.stringify({
                rentalFeePerDay: 50000, // x = 50,000 VND
                deposit: 200000,        // y = 200,000 VND
                lateFeePerDay: 10000,   // z = 10,000 VND
                listingId: "book-001"
            });

            const contract2 = JSON.stringify({
                rentalFeePerDay: 75000, // x = 75,000 VND (khác)
                deposit: 300000,        // y = 300,000 VND
                lateFeePerDay: 15000,   // z = 15,000 VND
                listingId: "book-002"
            });

            const hash1 = ethers.keccak256(ethers.toUtf8Bytes(contract1));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes(contract2));

            await rentalSBT.safeMint(renter.address, hash1);
            await rentalSBT.safeMint(other.address, hash2);

            expect(await rentalSBT.rentalTerms(0)).to.not.equal(await rentalSBT.rentalTerms(1));
        });
    });

    describe("Token Metadata", function () {
        it("Contract có tên và symbol đúng", async function () {
            expect(await rentalSBT.name()).to.equal("Rental Agreement License");
            expect(await rentalSBT.symbol()).to.equal("RAL");
        });
    });

    describe("Configurable Parameters (x, y, z - Phụ lục 1)", function () {
        /**
         * Tham số ẩn có thể lựa chọn khi ký:
         * - x: Phí thuê/ngày (VND)
         * - y: Đặt cọc (VND)
         * - z: Phí trễ/ngày (VND)
         * 
         * Các tham số này được encode trong termsHash
         */
        it("Các tham số x, y, z được hash cùng với hợp đồng", async function () {
            const params = {
                x_rentalFee: 50000,   // Phí thuê/ngày
                y_deposit: 200000,    // Đặt cọc
                z_lateFee: 10000,     // Phí trễ/ngày
                a_damage1: 10,        // Mức 1: trừ 10% cọc
                b_damage2: 30,        // Mức 2: trừ 30% cọc  
                c_damage3: 70,        // Mức 3: trừ 70% cọc
                version: "1.0",
                listingId: "listing-123",
                rentalId: "rental-456"
            };

            const termsHash = ethers.keccak256(
                ethers.toUtf8Bytes(JSON.stringify(params))
            );

            await rentalSBT.safeMint(renter.address, termsHash);

            // Hash được lưu, off-chain có thể verify bằng cách hash lại params
            const storedHash = await rentalSBT.rentalTerms(0);
            expect(storedHash).to.equal(termsHash);
        });
    });
});
