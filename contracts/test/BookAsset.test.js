/**
 * Unit Tests: BookAsset.sol (ERC-4907 Rentable NFT)
 * 
 * Tái hiện yêu cầu từ hợp đồng pháp lý:
 * - Điều 3: Thời hạn thuê [start] đến [end]
 * - setUser(tokenId, user, expires): Thiết lập quyền sử dụng
 * - userOf(tokenId): Truy vấn người thuê hiện tại
 * - Quyền tự động hết hạn khi block.timestamp > expires
 * 
 * Điều 10: Kill Switch (Pausable)
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BookAsset (ERC-4907)", function () {
    let bookAsset;
    let owner, lender, renter, other;
    const ipfs = require("../../IPFS/ipfs_simulator.js");
    let testCID;

    beforeEach(async function () {
        [owner, lender, renter, other] = await ethers.getSigners();
        testCID = ipfs.generateCIDv1(Buffer.from(JSON.stringify({ title: "BookAsset Test Book" })));

        const BookAsset = await ethers.getContractFactory("BookAsset");
        bookAsset = await BookAsset.deploy();
        await bookAsset.waitForDeployment();
    });

    describe("Minting (Điều 1 - Đăng ký tài sản)", function () {
        it("Owner có thể mint sách mới với CID", async function () {
            await bookAsset.safeMint(lender.address, testCID);

            expect(await bookAsset.ownerOf(0)).to.equal(lender.address);
            expect(await bookAsset.tokenCIDs(0)).to.equal(testCID);
        });

        it("Non-owner KHÔNG thể mint", async function () {
            await expect(
                bookAsset.connect(other).safeMint(lender.address, testCID)
            ).to.be.revertedWithCustomError(bookAsset, "OwnableUnauthorizedAccount");
        });

        it("Token URI trả về đúng IPFS URL", async function () {
            await bookAsset.safeMint(lender.address, testCID);

            const uri = await bookAsset.tokenURI(0);
            expect(uri).to.equal("https://ipfs.io/ipfs/" + testCID);
        });
    });

    describe("Rental Rights (Điều 3 - Thời hạn thuê)", function () {
        beforeEach(async function () {
            // Mint một sách cho lender
            await bookAsset.safeMint(lender.address, testCID);
        });

        it("Owner có thể setUser cho renter với thời hạn", async function () {
            const duration = 7 * 24 * 60 * 60; // 7 ngày
            const currentBlock = await ethers.provider.getBlock("latest");
            const expires = currentBlock.timestamp + duration;

            // Lender approve owner trước (trong thực tế, VinaLibVault sẽ làm điều này)
            await bookAsset.connect(lender).approve(owner.address, 0);
            await bookAsset.setUser(0, renter.address, expires);

            expect(await bookAsset.userOf(0)).to.equal(renter.address);
        });

        it("userOf trả về address(0) sau khi expires hết hạn", async function () {
            const currentBlock = await ethers.provider.getBlock("latest");
            const expires = currentBlock.timestamp + 1; // 1 giây

            await bookAsset.connect(lender).approve(owner.address, 0);
            await bookAsset.setUser(0, renter.address, expires);

            // Mine block mới với timestamp vượt expires
            await ethers.provider.send("evm_increaseTime", [10]);
            await ethers.provider.send("evm_mine");

            expect(await bookAsset.userOf(0)).to.equal(ethers.ZeroAddress);
        });

        it("Lender vẫn là owner trong khi renter có quyền sử dụng", async function () {
            const currentBlock = await ethers.provider.getBlock("latest");
            const expires = currentBlock.timestamp + 86400;

            await bookAsset.connect(lender).approve(owner.address, 0);
            await bookAsset.setUser(0, renter.address, expires);

            // Ownership không đổi
            expect(await bookAsset.ownerOf(0)).to.equal(lender.address);
            // User rights được gán
            expect(await bookAsset.userOf(0)).to.equal(renter.address);
        });
    });

    describe("Pausable (Điều 10 - Kill Switch)", function () {
        it("Owner có thể pause contract", async function () {
            await bookAsset.pause();
            expect(await bookAsset.paused()).to.be.true;
        });

        it("Không thể mint khi paused", async function () {
            await bookAsset.pause();

            await expect(
                bookAsset.safeMint(lender.address, testCID)
            ).to.be.revertedWithCustomError(bookAsset, "EnforcedPause");
        });

        it("Không thể transfer khi paused", async function () {
            await bookAsset.safeMint(lender.address, testCID);
            await bookAsset.pause();

            await expect(
                bookAsset.connect(lender).transferFrom(lender.address, other.address, 0)
            ).to.be.revertedWithCustomError(bookAsset, "EnforcedPause");
        });

        it("Owner có thể unpause và tiếp tục hoạt động", async function () {
            await bookAsset.pause();
            await bookAsset.unpause();

            await bookAsset.safeMint(lender.address, testCID);
            expect(await bookAsset.ownerOf(0)).to.equal(lender.address);
        });
    });

    describe("Token Transfer (Quyền sở hữu)", function () {
        beforeEach(async function () {
            await bookAsset.safeMint(lender.address, testCID);
        });

        it("Owner có thể transfer sách cho người khác", async function () {
            await bookAsset.connect(lender).transferFrom(lender.address, other.address, 0);
            expect(await bookAsset.ownerOf(0)).to.equal(other.address);
        });

        it("Sau khi transfer, user rights vẫn giữ nguyên", async function () {
            const currentBlock = await ethers.provider.getBlock("latest");
            const expires = currentBlock.timestamp + 86400;

            await bookAsset.connect(lender).approve(owner.address, 0);
            await bookAsset.setUser(0, renter.address, expires);

            // Transfer ownership
            await bookAsset.connect(lender).transferFrom(lender.address, other.address, 0);

            // User vẫn là renter
            expect(await bookAsset.userOf(0)).to.equal(renter.address);
        });
    });
});
