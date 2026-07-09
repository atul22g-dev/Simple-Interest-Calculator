// Utility functions for handling text inputs
export const parseIndianFormat = (value) => {
    if (!value) return 0;

    // Handle text descriptions like "Above ₹1.00 Lakh upto ₹5.00 Lakh"
    if (typeof value === 'string') {
        // Extract numbers and check for Lakh/Crore keywords
        const numbers = value.match(/[\d.]+/g) || [];
        const lastNumber = numbers.length > 0 ? numbers[numbers.length - 1] : '0';
        const amount = parseFloat(lastNumber);

        if (value.toLowerCase().includes('lakh')) {
            return amount * 100000;
        } else if (value.toLowerCase().includes('crore')) {
            return amount * 10000000;
        } else {
            return amount;
        }
    }

    return parseFloat(value);
};

// Utility function to format amounts in Indian numbering system
export const formatIndianAmount = (amount, format = 'numeric') => {
    if (amount === Infinity) return 'Above';

    const value = parseFloat(amount);
    if (isNaN(value)) return amount;

    // Round to 2 decimal places
    const roundedValue = Math.round(value * 100) / 100;

    if (format === 'text') {
        if (roundedValue >= 10000000) {
            return `₹${(roundedValue / 10000000).toFixed(2)} Crore`;
        } else if (roundedValue >= 100000) {
            return `₹${(roundedValue / 100000).toFixed(2)} Lakh`;
        } else {
            return `₹${roundedValue.toFixed(2)}`;
        }
    } else {
        // For numeric format
        return roundedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
};