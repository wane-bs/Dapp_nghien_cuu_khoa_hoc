// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IFunctionsRouter} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";
import {FunctionsResponse} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsResponse.sol";

contract FunctionsRouterMock is IFunctionsRouter {
    event RequestSent(bytes32 indexed id);

    mapping(bytes32 => address) private s_requestClients;

    function sendRequest(
        uint64 subscriptionId,
        bytes calldata data,
        uint16 dataVersion,
        uint32 callbackGasLimit,
        bytes32 donId
    ) external override returns (bytes32) {
        bytes32 requestId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, data)
        );
        s_requestClients[requestId] = msg.sender;
        emit RequestSent(requestId);
        return requestId;
    }

    // Helper for local simulation
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        address client = s_requestClients[requestId];
        require(client != address(0), "Request ID not found");

        // Call handleOracleFulfillment on client
        (bool success, ) = client.call(
            abi.encodeWithSignature(
                "handleOracleFulfillment(bytes32,bytes,bytes)",
                requestId,
                response,
                err
            )
        );
        require(success, "Fulfill failed");
    }

    // Minimal implementation of other methods to satisfy interface
    function getAllowListId() external pure override returns (bytes32) {
        return bytes32(0);
    }

    function setAllowListId(bytes32) external override {}

    function getAdminFee() external pure override returns (uint72) {
        return 0;
    }

    function sendRequestToProposed(
        uint64,
        bytes calldata,
        uint16,
        uint32,
        bytes32
    ) external pure override returns (bytes32) {
        return bytes32(0);
    }

    function fulfill(
        bytes memory,
        bytes memory,
        uint96,
        uint96,
        address,
        FunctionsResponse.Commitment memory
    ) external pure override returns (FunctionsResponse.FulfillResult, uint96) {
        return (FunctionsResponse.FulfillResult.FULFILLED, 0);
    }

    function isValidCallbackGasLimit(uint64, uint32) external pure override {}

    function getContractById(bytes32) external pure override returns (address) {
        return address(0);
    }

    function getProposedContractById(
        bytes32
    ) external pure override returns (address) {
        return address(0);
    }

    function getProposedContractSet()
        external
        pure
        override
        returns (bytes32[] memory, address[] memory)
    {
        return (new bytes32[](0), new address[](0));
    }

    function proposeContractsUpdate(
        bytes32[] memory,
        address[] memory
    ) external override {}

    function updateContracts() external override {}

    function pause() external override {}

    function unpause() external override {}
}
