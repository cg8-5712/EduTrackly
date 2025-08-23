export function formatDate(date) {
    if (typeof date === 'string' && date.length === 8) {
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        return new Date(`${year}-${month}-${day}`);
    }
    return date instanceof Date ? date : new Date();
}
