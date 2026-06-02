import React from 'react';

interface SplitLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ left, right }) => {
    return (
        <div className="page-container">
            <div className="left-panel">
                {left}
            </div>
            <div className="right-panel">
                {right}
            </div>
        </div>
    );
};

export default SplitLayout;
