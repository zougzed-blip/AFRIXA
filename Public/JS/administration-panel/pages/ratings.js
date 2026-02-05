import * as API from '../api/admin.api.js';

let currentRatings = [];

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function safeDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
       
        if (dateString.includes('/') && dateString.includes(':')) {
            const [datePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            
            if (!day || !month || !year || day.length !== 2 || month.length !== 2) {
                return 'N/A';
            }
            
            return `${day}/${month}/${year}`;
        }
        
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('fr-FR');
    } catch {
        return 'N/A';
    }
}

function getStarRating(rating) {
    const ratingValue = parseFloat(rating) || 0;
    const fullStars = Math.floor(ratingValue);
    const halfStar = ratingValue % 1 >= 0.5;
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star star-filled"></i>';
        } else if (i === fullStars + 1 && halfStar) {
            stars += '<i class="fas fa-star-half-alt star-filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

export async function loadRatingsPage() {
    try {
        const response = await API.loadAllRatingsAPI();
        
        if (Array.isArray(response)) {
            currentRatings = response;
        } else if (response && response.data && Array.isArray(response.data)) {
            currentRatings = response.data;
        } else if (response && response.ratings && Array.isArray(response.ratings)) {
            currentRatings = response.ratings;
        } else {
            currentRatings = [];
        }
        
        displayRatings(currentRatings);
        updateRatingsCount();
        setupFilters();
    } catch (error) {
        showEmptyStateWithRetry();
    }
}

function displayRatings(ratings) {
    const container = document.getElementById('ratings-table-body');
    if (!container) return;
    
    container.innerHTML = '';

    if (!ratings || ratings.length === 0) {
        showEmptyState();
        return;
    }

    ratings.forEach((rating) => {
        const noteText = rating.Note || rating.note || '0 ⭐';
        const ratingMatch = noteText.match(/(\d+)/);
        const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
        
        const codeColis = rating['Code Colis'] || rating.codeColis || 'N/A';
        const clientName = rating['Client'] || rating.clientName || 'N/A';
        const agenceName = rating['AGENCE'] || rating.agenceName || 'N/A';
        const starsHtml = getStarRating(ratingValue);
        const formattedDate = safeDate(rating['Date'] || rating.date);
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong style="color: var(--vert-fonce);">${escapeHtml(codeColis)}</strong></td>
            <td>
                <div class="user-info-cell">
                    <strong>${escapeHtml(clientName)}</strong>
                </div>
            </td>
            <td>
                <div class="user-info-cell">
                    <strong>${escapeHtml(agenceName)}</strong>
                </div>
            </td>
            <td>
                <div class="rating-stars">
                    ${starsHtml}
                    <span class="rating-value">(${ratingValue.toFixed(1)}/5)</span>
                </div>
            </td>
            <td>${formattedDate}</td>
        `;
        
        container.appendChild(row);
    });
}

function showEmptyState() {
    const container = document.getElementById('ratings-table-body');
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Aucune évaluation trouvée</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function showEmptyStateWithRetry() {
    const container = document.getElementById('ratings-table-body');
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erreur de chargement des évaluations</p>
                        <button onclick="loadRatingsPage()" class="btn-retry">Réessayer</button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function updateRatingsCount() {
    const totalRatings = document.getElementById('total-ratings');
    if (totalRatings) {
        totalRatings.textContent = currentRatings.length;
    }
}

function setupFilters() {
    const ratingFilter = document.getElementById('rating-filter');
    const searchInput = document.getElementById('search-rating');
    const dateStart = document.getElementById('date-filter-start-rating');
    const dateEnd = document.getElementById('date-filter-end-rating');
    
    if (ratingFilter) ratingFilter.addEventListener('change', filterRatings);
    if (searchInput) searchInput.addEventListener('input', filterRatings);
    if (dateStart) dateStart.addEventListener('change', filterRatings);
    if (dateEnd) dateEnd.addEventListener('change', filterRatings);
}

function filterRatings() {
    const filter = document.getElementById('rating-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-rating')?.value.toLowerCase().trim() || '';
    const startDate = document.getElementById('date-filter-start-rating')?.value;
    const endDate = document.getElementById('date-filter-end-rating')?.value;
    
    const rows = document.querySelectorAll('#ratings-table-body tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) {
            row.style.display = 'none';
            return;
        }
        
        const ratingCell = row.cells[3];
        const ratingText = ratingCell?.querySelector('.rating-value')?.textContent || '(0/5)';
        const ratingMatch = ratingText.match(/\((\d+\.?\d*)\/5\)/);
        const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
        
        const codeCell = row.cells[0];
        const codeText = codeCell?.textContent?.toLowerCase() || '';
        
        const dateCell = row.cells[4];
        const dateText = dateCell?.textContent || '';
        
        const matchesFilter = filter === 'all' || Math.floor(ratingValue) === parseInt(filter);
        const matchesSearch = searchTerm === '' || codeText.includes(searchTerm);
        
        let matchesDate = true;
        if ((startDate || endDate) && dateText !== 'N/A') {
            try {
                const dateParts = dateText.split('/');
                if (dateParts.length === 3) {
                    const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                    const start = startDate ? new Date(startDate) : null;
                    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                    
                    if (start && rowDate < start) matchesDate = false;
                    if (end && rowDate > end) matchesDate = false;
                }
            } catch {
                matchesDate = true;
            }
        }
        
        row.style.display = matchesFilter && matchesSearch && matchesDate ? '' : 'none';
        if (matchesFilter && matchesSearch && matchesDate) visibleCount++;
    });
    
    const totalRatings = document.getElementById('total-ratings');
    if (totalRatings) {
        totalRatings.textContent = visibleCount;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const ratingsSection = document.getElementById('ratings');
    if (ratingsSection && ratingsSection.classList.contains('active')) {
        loadRatingsPage();
    }
});

window.filterRatings = filterRatings;
window.loadRatingsPage = loadRatingsPage;