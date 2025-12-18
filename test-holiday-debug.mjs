import holidays from 'festivos-colombianos';

try {
    console.log('Imported:', holidays);
    if (typeof holidays === 'function') {
        const h = holidays(new Date().getFullYear());
        console.log('Holidays for current year:', h);
    } else if (typeof holidays === 'object') {
        console.log('Keys:', Object.keys(holidays));
        // Try to find the function
        if (holidays.default && typeof holidays.default === 'function') {
            console.log('Found default export function');
            console.log(holidays.default(new Date().getFullYear()));
        }
        if (holidays.getHolidaysByYear && typeof holidays.getHolidaysByYear === 'function') {
            console.log('Found getHolidaysByYear');
            console.log(holidays.getHolidaysByYear(new Date().getFullYear()));
        }
    }
} catch (e) {
    console.error('Error:', e);
}
