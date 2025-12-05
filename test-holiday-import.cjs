import holidaysColombia from "festivos-colombianos";

try {
    console.log("Type of holidaysColombia:", typeof holidaysColombia);
    console.log("holidaysColombia content:", holidaysColombia);

    if (typeof holidaysColombia === 'function') {
        console.log("It is a function. Calling it...");
        const holidays = holidaysColombia(2025);
        console.log("Success! Found " + holidays.length + " holidays.");
    } else if (typeof holidaysColombia.default === 'function') {
        console.log("It has a default export. Calling it...");
        const holidays = holidaysColombia.default(2025);
        console.log("Success! Found " + holidays.length + " holidays.");
    } else {
        console.log("It is neither a function nor has a default export function.");
    }
} catch (error) {
    console.error("Error:", error);
}
