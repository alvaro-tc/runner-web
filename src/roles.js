/// Quien ve el panel de gestion. El organizador es quien valida las
/// transferencias en el dia a dia; el admin puede hacerlo igual.
export const esStaff = role => role === 'admin' || role === 'organizer'

export const etiquetaRol = role =>
  role === 'admin' ? '⚙️ Admin' : role === 'organizer' ? '📋 Organizador' : '🏃‍♀️ Corredora'
