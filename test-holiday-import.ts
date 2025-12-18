import holidaysColombia from "festivos-colombianos";

try {
    console.log("Attempting to call holidaysColombia(2025)...");
    const holidays = holidaysColombia(2025);
    console.log("Success! Holidays:", holidays);
} catch (error) {
    console.error("Error calling holidaysColombia:", error);
}
