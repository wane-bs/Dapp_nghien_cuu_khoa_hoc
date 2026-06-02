/**
 * Legal Module - Contract Generation & Management
 * 
 * This module handles:
 * 1. Contract template generation with placeholder filling
 * 2. Accept/Reject flow for contract previews
 * 3. TTL storage for testing phase
 * 
 * Exports:
 * - contractController: Express router for /api/contracts routes
 * - contractGenerator: Core generator functions
 * - tempStore: In-memory TTL storage
 */

const contractController = require('./contract.controller');
const contractGenerator = require('./contract.generator');
const tempStore = require('./tempStore');

module.exports = {
    contractController,
    contractGenerator,
    tempStore
};
