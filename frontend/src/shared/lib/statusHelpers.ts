export const getColor = (status: string) => {
    switch (status) {
        case 'PAID': return 'green';
        case 'RETURN_REQUESTED': return 'orange';
        case 'SIGNED_PENDING_APPROVAL': return 'blue';
        case 'COMPLETED': return 'gray';
        default: return 'black';
    }
};

export const getBadgeStyle = (status: string) => {
    let bg = '#eee';
    let color = '#333';
    switch (status) {
        case 'SIGNED_PENDING_APPROVAL': bg = '#e3f2fd'; color = '#1976d2'; break;
        case 'RETURN_REQUESTED': bg = '#fff3e0'; color = '#f57c00'; break;
        case 'PAID': bg = '#e8f5e9'; color = '#388e3c'; break;
        case 'COMPLETED': bg = '#f5f5f5'; color = '#9e9e9e'; break;
    }
    return {
        backgroundColor: bg,
        color: color,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold' as const
    };
};
