import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Signer, ethers } from 'ethers';

interface Web3ContextType {
    provider: BrowserProvider | null;
    signer: Signer | null;
    address: string | null;
    network: ethers.Network | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [network, setNetwork] = useState<ethers.Network | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            const _provider = new BrowserProvider(window.ethereum as any);
            setProvider(_provider);

            const handleAccountsChanged = async (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    const _signer = await _provider.getSigner();
                    setSigner(_signer);
                } else {
                    disconnectWallet();
                }
            };

            const handleChainChanged = () => {
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum || !provider) {
            alert("Please install MetaMask!");
            return;
        }

        setIsConnecting(true);
        try {
            await provider.send("eth_requestAccounts", []);
            const _signer = await provider.getSigner();
            const _address = await _signer.getAddress();
            const _network = await provider.getNetwork();

            setSigner(_signer);
            setAddress(_address);
            setNetwork(_network);
        } catch (error) {
            console.error("Wallet connection failed:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setSigner(null);
        setAddress(null);
        setNetwork(null);
    };

    return (
        <Web3Context.Provider value={{ provider, signer, address, network, connectWallet, disconnectWallet, isConnecting }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);
