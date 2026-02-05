
import * as Utils from '../../utils/helpers.js';
import * as API from '../../api/admin.api.js';

// ==================== AFFICHAGE SOCIÉTÉS ===============================
export function displayCompanies(companies) {
    const container = document.getElementById('companies-list');
    if (!container) return;
    
    if (companies.length === 0) {
        showEmptyState('companies-list', 'Aucune société en attente de validation');
        return;
    }

    container.innerHTML = '';
    
    companies.forEach(company => {
        const companyName = Utils.getCompanyName(company);
        
        const companyCard = document.createElement('div');
        companyCard.className = 'company-card';
        companyCard.setAttribute('data-type', company.role);
        
        const companyInfo = document.createElement('div');
        companyInfo.className = 'company-info';
        
        const logoImg = document.createElement('img');
        logoImg.src = Utils.getCompanyLogo(company);
        logoImg.className = 'company-logo';
        logoImg.alt = `Logo ${companyName}`;
        logoImg.onerror = function() { this.src='/images/default-company.png'; };
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'company-details';
        
        const nameH4 = document.createElement('h4');
        nameH4.textContent = companyName;
        
        const infoP = document.createElement('p');
        infoP.textContent = `${Utils.getUserPhone(company)} • ${Utils.getCompanyAddress(company)}`;
        
        const typeSpan = document.createElement('span');
        typeSpan.className = 'company-type';
        typeSpan.textContent = Utils.getRoleLabel(company.role);
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'company-meta';
        const metaSmall = document.createElement('small');
        metaSmall.textContent = `Inscrit le: ${Utils.formatDate(company.createdAt)}`;
        metaDiv.appendChild(metaSmall);
        
        detailsDiv.appendChild(nameH4);
        detailsDiv.appendChild(infoP);
        detailsDiv.appendChild(typeSpan);
        detailsDiv.appendChild(metaDiv);
        
        companyInfo.appendChild(logoImg);
        companyInfo.appendChild(detailsDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'company-actions';
        
        const viewButton = document.createElement('button');
        viewButton.className = 'btn btn-view';
        viewButton.setAttribute('data-action', 'view-company-profile');
        viewButton.setAttribute('data-company-id', company._id);
        const viewIcon = document.createElement('i');
        viewIcon.className = 'fas fa-eye';
        viewButton.appendChild(viewIcon);
        viewButton.appendChild(document.createTextNode(' Voir Profil'));
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'btn btn-accept';
        acceptButton.setAttribute('data-action', 'accept-company');
        acceptButton.setAttribute('data-company-id', company._id);
        acceptButton.setAttribute('data-company-name', companyName);
        const acceptIcon = document.createElement('i');
        acceptIcon.className = 'fas fa-check';
        acceptButton.appendChild(acceptIcon);
        acceptButton.appendChild(document.createTextNode(' Accepter'));
        
        const refuseButton = document.createElement('button');
        refuseButton.className = 'btn btn-refuse';
        refuseButton.setAttribute('data-action', 'refuse-company');
        refuseButton.setAttribute('data-company-id', company._id);
        refuseButton.setAttribute('data-company-name', companyName);
        const refuseIcon = document.createElement('i');
        refuseIcon.className = 'fas fa-times';
        refuseButton.appendChild(refuseIcon);
        refuseButton.appendChild(document.createTextNode(' Refuser'));
        
        actionsDiv.appendChild(viewButton);
        actionsDiv.appendChild(acceptButton);
        actionsDiv.appendChild(refuseButton);
        
        companyCard.appendChild(companyInfo);
        companyCard.appendChild(actionsDiv);
        
        container.appendChild(companyCard);
    });
}

// ==================== AFFICHAGE UTILISATEURS ===========================
export function displayUsers(users) {
    const container = document.getElementById('users-table-body');
    if (!container) return;
    
    if (users.length === 0) {
        showEmptyState('users-table-body', 'Aucun utilisateur trouvé');
        return;
    }

    container.innerHTML = '';
    
    users.forEach(user => {
        const userName = Utils.getUserName(user);
        
        const row = document.createElement('tr');
        
        // Cellule 1: Info utilisateur
        const td1 = document.createElement('td');
        const userInfoCell = document.createElement('div');
        userInfoCell.className = 'user-info-cell';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = Utils.getUserAvatar(user);
        avatarImg.className = 'user-avatar';
        avatarImg.alt = userName;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = userName;
        
        userInfoCell.appendChild(avatarImg);
        userInfoCell.appendChild(nameSpan);
        td1.appendChild(userInfoCell);
        
        // Cellule 2: Email
        const td2 = document.createElement('td');
        td2.textContent = user.email;
        
        // Cellule 3: Rôle
        const td3 = document.createElement('td');
        const roleSpan = document.createElement('span');
        roleSpan.className = 'company-type';
        roleSpan.textContent = Utils.getRoleLabel(user.role);
        td3.appendChild(roleSpan);
        
        // Cellule 4: Statut
        const td4 = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge status-${user.isVerified ? 'active' : 'pending'}`;
        statusSpan.textContent = user.isVerified ? 'Actif' : 'En attente';
        td4.appendChild(statusSpan);
        
        // Cellule 5: Date
        const td5 = document.createElement('td');
        td5.textContent = Utils.formatDate(user.createdAt);
        
        // Cellule 6: Actions
        const td6 = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'user-actions';
        
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-action btn-view';
        viewButton.setAttribute('data-action', 'view-user-profile');
        viewButton.setAttribute('data-user-id', user._id);
        viewButton.setAttribute('title', 'Voir profil');
        const viewIcon = document.createElement('i');
        viewIcon.className = 'fas fa-eye';
        viewButton.appendChild(viewIcon);
        
        const statusButton = document.createElement('button');
        statusButton.className = `btn-action btn-${user.isSuspended ? 'unlock' : 'block'}`;
        statusButton.setAttribute('data-action', 'toggle-user-status');
        statusButton.setAttribute('data-user-id', user._id);
        statusButton.setAttribute('data-user-name', userName);
        statusButton.setAttribute('data-suspend', !user.isSuspended);
        statusButton.setAttribute('title', user.isSuspended ? 'Activer' : 'Suspendre');
        const statusIcon = document.createElement('i');
        statusIcon.className = `fas ${user.isSuspended ? 'fa-unlock' : 'fa-lock'}`;
        statusButton.appendChild(statusIcon);
        
        actionsDiv.appendChild(viewButton);
        actionsDiv.appendChild(statusButton);
        td6.appendChild(actionsDiv);
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        
        container.appendChild(row);
    });
}

// ==================== AFFICHAGE PREUVES ================================
export function displayProofs(proofs) {
    const container = document.getElementById('proofs-table-body');
    if (!container) return;
    
    if (proofs.length === 0) {
        showEmptyState('proofs-table-body', 'Aucune preuve de paiement trouvée');
        return;
    }

    container.innerHTML = '';
    
    proofs.forEach(proof => {
        const methodIcons = {
            'agencemethod': 'fa-handshake',
            'mpsa': 'fa-mobile-alt',
            'orange': 'fa-mobile-alt',
            'bank': 'fa-university'
        };
        
        const methodLabels = {
            'agencemethod': 'Face to face',
            'mpsa': 'MPESA',
            'orange': 'Orange Money',
            'bank': 'Banque'
        };
        
        const montantFormatted = proof.montant 
            ? `${proof.montant.toLocaleString()} ${proof.devise || 'FC'}`
            : 'N/A';
        
        const row = document.createElement('tr');
        
        // Cellule 1: Client
        const td1 = document.createElement('td');
        const clientInfo = document.createElement('div');
        clientInfo.className = 'client-info';
        
        const clientStrong = document.createElement('strong');
        clientStrong.textContent = proof.clientName || 'N/A';
        
        clientInfo.appendChild(clientStrong);
        
        if (proof.user && proof.user.email) {
            clientInfo.appendChild(document.createElement('br'));
            const emailSmall = document.createElement('small');
            emailSmall.textContent = proof.user.email;
            clientInfo.appendChild(emailSmall);
        }
        
        td1.appendChild(clientInfo);
        
        // Cellule 2: Code colis
        const td2 = document.createElement('td');
        const codeStrong = document.createElement('strong');
        codeStrong.style.color = 'var(--vert-fonce)';
        codeStrong.textContent = proof.codeColis || 'N/A';
        td2.appendChild(codeStrong);
        
        // Cellule 3: Montant
        const td3 = document.createElement('td');
        const montantSpan = document.createElement('span');
        montantSpan.className = 'montant-cell';
        montantSpan.textContent = montantFormatted;
        td3.appendChild(montantSpan);
        
        // Cellule 4: Devise
        const td4 = document.createElement('td');
        const deviseSpan = document.createElement('span');
        deviseSpan.className = 'devise-badge';
        deviseSpan.textContent = proof.devise || 'FC';
        td4.appendChild(deviseSpan);
        
        // Cellule 5: Méthode
        const td5 = document.createElement('td');
        const methodDiv = document.createElement('div');
        methodDiv.className = 'method-cell';
        
        const methodIcon = document.createElement('i');
        methodIcon.className = `fas ${methodIcons[proof.method] || 'fa-credit-card'}`;
        
        const methodSpan = document.createElement('span');
        methodSpan.textContent = methodLabels[proof.method] || proof.method;
        
        methodDiv.appendChild(methodIcon);
        methodDiv.appendChild(methodSpan);
        td5.appendChild(methodDiv);
        
        // Cellule 6: Statut
        const td6 = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge status-${proof.status || 'en_attente'}`;
        
        let statusText = 'En attente';
        if (proof.status === 'accepté') statusText = 'Accepté';
        else if (proof.status === 'refusé') statusText = 'Refusé';
        
        statusSpan.textContent = statusText;
        td6.appendChild(statusSpan);
        
        // Cellule 7: Date
        const td7 = document.createElement('td');
        td7.textContent = Utils.formatDate(proof.uploadedAt);
        
        // Cellule 8: Actions
        const td8 = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'proof-actions';
        
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-action btn-view';
        viewButton.setAttribute('data-action', 'view-proof');
        viewButton.setAttribute('data-proof-id', proof._id);
        viewButton.setAttribute('data-proof-url', proof.proofUrl);
        viewButton.setAttribute('title', 'Voir la preuve');
        const viewIcon = document.createElement('i');
        viewIcon.className = 'fas fa-eye';
        viewButton.appendChild(viewIcon);
        actionsDiv.appendChild(viewButton);
        
        if (proof.status === 'en_attente') {
            const acceptButton = document.createElement('button');
            acceptButton.className = 'btn-action btn-accept';
            acceptButton.setAttribute('data-action', 'accept-proof');
            acceptButton.setAttribute('data-proof-id', proof._id);
            acceptButton.setAttribute('title', 'Accepter');
            const acceptIcon = document.createElement('i');
            acceptIcon.className = 'fas fa-check';
            acceptButton.appendChild(acceptIcon);
            actionsDiv.appendChild(acceptButton);
            
            const refuseButton = document.createElement('button');
            refuseButton.className = 'btn-action btn-refuse';
            refuseButton.setAttribute('data-action', 'refuse-proof');
            refuseButton.setAttribute('data-proof-id', proof._id);
            refuseButton.setAttribute('title', 'Refuser');
            const refuseIcon = document.createElement('i');
            refuseIcon.className = 'fas fa-times';
            refuseButton.appendChild(refuseIcon);
            actionsDiv.appendChild(refuseButton);
        }
        
        if (proof.status !== 'en_attente') {
            const resetButton = document.createElement('button');
            resetButton.className = 'btn-action btn-reset';
            resetButton.setAttribute('data-action', 'reset-proof');
            resetButton.setAttribute('data-proof-id', proof._id);
            resetButton.setAttribute('title', 'Remettre en attente');
            const resetIcon = document.createElement('i');
            resetIcon.className = 'fas fa-redo';
            resetButton.appendChild(resetIcon);
            actionsDiv.appendChild(resetButton);
        }
        
        td8.appendChild(actionsDiv);
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        row.appendChild(td7);
        row.appendChild(td8);
        
        container.appendChild(row);
    });
}

// ==================== FONCTIONS UTILITAIRES ============================
export function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-inbox';
        
        const p = document.createElement('p');
        p.textContent = message;
        
        emptyState.appendChild(icon);
        emptyState.appendChild(p);
        
        container.innerHTML = '';
        container.appendChild(emptyState);
    }
}

export function updateFilterCount() {
    const filterCount = document.getElementById('filter-count');
    if (filterCount) {
        filterCount.textContent = API.getCurrentCompanies().length;
    }
}

export function updateUsersCount() {
    const usersCount = document.getElementById('users-count');
    if (usersCount) {
        usersCount.textContent = API.getCurrentUsers().length;
    }
}

export function updateProofsCount() {
    const totalProofs = document.getElementById('total-proofs');
    if (totalProofs) {
        totalProofs.textContent = API.getCurrentProofs().length;
    }
}