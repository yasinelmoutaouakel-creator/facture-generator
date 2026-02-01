let currency = 'MAD';
let tvaRate = 20;
let currentEditingClientIndex = null;

// Fonction pour générer le numéro de facture automatique
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const lastNumber = parseInt(localStorage.getItem('lastInvoiceNumber') || '0');
    const newNumber = lastNumber + 1;
    localStorage.setItem('lastInvoiceNumber', newNumber.toString());
    return `${year}-${String(newNumber).padStart(4, '0')}`;
}

// ===== GESTION DES ONGLETS =====

function switchTab(tab) {
    // Cacher toutes les sections
    document.getElementById('facture-section').classList.add('hidden');
    document.getElementById('facture-controls').classList.add('hidden');
    document.getElementById('clients-section').classList.add('hidden');
    
    // Réinitialiser les styles des onglets
    document.getElementById('tab-facture').className = 'flex-1 px-6 py-3 text-sm font-bold rounded-lg transition text-slate-500 hover:bg-slate-50';
    document.getElementById('tab-clients').className = 'flex-1 px-6 py-3 text-sm font-bold rounded-lg transition text-slate-500 hover:bg-slate-50';
    
    // Afficher la section active
    if (tab === 'facture') {
        document.getElementById('facture-section').classList.remove('hidden');
        document.getElementById('facture-controls').classList.remove('hidden');
        document.getElementById('tab-facture').className = 'flex-1 px-6 py-3 text-sm font-bold rounded-lg transition bg-indigo-600 text-white shadow-sm';
    } else if (tab === 'clients') {
        document.getElementById('clients-section').classList.remove('hidden');
        document.getElementById('tab-clients').className = 'flex-1 px-6 py-3 text-sm font-bold rounded-lg transition bg-indigo-600 text-white shadow-sm';
        loadClientsTable();
        loadHistoryTables();
    }
    
    lucide.createIcons();
}

function switchClientTab(tab) {
    // Cacher tous les sous-onglets
    document.getElementById('clients-all').classList.add('hidden');
    document.getElementById('clients-history-factures').classList.add('hidden');
    document.getElementById('clients-history-devis').classList.add('hidden');
    
    // Réinitialiser les styles
    document.getElementById('client-tab-all').className = 'px-6 py-2 text-sm font-bold rounded-lg transition text-slate-500 hover:bg-slate-50';
    document.getElementById('client-tab-history-factures').className = 'px-6 py-2 text-sm font-bold rounded-lg transition text-slate-500 hover:bg-slate-50';
    document.getElementById('client-tab-history-devis').className = 'px-6 py-2 text-sm font-bold rounded-lg transition text-slate-500 hover:bg-slate-50';
    
    // Afficher le bon sous-onglet
    if (tab === 'all') {
        document.getElementById('clients-all').classList.remove('hidden');
        document.getElementById('client-tab-all').className = 'px-6 py-2 text-sm font-bold rounded-lg transition bg-indigo-600 text-white';
        loadClientsTable();
    } else if (tab === 'history-factures') {
        document.getElementById('clients-history-factures').classList.remove('hidden');
        document.getElementById('client-tab-history-factures').className = 'px-6 py-2 text-sm font-bold rounded-lg transition bg-indigo-600 text-white';
    } else if (tab === 'history-devis') {
        document.getElementById('clients-history-devis').classList.remove('hidden');
        document.getElementById('client-tab-history-devis').className = 'px-6 py-2 text-sm font-bold rounded-lg transition bg-indigo-600 text-white';
    }
    
    lucide.createIcons();
}

// ===== GESTION DES CLIENTS ÉTENDUE =====

function getClients() {
    return JSON.parse(localStorage.getItem('clientsExtended') || '[]');
}

function saveClientsToStorage(clients) {
    localStorage.setItem('clientsExtended', JSON.stringify(clients));
}

function loadClientsTable() {
    const clients = getClients();
    const tbody = document.getElementById('clients-table-body');
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">Aucun client enregistré</td></tr>';
        return;
    }
    
    tbody.innerHTML = clients.map((client, index) => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-3 px-4 font-semibold">${client.name}</td>
            <td class="py-3 px-4">${client.city || '-'}</td>
            <td class="py-3 px-4">${client.country || '-'}</td>
            <td class="py-3 px-4">${client.phone || '-'}</td>
            <td class="py-3 px-4">${client.email || '-'}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="createInvoiceForClient(${index})" class="text-indigo-600 hover:text-indigo-800 mr-2" title="Créer facture">
                    <i data-lucide="file-text" class="w-5 h-5 inline"></i>
                </button>
                <button onclick="editClient(${index})" class="text-blue-600 hover:text-blue-800 mr-2" title="Modifier">
                    <i data-lucide="edit" class="w-5 h-5 inline"></i>
                </button>
                <button onclick="deleteClient(${index})" class="text-red-600 hover:text-red-800" title="Supprimer">
                    <i data-lucide="trash-2" class="w-5 h-5 inline"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
    updateFilters();
}

function updateFilters() {
    const clients = getClients();
    const cities = [...new Set(clients.map(c => c.city).filter(Boolean))].sort();
    const countries = [...new Set(clients.map(c => c.country).filter(Boolean))].sort();
    
    const citySelect = document.getElementById('filter-city');
    const countrySelect = document.getElementById('filter-country');
    
    const currentCity = citySelect.value;
    const currentCountry = countrySelect.value;
    
    citySelect.innerHTML = '<option value="">📍 Toutes les villes</option>' + 
        cities.map(city => `<option value="${city}">${city}</option>`).join('');
    
    countrySelect.innerHTML = '<option value="">🌍 Tous les pays</option>' + 
        countries.map(country => `<option value="${country}">${country}</option>`).join('');
    
    citySelect.value = currentCity;
    countrySelect.value = currentCountry;
}

function filterClients() {
    const searchTerm = document.getElementById('search-client').value.toLowerCase();
    const filterCity = document.getElementById('filter-city').value;
    const filterCountry = document.getElementById('filter-country').value;
    
    const clients = getClients();
    const tbody = document.getElementById('clients-table-body');
    
    const filtered = clients.filter((client, index) => {
        const matchSearch = !searchTerm || 
            client.name.toLowerCase().includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm)) ||
            (client.phone && client.phone.includes(searchTerm));
        
        const matchCity = !filterCity || client.city === filterCity;
        const matchCountry = !filterCountry || client.country === filterCountry;
        
        return matchSearch && matchCity && matchCountry;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">Aucun client trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((client) => {
        const index = clients.indexOf(client);
        return `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-3 px-4 font-semibold">${client.name}</td>
            <td class="py-3 px-4">${client.city || '-'}</td>
            <td class="py-3 px-4">${client.country || '-'}</td>
            <td class="py-3 px-4">${client.phone || '-'}</td>
            <td class="py-3 px-4">${client.email || '-'}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="createInvoiceForClient(${index})" class="text-indigo-600 hover:text-indigo-800 mr-2" title="Créer facture">
                    <i data-lucide="file-text" class="w-5 h-5 inline"></i>
                </button>
                <button onclick="editClient(${index})" class="text-blue-600 hover:text-blue-800 mr-2" title="Modifier">
                    <i data-lucide="edit" class="w-5 h-5 inline"></i>
                </button>
                <button onclick="deleteClient(${index})" class="text-red-600 hover:text-red-800" title="Supprimer">
                    <i data-lucide="trash-2" class="w-5 h-5 inline"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    lucide.createIcons();
}

function openAddClientModal() {
    currentEditingClientIndex = null;
    document.getElementById('modal-title').textContent = 'Ajouter un client';
    document.getElementById('client-form').reset();
    document.getElementById('client-modal').classList.remove('hidden');
    document.getElementById('client-modal').classList.add('flex');
}

function editClient(index) {
    currentEditingClientIndex = index;
    const clients = getClients();
    const client = clients[index];
    
    document.getElementById('modal-title').textContent = 'Modifier le client';
    document.getElementById('modal-client-name').value = client.name || '';
    document.getElementById('modal-client-email').value = client.email || '';
    document.getElementById('modal-client-phone').value = client.phone || '';
    document.getElementById('modal-client-city').value = client.city || '';
    document.getElementById('modal-client-country').value = client.country || '';
    document.getElementById('modal-client-zip').value = client.zip || '';
    document.getElementById('modal-client-address').value = client.address || '';
    
    document.getElementById('client-modal').classList.remove('hidden');
    document.getElementById('client-modal').classList.add('flex');
}

function closeClientModal() {
    document.getElementById('client-modal').classList.add('hidden');
    document.getElementById('client-modal').classList.remove('flex');
    document.getElementById('client-form').reset();
    currentEditingClientIndex = null;
}

function deleteClient(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
        const clients = getClients();
        clients.splice(index, 1);
        saveClientsToStorage(clients);
        loadClientsTable();
        alert('✅ Client supprimé !');
    }
}

function createInvoiceForClient(index) {
    const clients = getClients();
    const client = clients[index];
    
    // Passer à l'onglet facture
    switchTab('facture');
    
    // Remplir les infos client
    document.getElementById('client-name').value = client.name;
    const addressParts = [];
    if (client.address) addressParts.push(client.address);
    if (client.city && client.zip) addressParts.push(`${client.city}, ${client.zip}`);
    else if (client.city) addressParts.push(client.city);
    if (client.country) addressParts.push(client.country);
    if (client.phone) addressParts.push(client.phone);
    if (client.email) addressParts.push(client.email);
    
    document.getElementById('client-address').value = addressParts.join('\n');
}

// Gérer la soumission du formulaire client
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('client-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const client = {
            name: document.getElementById('modal-client-name').value,
            email: document.getElementById('modal-client-email').value,
            phone: document.getElementById('modal-client-phone').value,
            city: document.getElementById('modal-client-city').value,
            country: document.getElementById('modal-client-country').value,
            zip: document.getElementById('modal-client-zip').value,
            address: document.getElementById('modal-client-address').value,
            date: new Date().toISOString()
        };
        
        const clients = getClients();
        
        if (currentEditingClientIndex !== null) {
            clients[currentEditingClientIndex] = client;
            alert('✅ Client mis à jour !');
        } else {
            clients.push(client);
            alert('✅ Client ajouté !');
        }
        
        saveClientsToStorage(clients);
        closeClientModal();
        loadClientsTable();
    });
});

// ===== HISTORIQUE =====

function loadHistoryTables() {
    const factures = JSON.parse(localStorage.getItem('historyFactures') || '[]');
    const devis = JSON.parse(localStorage.getItem('historyDevis') || '[]');
    
    // Historique factures
    const facturesBody = document.getElementById('history-factures-body');
    if (factures.length === 0) {
        facturesBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">Aucune facture enregistrée</td></tr>';
    } else {
        facturesBody.innerHTML = factures.map((item, index) => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 font-semibold">${item.ref}</td>
                <td class="py-3 px-4">${item.date}</td>
                <td class="py-3 px-4">${item.client}</td>
                <td class="py-3 px-4 text-right font-bold">${item.amount}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="deleteHistory('factures', ${index})" class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i data-lucide="trash-2" class="w-5 h-5 inline"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // Historique devis
    const devisBody = document.getElementById('history-devis-body');
    if (devis.length === 0) {
        devisBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">Aucun devis enregistré</td></tr>';
    } else {
        devisBody.innerHTML = devis.map((item, index) => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 font-semibold">${item.ref}</td>
                <td class="py-3 px-4">${item.date}</td>
                <td class="py-3 px-4">${item.client}</td>
                <td class="py-3 px-4 text-right font-bold">${item.amount}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="deleteHistory('devis', ${index})" class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i data-lucide="trash-2" class="w-5 h-5 inline"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    lucide.createIcons();
}

function deleteHistory(type, index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        const key = type === 'factures' ? 'historyFactures' : 'historyDevis';
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(history));
        loadHistoryTables();
        alert('✅ Élément supprimé !');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.getElementById('doc-date').value = new Date().toISOString().split('T')[0];
    // Auto-générer le numéro de facture
    document.getElementById('doc-ref').value = generateInvoiceNumber();
    addItem();
    
    // Charger la liste des clients
    loadClientsList();
    // Charger les infos de l'entreprise si elles existent
    loadCompanyInfo();
});

// ===== GESTION DES CLIENTS =====

function saveClient() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientAddress = document.getElementById('client-address').value.trim();
    
    if (!clientName) {
        alert('Veuillez entrer le nom du client avant de sauvegarder !');
        return;
    }
    
    // Récupérer les clients existants
    let clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Vérifier si le client existe déjà
    const existingIndex = clients.findIndex(c => c.name.toLowerCase() === clientName.toLowerCase());
    
    const client = {
        name: clientName,
        address: clientAddress,
        date: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        // Mettre à jour le client existant
        if (confirm(`Le client "${clientName}" existe déjà. Voulez-vous le mettre à jour ?`)) {
            clients[existingIndex] = client;
            localStorage.setItem('clients', JSON.stringify(clients));
            alert('✅ Client mis à jour !');
        }
    } else {
        // Ajouter un nouveau client
        clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
        alert('✅ Client sauvegardé !');
    }
    
    // Recharger la liste
    loadClientsList();
}

function loadClientsList() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const selector = document.getElementById('client-selector');
    
    // Vider le select
    selector.innerHTML = '<option value="">-- Choisir un client --</option>';
    
    // Ajouter les clients triés par nom
    clients.sort((a, b) => a.name.localeCompare(b.name)).forEach((client, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = client.name;
        selector.appendChild(option);
    });
}

function loadClient(index) {
    if (index === '') {
        // Vider les champs si on sélectionne "-- Choisir un client --"
        document.getElementById('client-name').value = '';
        document.getElementById('client-address').value = '';
        return;
    }
    
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const client = clients[index];
    
    if (client) {
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-address').value = client.address;
    }
}

// ===== GESTION DES INFOS ENTREPRISE =====

function saveCompanyInfo() {
    const companyName = document.getElementById('company-name').value;
    const companyAddress = document.getElementById('company-address').value;
    
    localStorage.setItem('companyInfo', JSON.stringify({
        name: companyName,
        address: companyAddress
    }));
}

function loadCompanyInfo() {
    const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
    
    if (companyInfo.name) {
        document.getElementById('company-name').value = companyInfo.name;
    }
    if (companyInfo.address) {
        document.getElementById('company-address').value = companyInfo.address;
    }
}

// Sauvegarder les infos entreprise automatiquement quand on les modifie
document.addEventListener('DOMContentLoaded', () => {
    const companyName = document.getElementById('company-name');
    const companyAddress = document.getElementById('company-address');
    
    if (companyName && companyAddress) {
        companyName.addEventListener('blur', saveCompanyInfo);
        companyAddress.addEventListener('blur', saveCompanyInfo);
    }
});

function setDocType(type) {
    document.getElementById('doc-title-display').innerText = type;
    const isF = type === 'Facture';
    document.getElementById('btnFacture').className = isF ? "px-6 py-2 text-sm font-bold rounded-lg transition bg-white text-indigo-600 shadow-sm" : "px-6 py-2 text-sm font-bold rounded-lg transition text-slate-500";
    document.getElementById('btnDevis').className = !isF ? "px-6 py-2 text-sm font-bold rounded-lg transition bg-white text-indigo-600 shadow-sm" : "px-6 py-2 text-sm font-bold rounded-lg transition text-slate-500";
}

function updateCurrency(val) { 
    currency = val; 
    calculate(); 
}

function updateTva(val) { 
    tvaRate = parseFloat(val) || 0; 
    document.getElementById('tva-label').innerText = `TVA (${tvaRate}%)`;
    calculate(); 
}

function handleLogo(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logo-preview').src = e.target.result;
            document.getElementById('logo-preview').classList.remove('hidden');
            document.getElementById('logo-placeholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function addItem() {
    const tbody = document.getElementById('items-body');
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 group hover:bg-slate-50";
    tr.innerHTML = `
        <td class="py-2 px-2"><input type="text" placeholder="Article..." class="w-full outline-none font-medium text-slate-700" /></td>
        <td class="py-2 px-2"><input type="number" value="1" oninput="calculate()" class="qty w-full text-center font-bold outline-none text-slate-700" /></td>
        <td class="py-2 px-2"><input type="number" value="0" oninput="calculate()" class="price w-full text-right font-bold outline-none text-slate-700" /></td>
        <td class="py-2 px-2 text-right font-black line-total text-slate-700">0.00</td>
        <td class="py-2 px-2 text-center no-print">
            <button onclick="this.closest('tr').remove(); calculate();" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
    lucide.createIcons();
}

function calculate() {
    let sub = 0;
    document.querySelectorAll('#items-body tr').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        const p = parseFloat(row.querySelector('.price').value) || 0;
        const total = q * p;
        sub += total;
        row.querySelector('.line-total').innerText = total.toFixed(2);
    });
    const tva = (sub * tvaRate) / 100;
    document.getElementById('subtotal').innerText = sub.toFixed(2) + ' ' + currency;
    document.getElementById('tva-val').innerText = tva.toFixed(2) + ' ' + currency;
    document.getElementById('total-ttc').innerText = (sub + tva).toFixed(2) + ' ' + currency;
}

function newInvoice() {
    // Confirmer avant de vider
    if (confirm('Voulez-vous créer une nouvelle facture ? Toutes les données actuelles seront perdues.')) {
        // Sauvegarder les infos entreprise avant de vider
        const companyName = document.getElementById('company-name').value;
        const companyAddress = document.getElementById('company-address').value;
        
        // Vider tous les inputs du formulaire
        document.querySelectorAll('input[type="text"], textarea').forEach(input => {
            input.value = '';
        });
        
        // Restaurer les infos entreprise
        document.getElementById('company-name').value = companyName;
        document.getElementById('company-address').value = companyAddress;
        
        // Réinitialiser le sélecteur de client
        document.getElementById('client-selector').value = '';
        
        // Réinitialiser la date à aujourd'hui
        document.getElementById('doc-date').value = new Date().toISOString().split('T')[0];
        
        // Générer un nouveau numéro de facture
        document.getElementById('doc-ref').value = generateInvoiceNumber();
        
        // Supprimer toutes les lignes d'articles
        document.getElementById('items-body').innerHTML = '';
        
        // Ajouter une ligne vide
        addItem();
        
        // Réinitialiser le logo
        document.getElementById('logo-preview').classList.add('hidden');
        document.getElementById('logo-placeholder').classList.remove('hidden');
        document.getElementById('logo-preview').src = '';
        document.getElementById('logo-input').value = '';
        
        // Recalculer les totaux
        calculate();
        
        // Message de confirmation
        console.log('Nouvelle facture créée !');
    }
}

async function downloadPDF() {
    // Récupérer les valeurs avant la génération
    const docRef = document.getElementById('doc-ref').value || 'N/A';
    const docDate = document.getElementById('doc-date').value;
    const docType = document.getElementById('doc-title-display').innerText; // Facture ou Devis
    const clientName = document.getElementById('client-name').value || 'Client inconnu';
    const totalAmount = document.getElementById('total-ttc').innerText;
    
    // Formater la date en français
    let dateFormatted = 'N/A';
    if (docDate) {
        const dateObj = new Date(docDate);
        dateFormatted = dateObj.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }
    
    // Créer des éléments temporaires pour afficher les valeurs dans le PDF
    const refInput = document.getElementById('doc-ref');
    const dateInput = document.getElementById('doc-date');
    
    // Sauvegarder les valeurs originales
    const originalRefValue = refInput.value;
    const originalDateValue = dateInput.value;
    const originalRefType = refInput.type;
    const originalDateType = dateInput.type;
    
    // Convertir les inputs en texte pour le PDF
    refInput.type = 'text';
    dateInput.type = 'text';
    refInput.value = docRef;
    dateInput.value = dateFormatted;
    
    // Désactiver les inputs pour qu'ils ressemblent à du texte
    refInput.setAttribute('readonly', 'true');
    dateInput.setAttribute('readonly', 'true');
    refInput.style.border = 'none';
    dateInput.style.border = 'none';
    
    const element = document.getElementById('invoice-document');
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${docType.toLowerCase()}_${docRef.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 2.5,
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            backgroundColor: '#ffffff'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: false
        },
        pagebreak: { 
            mode: ['css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: '.no-page-break'
        }
    };
    
    try {
        await html2pdf().set(opt).from(element).save();
        
        // Sauvegarder dans l'historique
        const historyKey = docType === 'Facture' ? 'historyFactures' : 'historyDevis';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        history.unshift({
            ref: docRef,
            date: dateFormatted,
            client: clientName,
            amount: totalAmount,
            timestamp: new Date().toISOString()
        });
        // Garder seulement les 50 dernières
        if (history.length > 50) history.pop();
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        // Après le téléchargement réussi, générer un nouveau numéro pour la prochaine facture
        setTimeout(() => {
            document.getElementById('doc-ref').value = generateInvoiceNumber();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF');
    }
    
    // Restaurer les valeurs originales après génération
    setTimeout(() => {
        refInput.type = originalRefType;
        dateInput.type = originalDateType;
        refInput.value = originalRefValue;
        dateInput.value = originalDateValue;
        refInput.removeAttribute('readonly');
        dateInput.removeAttribute('readonly');
        refInput.style.border = '';
        dateInput.style.border = '';
    }, 500);
}
