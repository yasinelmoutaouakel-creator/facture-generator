let currency = 'MAD';
let tvaRate = 20;

// Fonction pour générer le numéro de facture automatique
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const lastNumber = parseInt(localStorage.getItem('lastInvoiceNumber') || '0');
    const newNumber = lastNumber + 1;
    localStorage.setItem('lastInvoiceNumber', newNumber.toString());
    return `${year}-${String(newNumber).padStart(4, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.getElementById('doc-date').value = new Date().toISOString().split('T')[0];
    // Auto-générer le numéro de facture
    document.getElementById('doc-ref').value = generateInvoiceNumber();
    addItem();
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
        // Vider tous les inputs du formulaire
        document.querySelectorAll('input[type="text"], textarea').forEach(input => {
            input.value = '';
        });
        
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
        filename: `facture_${docRef.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 2.5,
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            windowHeight: element.scrollHeight,
            backgroundColor: '#ffffff'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: false
        },
        pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy']
        }
    };
    
    try {
        await html2pdf().set(opt).from(element).save();
        
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
