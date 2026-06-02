/**
 * Unit Tests: VinaLibVault.sol (Core Ledger & Evidence Store)
 * 
 * Updated: Them Book Verification requirement
 * - Sach phai duoc Admin verify truoc khi tao rental
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VinaLibVault (Core Ledger)", function () {
    let vinaLibVault, bookAsset, rentalSBT;
    let owner, lender, renter, other;

    const mockRouterAddress = "0x0000000000000000000000000000000000000001";
    const ipfs = require("../../IPFS/ipfs_simulator.js");
    let testCID;

    const contractParams = {
        x_rentalFeePerDay: 50000,
        y_deposit: 200000,
        z_lateFeePerDay: 10000,
        version: 1
    };

    beforeEach(async function () {
        [owner, lender, renter, other] = await ethers.getSigners();
        testCID = ipfs.generateCIDv1(Buffer.from(JSON.stringify({ title: "VinaLibVault Test Book" })));

        const BookAsset = await ethers.getContractFactory("BookAsset");
        bookAsset = await BookAsset.deploy();
        await bookAsset.waitForDeployment();

        const RentalAgreementSBT = await ethers.getContractFactory("RentalAgreementSBT");
        rentalSBT = await RentalAgreementSBT.deploy();
        await rentalSBT.waitForDeployment();

        const VinaLibVault = await ethers.getContractFactory("VinaLibVault");
        vinaLibVault = await VinaLibVault.deploy(mockRouterAddress);
        await vinaLibVault.waitForDeployment();

        await vinaLibVault.setContracts(
            await bookAsset.getAddress(),
            await rentalSBT.getAddress()
        );

        await bookAsset.transferOwnership(await vinaLibVault.getAddress());
        await rentalSBT.transferOwnership(await vinaLibVault.getAddress());
    });

    async function setupMintedBook() {
        const BookAsset = await ethers.getContractFactory("BookAsset");
        const freshBookAsset = await BookAsset.deploy();
        await freshBookAsset.waitForDeployment();

        // Deploy fresh SBT contract (so we can mint before transferring ownership)
        const RentalAgreementSBT = await ethers.getContractFactory("RentalAgreementSBT");
        const freshRentalSBT = await RentalAgreementSBT.deploy();
        await freshRentalSBT.waitForDeployment();
        rentalSBT = freshRentalSBT; // Update shared ref

        await freshBookAsset.safeMint(lender.address, testCID);
        await freshBookAsset.connect(lender).approve(await vinaLibVault.getAddress(), 0);

        // ADMIN: Verify sach truoc khi cho thue
        await freshBookAsset.verifyForListing(0);

        // CF-1: Pre-mint SBT truoc khi transfer ownership
        const termsHashForSBT = ethers.keccak256(ethers.toUtf8Bytes("pre-mint"));
        await freshRentalSBT.safeMint(renter.address, termsHashForSBT);
        // SBT ID = 0 (first mint)

        await freshBookAsset.transferOwnership(await vinaLibVault.getAddress());
        await freshRentalSBT.transferOwnership(await vinaLibVault.getAddress());

        await vinaLibVault.setContracts(
            await freshBookAsset.getAddress(),
            await freshRentalSBT.getAddress()
        );

        return freshBookAsset;
    }

    describe("Contract Configuration", function () {
        it("Owner co the set contract addresses", async function () {
            expect(await vinaLibVault.bookAssetAddress()).to.equal(await bookAsset.getAddress());
        });
    });

    describe("createRental() - Ky ket & Kich hoat", function () {
        let freshBookAsset;

        beforeEach(async function () {
            freshBookAsset = await setupMintedBook();
        });

        it("Owner co the tao rental voi sach da verified", async function () {
            const duration = 7 * 24 * 60 * 60;
            const termsHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(contractParams)));

            // CF-1: Pass existingSbtId = 0 (pre-minted in setupMintedBook)
            await vinaLibVault.connect(renter).createRental(
                renter.address, 0, duration, termsHash, 1, "PSP-123", 0
            );

            expect(await rentalSBT.ownerOf(0)).to.equal(renter.address);

            const rental = await vinaLibVault.activeRentals(0);
            expect(rental.termsHash).to.equal(termsHash);
            expect(rental.status).to.equal(0);
        });

        it("Non-owner KHONG the tao rental", async function () {
            const termsHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

            await expect(
                vinaLibVault.connect(other).createRental(
                    renter.address, 0, 86400, termsHash, 1, "psp-123", 0
                )
            ).to.be.revertedWithCustomError(vinaLibVault, "NotAuthorized");
        });
    });

    describe("Book Verification Required", function () {
        it("KHONG the tao rental neu sach chua verified", async function () {
            const BookAsset = await ethers.getContractFactory("BookAsset");
            const unverifiedBook = await BookAsset.deploy();
            await unverifiedBook.waitForDeployment();

            await unverifiedBook.safeMint(lender.address, testCID);
            await unverifiedBook.connect(lender).approve(await vinaLibVault.getAddress(), 0);
            await unverifiedBook.transferOwnership(await vinaLibVault.getAddress());

            await vinaLibVault.setContracts(
                await unverifiedBook.getAddress(),
                await rentalSBT.getAddress()
            );

            const termsHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

            await expect(
                vinaLibVault.connect(renter).createRental(renter.address, 0, 86400, termsHash, 1, "psp", 0)
            ).to.be.revertedWithCustomError(vinaLibVault, "BookNotVerifiedByAdmin");
        });
    });

    describe("requestReturn() - Two-way Step 1", function () {
        let freshBookAsset;

        beforeEach(async function () {
            freshBookAsset = await setupMintedBook();
            const termsHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
            await vinaLibVault.connect(renter).createRental(renter.address, 0, 86400, termsHash, 1, "psp-123", 0);
        });

        it("Renter co the yeu cau tra sach", async function () {
            const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery"));
            await vinaLibVault.connect(renter).requestReturn(0, deliveryHash);

            const rental = await vinaLibVault.activeRentals(0);
            expect(rental.status).to.equal(1);
        });

        it("Nguoi khac KHONG the goi requestReturn", async function () {
            const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery"));

            await expect(
                vinaLibVault.connect(other).requestReturn(0, deliveryHash)
            ).to.be.revertedWithCustomError(vinaLibVault, "NotAuthorized");
        });
    });

    describe("confirmReturn() - Two-way Step 2", function () {
        let freshBookAsset;

        beforeEach(async function () {
            freshBookAsset = await setupMintedBook();
            const termsHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
            await vinaLibVault.connect(renter).createRental(renter.address, 0, 86400, termsHash, 1, "psp-123", 0);
            const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery"));
            await vinaLibVault.connect(renter).requestReturn(0, deliveryHash);
        });

        it("Owner co the confirm return", async function () {
            await vinaLibVault.confirmReturn(0, false, "OK");

            const rental = await vinaLibVault.activeRentals(0);
            expect(rental.status).to.equal(2);
        });

        it("Non-owner KHONG the confirm return", async function () {
            await expect(
                vinaLibVault.connect(other).confirmReturn(0, false, "")
            ).to.be.revertedWithCustomError(vinaLibVault, "OwnableUnauthorizedAccount");
        });
    });

    describe("Full Rental Flow", function () {
        it("Hoan thanh quy trinh: Create - Request - Confirm", async function () {
            const freshBookAsset = await setupMintedBook();

            const termsHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(contractParams)));
            const duration = 7 * 24 * 60 * 60;

            await vinaLibVault.connect(renter).createRental(renter.address, 0, duration, termsHash, 1, "PSP-VCB-123", 0);

            const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes("delivery"));
            await vinaLibVault.connect(renter).requestReturn(0, deliveryHash);

            await vinaLibVault.confirmReturn(0, false, "OK");

            const rental = await vinaLibVault.activeRentals(0);
            expect(rental.status).to.equal(2);
        });
    });
});
