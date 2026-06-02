import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;

        // Reset
        setQuery('');

        // Detect Type
        // 1. Block Number (Numeric)
        if (/^\d+$/.test(q)) {
            navigate(`/explorer/block/${q}`);
            return;
        }

        // 2. Transaction Hash (66 chars, starts with 0x)
        if (ethers.isHexString(q, 32) || (q.length === 66 && q.startsWith('0x'))) {
            navigate(`/explorer/tx/${q}`);
            return;
        }

        // 3. Address (42 chars, starts with 0x)
        if (ethers.isAddress(q)) {
            navigate(`/explorer/address/${q}`);
            return;
        }

        // Default: Alert or Try as Tx Hash if possibly valid
        alert("Invalid Search Input. Enter a Block Number, Tx Hash, or Address.");
    };

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Address, Tx Hash, Block..."
                style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    fontSize: '16px',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            />
            <button
                type="submit"
                style={{
                    padding: '0 24px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontSize: '16px'
                }}
            >
                Search
            </button>
        </form>
    );
};

export default SearchBar;
