// src/types/global.d.ts

// Define la estructura del objeto de datos que esperas recibir
interface MenuData {
  menu: Array<any>; // O define el tipo exacto si lo conoces, e.g., Array<{id: number, name: string, ...}>
}

// Extiende la interfaz Window global para incluir tu propiedad
interface Window {
  initialMenuData: MenuData | undefined;
}
