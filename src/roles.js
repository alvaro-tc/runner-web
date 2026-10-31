/// Quien ve el panel de gestion. El organizador es quien valida las
/// transferencias en el dia a dia; el admin maneja las carreras y el OSI las cuentas.
export const esStaff = role => role === 'admin' || role === 'organizer' || role === 'osi'

export const ROL_LABEL = { runner: 'Corredora', organizer: 'Organizador', osi: 'OSI', admin: 'Admin' }

export const etiquetaRol = role => ROL_LABEL[role] || 'Corredora'
