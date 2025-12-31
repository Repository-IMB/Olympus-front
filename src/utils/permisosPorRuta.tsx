export const permisosPorRuta: Record<string, number[]> = {
  // Asesores sí tienen permiso
  "/leads/Opportunities": [1, 2, 3, 4, 5],
  "/leads/SalesProcess": [1, 2, 3, 4, 5],
  "/leads/CreateClient": [1, 2, 3, 4, 5],
  "/leads/CreateOpportunity": [1, 2, 3, 4, 5],
  "/leads/SelectClient": [1, 2, 3, 4, 5],
  "/dashboard": [1, 2, 3, 4, 5],
  "/leads/oportunidades/:id": [1, 2, 3, 4, 5],
  "/leads/oportunidad/:id": [1, 2, 3, 4, 5],
  "/leads/asignacion": [1, 2, 3, 4, 5],

  // ❌ Asesores NO tienen permiso
  "/usuarios/usuarios": [2, 3, 4, 5],
};
