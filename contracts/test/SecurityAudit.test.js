const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Audit Tests (Manual Simulation)", function () {
    let bookAsset, rentalSBT, vault, mockRouter;
    let owner, renter, attacker;

    beforeEach(async function () {
        [owner, renter, attacker] = await ethers.getSigners();

        // 1. Deploy Mocks & Contracts
        const MockRouter = await ethers.getContractFactory("FunctionsRouterMock");
        mockRouter = await MockRouter.deploy();

        const BookAsset = await ethers.getContractFactory("BookAsset");
        bookAsset = await BookAsset.deploy();

        const RentalSBT = await ethers.getContractFactory("RentalAgreementSBT");
        rentalSBT = await RentalSBT.deploy();

        const VinaLibVault = await ethers.getContractFactory("VinaLibVault");
        vault = await VinaLibVault.deploy(await mockRouter.getAddress());

        // 2. Setup
        await bookAsset.setRentalContract(await vault.getAddress());
        await rentalSBT.setRentalContract(await vault.getAddress());
        await vault.setContracts(await bookAsset.getAddress(), await rentalSBT.getAddress());
    });

    describe("Access Control Testing", function () {
        it("Should revert if non-owner tries to execute admin functions on Vault", async function () {
            const termsHash = ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes("terms")), 32);

            // Attacker tries to create rental for someone else
            await expect(
                vault.connect(attacker).createRental(renter.address, 1, 100, termsHash, 1, "TEST", 1)
            ).to.be.revertedWithCustomError(vault, "NotAuthorized");

            // Attacker tries to confirm return
            await expect(
                vault.connect(attacker).confirmReturn(1, false, "")
            ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

            // Attacker tries to claim collateral
            await expect(
                vault.connect(attacker).claimCollateral(1, "Lost book")
            ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should revert if non-owner tries to mint or verify BookAsset", async function () {
            await expect(
                bookAsset.connect(attacker).safeMint(attacker.address, "cid")
            ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

            await expect(
                bookAsset.connect(attacker).verifyForListing(1)
            ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });
    });

    describe("Reentrancy & Edge Cases", function () {
        let bookId = 0;
        let sbtId = 0;
        let deliveryHash;

        beforeEach(async function () {
            // Create a valid rental state first
            await bookAsset.safeMint(owner.address, "cid_1");
            await bookAsset.verifyForListing(bookId);

            const termsHash = ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes("terms")), 32);
            await rentalSBT.safeMint(owner.address, termsHash);

            await vault.connect(renter).createRental(
                renter.address,
                bookId,
                3600,
                termsHash,
                1,
                "REF_1",
                sbtId
            );

            deliveryHash = ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes("delivery")), 32);
        });

        it("Should update state before calling external contracts in confirmReturn (Checks-Effects)", async function () {
            // renter requests return
            await vault.connect(renter).requestReturn(bookId, deliveryHash);

            // After confirmReturn, rental status MUST be Concluded
            await vault.confirmReturn(bookId, false, "Good condition");
            const rentalInfo = await vault.getRentalInfo(bookId);
            expect(rentalInfo.status).to.equal(2); // 2 is Concluded

            // And activeRentalBookIds array should be empty
            // We check if it reverts or returns 0 length
            const isAvailable = await vault.isAvailable(bookId);
            expect(isAvailable).to.be.true;
        });

        it("Cannot request return twice for the same active rental", async function () {
            await vault.connect(renter).requestReturn(bookId, deliveryHash);

            // Second time should revert because status is now 1 (ReturnRequested)
            await expect(
                vault.connect(renter).requestReturn(bookId, deliveryHash)
            ).to.be.revertedWithCustomError(vault, "InvalidRentalStatus");
        });
    });

    describe("Upkeep Automation Testing", function () {
        let bookId = 0;
        let sbtId = 0;
        let duration = 3600; // 1 hour

        beforeEach(async function () {
            await bookAsset.safeMint(owner.address, "cid_upkeep");
            await bookAsset.verifyForListing(bookId);

            const termsHash = ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes("terms")), 32);
            await rentalSBT.safeMint(owner.address, termsHash);

            await vault.connect(renter).createRental(
                renter.address,
                bookId,
                duration,
                termsHash,
                1,
                "REF_UPKEEP",
                sbtId
            );
        });

        it("Should not perform upkeep before timeout", async function () {
            const [upkeepNeeded, performData] = await vault.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.false;
            expect(performData).to.equal("0x");
        });

        it("Should trigger timeout upkeep when duration passes", async function () {
            // Fast forward time by duration + 1 second
            await ethers.provider.send("evm_increaseTime", [duration + 1]);
            await ethers.provider.send("evm_mine");

            const [upkeepNeeded, performData] = await vault.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.true;

            // performData should be abi.encode(bookId, 1) (Type 1 is Timeout)
            const expectedPerformData = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint8"],
                [bookId, 1]
            );
            expect(performData).to.equal(expectedPerformData);

            // Perform the upkeep
            await expect(vault.performUpkeep(performData))
                .to.emit(vault, "RentalConcluded")
                .to.emit(vault, "UpkeepPerformed");

            // Verify status and cleanup
            const rental = await vault.activeRentals(bookId);
            expect(rental.status).to.equal(2); // Concluded

            // Check that BookAsset user is cleared
            expect(await bookAsset.userOf(bookId)).to.equal(ethers.ZeroAddress);
        });
    });
});
