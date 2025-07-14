const API_URL = "http://localhost:8000/api";

export interface Nivel {
  id: number;
  nombre: string;
}

export async function getNiveles(): Promise<Nivel[]> {
  const res = await fetch(`${API_URL}/niveles/`);
  if (!res.ok) {
    throw new Error(`Error al obtener niveles: ${res.statusText}`);
  }
  return res.json();
}