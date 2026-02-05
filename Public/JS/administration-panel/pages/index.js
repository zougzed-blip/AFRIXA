
export * as Dashboard from './dashboard.js'
export * as Validation from './validation.js'
export * as Users from './users.js'
export * as Proofs from './proofs.js'
export * as DemandesAgence from './demandes-agence.js'
export * as Ratings from './ratings.js'


export function loadDashboardPage() {
    return import('./dashboard.js').then(module => module.loadDashboardPage())
}

export function loadValidationPage() {
    return import('./validation.js').then(module => module.loadValidationPage())
}

export function loadUsersPage() {
    return import('./users.js').then(module => module.loadUsersPage())
}

export function loadProofsPage() {
    return import('./proofs.js').then(module => module.loadProofsPage())
}  

export function loadDemandesAgencePage() {
    return import('./demandes-agence.js').then(module => module.loadDemandesAgencePage());
}
export function loadRatingsPage() {
    return import('./ratings.js').then(module => module.loadRatingsPage())
}

