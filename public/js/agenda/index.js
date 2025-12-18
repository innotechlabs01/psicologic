// =========================================================
//  CONFIG
// =========================================================
const DAYS = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
];

const MIN_TIME = "00:00";
const MAX_TIME = "23:59";

// ===============================
//  UTILIDADES
// ===============================
function isValidRange(start, end) {
    return start < end;
}

function isWithinBusinessHours(time) {
    return time >= MIN_TIME && time <= MAX_TIME;
}

// =========================================================
//  TOAST
// =========================================================
function showToast(message, type = "error") {
    const toast = document.createElement("div");

    toast.className = `
    fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-sm
    animate-slide-in
    ${type === "success" ? "bg-green-600" : "bg-red-600"}
  `;

    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Animation
const style = document.createElement("style");
style.textContent = `
  .animate-slide-in {
    animation: slide-in 0.25s ease-out;
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);

// =========================================================
//  VALIDACIONES VISUALES
// =========================================================
function setInputError(day, message) {
    const errorText = document.querySelector(`#${day}-error`);
    const start = document.querySelector(`#${day}-start`);
    const end = document.querySelector(`#${day}-end`);

    errorText.textContent = message;
    errorText.classList.remove("hidden");

    start.classList.add("border-red-500");
    end.classList.add("border-red-500");
}

function clearInputError(day) {
    const errorText = document.querySelector(`#${day}-error`);
    const start = document.querySelector(`#${day}-start`);
    const end = document.querySelector(`#${day}-end`);

    errorText.textContent = "";
    errorText.classList.add("hidden");

    start.classList.remove("border-red-500");
    end.classList.remove("border-red-500");
}

// =========================================================
//  VALIDACIÓN COMPLETA
// =========================================================
function validateForm() {
    const data = {};
    let isValid = true;

    for (const day of DAYS) {
        const start = document.querySelector(`#${day}-start`)?.value;
        const end = document.querySelector(`#${day}-end`)?.value;

        clearInputError(day);

        if (!start || !end) {
            setInputError(day, `Todos los campos del ${day} son obligatorios.`);
            isValid = false;
            continue;
        }

        if (start >= end) {
            setInputError(day, "La hora inicial debe ser menor que la final.");
            isValid = false;
            continue;
        }

        if (start < MIN_TIME || end > MAX_TIME) {
            setInputError(
                day,
                `Los horarios deben estar entre ${MIN_TIME} y ${MAX_TIME}.`
            );
            isValid = false;
            continue;
        }

        if (!isWithinBusinessHours(start) || !isWithinBusinessHours(end)) {
            setInputError(
                day,
                `Los horarios de ${day} deben estar entre ${MIN_TIME} y ${MAX_TIME}.`
            );
            isValid = false;
            continue;
        }

        if (!isValidRange(start, end)) {
            setInputError(
                day,
                `El horario de ${day} es inválido: la hora inicial debe ser menor que la final.`
            );
            isValid = false;
            continue;
        }

        data[day] = { start, end };
    }

    return isValid ? data : null;
}

function clearAllInputs() {
    for (const day of DAYS) {
        const start = document.querySelector(`#${day}-start`);
        const end = document.querySelector(`#${day}-end`);
        const errorText = document.querySelector(`#${day}-error`);

        if (start) start.value = "";
        if (end) end.value = "";
        if (errorText) {
            errorText.textContent = "";
            errorText.classList.add("hidden");
        }
    }
}


// =========================================================
//  ENVÍO A API DE ASTRO
// =========================================================
async function sendToServer(payload) {
    try {
        const response = await fetch("/api/settings/agenda/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Error guardando la agenda", "error");
            return;
        }

        // 👉 LIMPIAR TODO DESPUÉS DE GUARDAR
        clearAllInputs();

        showToast("Agenda guardada correctamente", "success");
    } catch (error) {
        showToast("No se pudo conectar al servidor", "error");
    }
}

// =========================================================
//  LISTENERS
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnSave = document.getElementById("save-agenda");

    if (!btnSave) {
        console.error("BOTÓN NO ENCONTRADO");
        return;
    }

    btnSave.addEventListener("click", async () => {
        const formData = validateForm();
        if (!formData) return;

        await sendToServer(formData);
    });

    // Limpiar errores automáticamente al cambiar algo
    DAYS.forEach((day) => {
        const start = document.querySelector(`#${day}-start`);
        const end = document.querySelector(`#${day}-end`);

        [start, end].forEach((input) => {
            input?.addEventListener("input", () => clearInputError(day));
        });
    });
});
