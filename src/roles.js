/// Quien ve el panel de gestion: cualquier rol que no sea el de corredora.
/// Que modulos ve lo deciden sus permisos (GET /admin/me), no el nombre del rol.
export const esStaff = role => !!role && role !== 'runner'

export const ROL_LABEL = { runner: 'Corredora', organizer: 'Organizador', osi: 'OSI', admin: 'Admin', plataforma: 'Admin de plataforma', api: 'API de pagos' }

export const etiquetaRol = role => ROL_LABEL[role] || (role ? role[0].toUpperCase() + role.slice(1) : 'Corredora')
