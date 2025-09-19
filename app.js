// app.js

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA0F2nv7urXkpZHdhNpqNwME_iJhot1_CQ",
    authDomain: "inventario-8b3cf.firebaseapp.com",
    projectId: "inventario-8b3cf",
    storageBucket: "inventario-8b3cf.firebasestorage.app",
    messagingSenderId: "312984675671",
    appId: "1:312984675671:web:06212810c9da335c740a12",
    measurementId: "G-C0CR5JZ3C2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const itemsCollection = db.collection('items');

let inventory = []; // This will hold the current state of the inventory, loaded from Firestore

// --- Client-Side "Authentication" (NOT SECURE) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '1403730359'; // Simple string hash of 'password123'
let isLoggedIn = false;

function simpleStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString();
}

async function login(username, password) {
    console.log('Attempting login with:', { username, password });
    if (username === ADMIN_USERNAME) {
        const hashedPassword = simpleStringHash(password);
        console.log('Generated hash for password:', hashedPassword);
        if (hashedPassword === ADMIN_PASSWORD_HASH) {
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true'); // Keep login status in localStorage
            showToast('Inicio de sesión exitoso.', 'success');
            return true;
        }
    }
    showToast('Usuario o contraseña incorrectos.', 'error');
    return false;
}

function logout() {
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    showToast('Sesión cerrada.', 'info');
    updateAuthUI();
    updateView();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const addNewItemBtn = document.getElementById('addNewItemBtn');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        addNewItemBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        addNewItemBtn.style.display = 'none';
    }
}

// --- Firestore Data Functions ---

/**
 * Uploads the initial data from data.json to Firestore.
 * This is a one-time operation.
 */
async function uploadInitialDataToFirestore() {
    try {
        showToast('Subiendo datos iniciales a Firebase... Esto puede tardar un momento.', 'info');
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const initialData = await response.json();

        const batch = db.batch();

        initialData.forEach(item => {
            // Use 'referencia' as the document ID
            const docRef = itemsCollection.doc(item.referencia);
            batch.set(docRef, item);
        });

        await batch.commit();
        showToast('¡Datos iniciales subidos a Firestore exitosamente!', 'success');
        await loadInventory(); // Reload inventory from Firestore
        updateView();
    } catch (error) {
        console.error('Error uploading initial data:', error);
        showToast('Error al subir los datos iniciales. Revisa la consola para más detalles.', 'error');
    }
}


/**
 * Loads inventory data from Firestore.
 */
async function loadInventory() {
    try {
        showToast('Cargando inventario desde la nube...', 'info');
        const snapshot = await itemsCollection.get();
        if (snapshot.empty) {
            showToast('No se encontraron artículos en la base de datos. ¿Necesitas subir los datos iniciales?', 'warning');
            inventory = [];
        } else {
            // Sanitize data on load to prevent type issues
            inventory = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    exhibidor: parseInt(data.exhibidor, 10) || 0,
                    bodega: parseInt(data.bodega, 10) || 0,
                    vendidos: parseInt(data.vendidos, 10) || 0,
                    precio_unitario: parseFloat(data.precio_unitario) || 0,
                    valor_total_iva: parseFloat(data.valor_total_iva) || 0
                };
            });
            showToast('Inventario cargado exitosamente.', 'success');
        }
    } catch (error) {
        console.error("Error loading inventory from Firestore: ", error);
        showToast('Error al cargar el inventario desde la nube. Revisa la consola.', 'error');
        inventory = []; // Fallback to empty inventory
    }
    // Check login status from localStorage
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Updates a specific item in Firestore.
 * @param {string} docId - The document ID (referencia) of the item to update.
 * @param {object} updatedData - An object with the fields to update.
 */
async function updateItemInFirestore(docId, updatedData) {
    try {
        await itemsCollection.doc(docId).update(updatedData);
    } catch (error) {
        console.error("Error updating item: ", error);
        showToast(`Error al guardar el cambio para ${docId}. El cambio podría no ser permanente.`, 'error');
    }
}

/**
 * Adds a new item to Firestore.
 * @param {object} newItem - The new item object to add.
 */
async function addNewItemToFirestore(newItem) {
    try {
        // Use 'referencia' as the document ID
        await itemsCollection.doc(newItem.referencia).set(newItem);
    } catch (error) {
        console.error("Error adding new item: ", error);
        showToast(`Error al añadir el nuevo artículo. El cambio podría no ser permanente.`, 'error');
    }
}


// 3. Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function showToast(message, type = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
}

// 4. Rendering and View Update Functions
function renderInventory(dataToRender) {
    const inventoryTableBody = document.querySelector('#inventoryTable tbody');
    inventoryTableBody.innerHTML = '';

    let totalExhibidor = 0;
    let totalBodega = 0;
    let totalVendidos = 0;
    let totalVentasCOP = 0;

    const itemsToRender = dataToRender || [];

    itemsToRender.forEach(item => {
        item.precio_en_ventas = (parseInt(item.vendidos, 10) || 0) * (parseFloat(item.valor_total_iva) || 0);

        const row = inventoryTableBody.insertRow();
        row.dataset.reference = item.referencia;

        let actionsHtml = `
            <button class="btn-sell" data-reference="${item.referencia}" data-action="sell">Vender</button>
            <button class="btn-move" data-reference="${item.referencia}" data-action="moveToExhibidor">Mover a Exhibidor</button>
            <button class="btn-move" data-reference="${item.referencia}" data-action="moveToBodega">Mover a Bodega</button>
            <button class="btn-add-remove" data-reference="${item.referencia}" data-action="addUnit">+ Añadir</button>
            <button class="btn-add-remove" data-reference="${item.referencia}" data-action="removeUnit">- Quitar</button>
            <button class="btn-danger" data-reference="${item.referencia}" data-action="undoSell">Anular Venta</button>
        `;

        if (isLoggedIn) {
            actionsHtml += `<button class="btn-primary" data-reference="${item.referencia}" data-action="edit">Editar</button>`;
        }

        row.innerHTML = `
            <td data-field="referencia">${item.referencia}</td>
            <td data-field="descripcion">${item.descripcion}</td>
            <td data-field="precio_unitario">${formatCurrency(item.precio_unitario)}</td>
            <td data-field="exhibidor">${item.exhibidor}</td>
            <td data-field="bodega">${item.bodega}</td>
            <td data-field="vendidos">${item.vendidos}</td>
            <td data-field="precio_en_ventas">${formatCurrency(item.precio_en_ventas)}</td>
            <td data-field="valor_total_iva">${formatCurrency(item.valor_total_iva || 0)}</td>
            <td>${actionsHtml}</td>
        `;

        totalExhibidor += parseInt(item.exhibidor, 10) || 0;
        totalBodega += parseInt(item.bodega, 10) || 0;
        totalVendidos += parseInt(item.vendidos, 10) || 0;
        totalVentasCOP += item.precio_en_ventas;
    });

    document.getElementById('totalExhibidor').textContent = totalExhibidor;
    document.getElementById('totalBodega').textContent = totalBodega;
    document.getElementById('totalVendidos').textContent = totalVendidos;
    document.getElementById('totalVentasCOP').textContent = formatCurrency(totalVentasCOP);

    inventoryTableBody.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', handleAction);
    });
}

function updateView() {
    let filteredInventory = [...inventory];

    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredInventory = filteredInventory.filter(item => {
            const referencia = String(item.referencia).toLowerCase();
            const descripcion = item.descripcion.toLowerCase();
            return referencia.includes(searchTerm) || descripcion.includes(searchTerm);
        });
    }

    const sortValue = document.getElementById('sortSelect').value;
    if (sortValue !== 'none') {
        const match = sortValue.match(/(\w+)(Asc|Desc)/);
        if (match) {
            const [, field, order] = match;
            filteredInventory.sort((a, b) => {
                let valA = a[field];
                let valB = b[field];
                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }
                if (valA < valB) return order === 'Asc' ? -1 : 1;
                if (valA > valB) return order === 'Asc' ? 1 : -1;
                return 0;
            });
        }
    }
    renderInventory(filteredInventory);
}

// 5. Action Handlers
async function handleAction(event) {
    const button = event.target;
    const reference = button.dataset.reference;
    const action = button.dataset.action;
    const itemIndex = inventory.findIndex(item => item.referencia === reference);

    if (itemIndex === -1) {
        showToast('Artículo no encontrado.', 'error');
        return;
    }

    const item = inventory[itemIndex];

    // Actions that don't need immediate save
    if (action === 'edit') {
        if (isLoggedIn) {
            const row = button.closest('tr');
            toggleEditMode(row, item);
        } else {
            showToast('Debe iniciar sesión para editar artículos.', 'warning');
        }
        return; // No save/render, handled by edit functions
    }
    if (action === 'cancelEdit') {
        cancelEdit(button.closest('tr'), item);
        return; // No save/render
    }

    // Actions that modify data
    let updatedData = null;
    switch (action) {
        case 'sell':
            updatedData = sellItem(item);
            break;
        case 'moveToExhibidor':
            updatedData = moveUnits(item, 'bodega', 'exhibidor', 1);
            break;
        case 'moveToBodega':
            updatedData = moveUnits(item, 'exhibidor', 'bodega', 1);
            break;
        case 'addUnit':
            updatedData = addUnit(item, 'bodega', 1);
            break;
        case 'removeUnit':
            updatedData = removeUnit(item, 'bodega', 1);
            break;
        case 'undoSell':
            updatedData = undoSell(item);
            break;
        case 'saveEdit':
            // saveEditedItem handles its own update and UI refresh
            await saveEditedItem(button.closest('tr'), item);
            return; // Exit here
        default:
            showToast('Acción no reconocida.', 'error');
            return;
    }

    if (updatedData) {
        // Update local inventory array
        Object.assign(item, updatedData);
        // Persist change to Firestore
        await updateItemInFirestore(item.referencia, updatedData);
    }

    updateView();
}

// --- Action Implementations ---
// These functions now return an object with the fields that changed.

function sellItem(item) {
    const exhibidor = parseInt(item.exhibidor, 10) || 0;
    const bodega = parseInt(item.bodega, 10) || 0;
    const vendidos = parseInt(item.vendidos, 10) || 0;

    if (exhibidor > 0) {
        showToast(`1 unidad de ${item.descripcion} vendida desde exhibidor.`, 'success');
        return {
            exhibidor: exhibidor - 1,
            vendidos: vendidos + 1
        };
    } else if (bodega > 0) {
        showToast(`1 unidad de ${item.descripcion} vendida desde bodega.`, 'success');
        return {
            bodega: bodega - 1,
            vendidos: vendidos + 1
        };
    } else {
        showToast(`No hay unidades de ${item.descripcion} para vender.`, 'error');
        return null;
    }
}

function moveUnits(item, from, to, quantity) {
    const fromValue = parseInt(item[from], 10) || 0;
    const toValue = parseInt(item[to], 10) || 0;

    if (fromValue >= quantity) {
        showToast(`${quantity} unidad(es) de ${item.descripcion} movida(s) de ${from} a ${to}.`, 'success');
        return {
            [from]: fromValue - quantity,
            [to]: toValue + quantity
        };
    } else {
        showToast(`No hay suficientes unidades en ${from} para mover.`, 'error');
        return null;
    }
}

function addUnit(item, location, quantity) {
    showToast(`${quantity} unidad(es) añadida(s) a ${location} para ${item.descripcion}.`, 'success');
    const newLocationValue = (parseInt(item[location], 10) || 0) + quantity;
    return {
        [location]: newLocationValue
    };
}

function removeUnit(item, location, quantity) {
    const locationValue = parseInt(item[location], 10) || 0;
    if (locationValue >= quantity) {
        showToast(`${quantity} unidad(es) quitada(s) de ${location} para ${item.descripcion}.`, 'success');
        return {
            [location]: locationValue - quantity
        };
    } else {
        showToast(`No hay suficientes unidades en ${location} para quitar.`, 'error');
        return null;
    }
}

function undoSell(item) {
    const vendidos = parseInt(item.vendidos, 10) || 0;

    if (vendidos > 0) {
        showToast(`1 unidad de ${item.descripcion} devuelta de vendidos a bodega.`, 'success');
        return {
            vendidos: vendidos - 1,
            bodega: (parseInt(item.bodega, 10) || 0) + 1
        };
    } else {
        showToast(`No hay unidades vendidas de ${item.descripcion} para anular.`, 'error');
        return null;
    }
}

function exportCSV() {
    const headers = ["referencia", "descripcion", "precio_unitario", "exhibidor", "bodega", "vendidos", "precio_en_ventas", "valor_total_iva"];
    const csvRows = [headers.join(',')];
    inventory.forEach(item => {
        // Calculate precio_en_ventas dynamically
        item.precio_en_ventas = (parseInt(item.vendidos, 10) || 0) * (parseFloat(item.valor_total_iva) || 0); // Ensure this is calculated
        
        const rowData = {
            ...item,
        };

        const values = headers.map(header => {
            const value = rowData[header];
            return (typeof value === 'string' && value.includes(',')) ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'inventario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventario exportado a CSV.', 'success');
}

// --- Add/Edit Item Functionality ---

function showAddItemModal() {
    if (!isLoggedIn) {
        showToast('Debe iniciar sesión para añadir nuevos artículos.', 'warning');
        return;
    }
    document.getElementById('addNewItemForm').reset();
    document.getElementById('addNewItemModal').style.display = 'block';
}

function hideAddItemModal() {
    document.getElementById('addNewItemModal').style.display = 'none';
}

async function handleAddNewItem(event) {
    event.preventDefault();
    const form = document.getElementById('addNewItemForm');
    const precio_unitario = parseFloat(form.precio_unitario.value);

    const newItem = {
        referencia: form.referencia.value,
        descripcion: form.descripcion.value,
        precio_unitario: precio_unitario,
        exhibidor: parseInt(form.exhibidor.value, 10) || 0,
        bodega: parseInt(form.bodega.value, 10) || 0,
        vendidos: 0,
        valor_total_iva: (precio_unitario * 1.6) + 15000
    };

    if (inventory.some(item => item.referencia === newItem.referencia)) {
        showToast('Ya existe un artículo con esta referencia.', 'error');
        return;
    }
    if (isNaN(newItem.precio_unitario) || isNaN(newItem.exhibidor) || isNaN(newItem.bodega) || newItem.precio_unitario <= 0 || newItem.exhibidor < 0 || newItem.bodega < 0) {
        showToast('Por favor, ingrese valores numéricos válidos y positivos.', 'error');
        return;
    }

    // Add to local array
    inventory.push(newItem);
    // Add to Firestore
    await addNewItemToFirestore(newItem);

    updateView();
    hideAddItemModal();
    showToast('Artículo añadido exitosamente.', 'success');
}

function toggleEditMode(row, item) {
    row.classList.add('editing');
    row.querySelectorAll('td[data-field]').forEach(cell => {
        const field = cell.dataset.field;
        let value = item[field];
        if (field === 'precio_unitario') value = item.precio_unitario;
        const inputType = (field === 'precio_unitario' || field === 'exhibidor' || field === 'bodega') ? 'number' : 'text';
        const readOnlyAttr = (field === 'referencia') ? 'readonly' : '';
        cell.innerHTML = `<input type="${inputType}" value="${value}" data-field="${field}" ${readOnlyAttr}>`;
    });

    const actionsCell = row.querySelector('td:last-child');
    actionsCell.innerHTML = `
        <button class="btn-success" data-reference="${item.referencia}" data-action="saveEdit">Guardar</button>
        <button class="btn-danger" data-reference="${item.referencia}" data-action="cancelEdit">Cancelar</button>
    `;
    actionsCell.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', handleAction);
    });
}

async function saveEditedItem(row, item) {
    const inputs = row.querySelectorAll('td input');
    let updatedFields = {};
    let hasError = false;

    inputs.forEach(input => {
        const field = input.dataset.field;
        let value = input.value;
        if (field === 'precio_unitario' || field === 'exhibidor' || field === 'bodega') {
            value = parseFloat(value);
            if (isNaN(value) || value < 0) {
                showToast(`Valor inválido para ${field}.`, 'error');
                hasError = true;
            }
        }
        if (item[field] !== value) {
            updatedFields[field] = value;
        }
    });

    if (hasError) return;

    // Recalculate valor_total_iva if precio_unitario has changed
    if (updatedFields.hasOwnProperty('precio_unitario')) {
        updatedFields.valor_total_iva = (updatedFields.precio_unitario * 1.6) + 15000;
    }

    if (Object.keys(updatedFields).length > 0) {
        // Update local data
        const itemIndex = inventory.findIndex(invItem => invItem.referencia === item.referencia);
        if (itemIndex !== -1) {
            Object.assign(inventory[itemIndex], updatedFields);
            // Persist to Firestore
            await updateItemInFirestore(item.referencia, updatedFields);
            showToast('Artículo actualizado exitosamente.', 'success');
        } else {
            showToast('Error al encontrar el artículo para actualizar.', 'error');
        }
    } else {
        showToast('No se realizaron cambios.', 'info');
    }
    updateView();
}

function cancelEdit(row, item) {
    showToast('Edición cancelada.', 'info');
    updateView();
}

// 7. Event Listeners (Global Controls)
document.addEventListener('DOMContentLoaded', async () => {
    await loadInventory();
    updateAuthUI();
    updateView();

    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('searchInput').addEventListener('input', updateView);
    document.getElementById('sortSelect').addEventListener('change', updateView);
    document.getElementById('uploadDataBtn').addEventListener('click', uploadInitialDataToFirestore);

    // --- Modals and Auth ---
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeLoginBtn = loginModal.querySelector('.close-button');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    closeLoginBtn.addEventListener('click', () => loginModal.style.display = 'none');
    logoutBtn.addEventListener('click', logout);

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) loginModal.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const success = await login(loginForm.username.value, loginForm.password.value);
        if (success) {
            loginModal.style.display = 'none';
            updateAuthUI();
            updateView();
        }
        loginForm.reset();
    });

    const addNewItemModal = document.getElementById('addNewItemModal');
    const addNewItemBtn = document.getElementById('addNewItemBtn');
    const closeAddBtn = addNewItemModal.querySelector('.close-button');
    const addNewItemForm = document.getElementById('addNewItemForm');

    addNewItemBtn.addEventListener('click', showAddItemModal);
    closeAddBtn.addEventListener('click', hideAddItemModal);
    addNewItemForm.addEventListener('submit', handleAddNewItem);

    window.addEventListener('click', (event) => {
        if (event.target === addNewItemModal) hideAddItemModal();
    });
});
