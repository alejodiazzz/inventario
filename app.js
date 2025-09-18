// app.js

// 1. Initial Data
// 1. Initial Data (now loaded from data.json)
// const initialInventoryData = [...]; // Removed, now fetched

let inventory = []; // This will hold the current state of the inventory

// --- Client-Side "Authentication" (NOT SECURE) ---
// For demonstration purposes only. In a real application, authentication requires a backend.
// Admin Username: admin
// Admin Password: password123
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '1403730359'; // Simple string hash of 'password123'

let isLoggedIn = false;

// Simple (NON-CRYPTOGRAPHIC) hashing function for file:// context compatibility
// NOT SECURE. For demonstration purposes only.
function simpleStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char; // hash * 31 + char
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(); // Return as string
}

/**
 * Attempts to log in the user.
 * @param {string} username - The entered username.
 * @param {string} password - The entered password.
 * @returns {Promise<boolean>} True if login is successful, false otherwise.
 */
async function login(username, password) {
    console.log('Attempting login with:', { username, password });
    if (username === ADMIN_USERNAME) {
        const hashedPassword = simpleStringHash(password); // Use simple hash
        console.log('Generated hash for password:', hashedPassword);
        if (hashedPassword === ADMIN_PASSWORD_HASH) {
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            showToast('Inicio de sesión exitoso.', 'success');
            return true;
        }
    }
    showToast('Usuario o contraseña incorrectos.', 'error');
    return false;
}

/**
 * Logs out the current user.
 */
function logout() {
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    showToast('Sesión cerrada.', 'info');
    updateAuthUI();
    updateView(); // Re-render to hide edit buttons
}

/**
 * Updates the visibility of authentication-related UI elements.
 */
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

// 2. localStorage Functions
/**
 * Loads inventory data from localStorage. If no data is found, it fetches from data.json.
 */
async function loadInventory() {
    const storedInventory = localStorage.getItem('inventoryData');
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
    } else {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            inventory = data;
            saveInventory();
            showToast('Datos iniciales cargados desde data.json.', 'info');
        } catch (error) {
            console.error('Error loading initial data from data.json:', error);
            showToast('Error al cargar los datos iniciales. Asegúrese de que la aplicación se ejecuta en un servidor web.', 'error');
            // Fallback to empty inventory if data.json fails
            inventory = [];
        }
    }
    // Check login status from localStorage
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Saves the current inventory data to localStorage.
 */
function saveInventory() {
    localStorage.setItem('inventoryData', JSON.stringify(inventory));
}

// 3. Utility Functions
/**
 * Formats a number as Colombian Pesos (COP).
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

/**
 * Displays a simple toast message (for now, using alert).
 * @param {string} message - The message to display.
 * @param {string} type - Type of message (e.g., 'success', 'error').
 */
function showToast(message, type = 'info') {
    // In a real application, this would be a more sophisticated toast notification.
    alert(`${type.toUpperCase()}: ${message}`);
}

// 4. Rendering and View Update Functions
/**
 * Renders the inventory table and updates summary indicators based on the provided data.
 * @param {Array} dataToRender - The array of inventory items to display.
 */
function renderInventory(dataToRender) {
    const inventoryTableBody = document.querySelector('#inventoryTable tbody');
    inventoryTableBody.innerHTML = ''; // Clear existing rows

    let totalExhibidor = 0;
    let totalBodega = 0;
    let totalVendidos = 0;
    let totalVentasCOP = 0;

    // If no data is provided, which can happen if the filter returns empty, show nothing.
    const itemsToRender = dataToRender || [];

    itemsToRender.forEach(item => {
        // Calculate precio_en_ventas dynamically
        item.precio_en_ventas = item.vendidos * item.precio_unitario;

        const row = inventoryTableBody.insertRow();
        row.dataset.reference = item.referencia; // Add data-reference to row for easier access

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
            <td>${actionsHtml}</td>
        `;

        totalExhibidor += item.exhibidor;
        totalBodega += item.bodega;
        totalVendidos += item.vendidos;
        totalVentasCOP += item.precio_en_ventas;
    });

    // Update summary indicators
    document.getElementById('totalExhibidor').textContent = totalExhibidor;
    document.getElementById('totalBodega').textContent = totalBodega;
    document.getElementById('totalVendidos').textContent = totalVendidos;
    document.getElementById('totalVentasCOP').textContent = formatCurrency(totalVentasCOP);

    // Attach event listeners to new buttons (delegation is better for performance)
    inventoryTableBody.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', handleAction);
    });
}

/**
 * Filters, sorts, and then renders the inventory based on UI controls.
 */
function updateView() {
    let filteredInventory = [...inventory]; // Start with a copy of the full inventory

    // 1. Filter by search term
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredInventory = filteredInventory.filter(item => {
            const referencia = String(item.referencia).toLowerCase();
            const descripcion = item.descripcion.toLowerCase();
            return referencia.includes(searchTerm) || descripcion.includes(searchTerm);
        });
    }

    // 2. Sort the data
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

                if (valA < valB) {
                    return order === 'Asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return order === 'Asc' ? 1 : -1;
                }
                return 0;
            });
        }
    }

    // 3. Render the final data
    renderInventory(filteredInventory);
}


// 5. Action Handlers
/**
 * Handles various actions triggered by buttons in the inventory table.
 * @param {Event} event - The click event.
 */
function handleAction(event) {
    const button = event.target;
    const reference = button.dataset.reference;
    const action = button.dataset.action;
    const itemIndex = inventory.findIndex(item => item.referencia === reference);

    if (itemIndex === -1 && action !== 'addNewItem') { // 'addNewItem' doesn't have a reference yet
        showToast('Artículo no encontrado.', 'error');
        return;
    }

    const item = inventory[itemIndex]; // item will be undefined for 'addNewItem' initially

    switch (action) {
        case 'sell':
            sellItem(item);
            break;
        case 'moveToExhibidor':
            moveUnits(item, 'bodega', 'exhibidor', 1);
            break;
        case 'moveToBodega':
            moveUnits(item, 'exhibidor', 'bodega', 1);
            break;
        case 'addUnit':
            // For simplicity, adding to bodega. Could implement a modal for choice.
            addUnit(item, 'bodega', 1);
            break;
        case 'removeUnit':
            // For simplicity, removing from bodega. Could implement a modal for choice.
            removeUnit(item, 'bodega', 1);
            break;
        case 'undoSell':
            undoSell(item);
            break;
        case 'edit':
            if (isLoggedIn) {
                const row = button.closest('tr');
                toggleEditMode(row, item);
            } else {
                showToast('Debe iniciar sesión para editar artículos.', 'warning');
            }
            return; // Do not save/render immediately, wait for save/cancel edit
        case 'saveEdit':
            const rowToSave = button.closest('tr');
            saveEditedItem(rowToSave, item);
            break;
        case 'cancelEdit':
            const rowToCancel = button.closest('tr');
            cancelEdit(rowToCancel, item);
            break;
        default:
            showToast('Acción no reconocida.', 'error');
    }
    saveInventory();
    updateView();
}

/**
 * Sells one unit of an item.
 * Prioritizes exhibidor, then bodega.
 * @param {object} item - The inventory item.
 */
function sellItem(item) {
    if (item.exhibidor > 0) {
        item.exhibidor--;
        item.vendidos++;
        showToast(`1 unidad de ${item.descripcion} vendida desde exhibidor.`, 'success');
    } else if (item.bodega > 0) {
        item.bodega--;
        item.vendidos++;
        showToast(`1 unidad de ${item.descripcion} vendida desde bodega.`, 'success');
    } else {
        showToast(`No hay unidades de ${item.descripcion} para vender.`, 'error');
    }
}

/**
 * Moves units between exhibidor and bodega.
 * @param {object} item - The inventory item.
 * @param {string} fromLocation - 'exhibidor' or 'bodega'.
 * @param {string} toLocation - 'exhibidor' or 'bodega'.
 * @param {number} quantity - The number of units to move.
 */
function moveUnits(item, fromLocation, toLocation, quantity) {
    if (item[fromLocation] >= quantity) {
        item[fromLocation] -= quantity;
        item[toLocation] += quantity;
        showToast(`${quantity} unidad(es) de ${item.descripcion} movida(s) de ${fromLocation} a ${toLocation}.`, 'success');
    } else {
        showToast(`No hay suficientes unidades en ${fromLocation} para mover.`, 'error');
    }
}

/**
 * Adds units to a specified location (exhibidor or bodega).
 * @param {object} item - The inventory item.
 * @param {string} location - 'exhibidor' or 'bodega'.
 * @param {number} quantity - The number of units to add.
 */
function addUnit(item, location, quantity) {
    item[location] += quantity;
    showToast(`${quantity} unidad(es) añadida(s) a ${location} para ${item.descripcion}.`, 'success');
}

/**
 * Removes units from a specified location (exhibidor or bodega).
 * @param {object} item - The inventory item.
 * @param {string} location - 'exhibidor' or 'bodega'.
 * @param {number} quantity - The number of units to remove.
 */
function removeUnit(item, location, quantity) {
    if (item[location] >= quantity) {
        item[location] -= quantity;
        showToast(`${quantity} unidad(es) quitada(s) de ${location} para ${item.descripcion}.`, 'success');
    } else {
        showToast(`No hay suficientes unidades en ${location} para quitar.`, 'error');
    }
}

/**
 * Undoes a sale, moving one unit from vendidos back to bodega or exhibidor.
 * Prioritizes bodega if available, otherwise exhibidor.
 * @param {object} item - The inventory item.
 */
function undoSell(item) {
    if (item.vendidos > 0) {
        item.vendidos--;
        // For simplicity, return to bodega. Could implement a modal for choice.
        item.bodega++;
        showToast(`1 unidad de ${item.descripcion} devuelta de vendidos a bodega.`, 'success');
    } else {
        showToast(`No hay unidades vendidas de ${item.descripcion} para anular.`, 'error');
    }
}

/**
 * Resets the inventory data to its initial state.
 */
async function resetData() {
    if (confirm('¿Está seguro que desea restablecer todos los datos del inventario? Esta acción no se puede deshacer.')) {
        try {
            showToast('Restableciendo datos desde data.json...', 'info');
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            inventory = await response.json(); // inventory is now the freshly fetched data
            saveInventory();
            updateView();
            showToast('Datos del inventario restablecidos exitosamente.', 'success');
        } catch (error) {
            console.error('Error resetting data from data.json:', error);
            showToast('Error al restablecer los datos. Verifique la consola para más detalles.', 'error');
        }
    }
}

/**
 * Exports the current inventory data to a CSV file.
 */
function exportCSV() {
    const headers = ["referencia", "descripcion", "precio_unitario", "exhibidor", "bodega", "vendidos", "precio_en_ventas"];
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    inventory.forEach(item => {
        const values = headers.map(header => {
            const value = item[header];
            // Handle commas in description by enclosing in quotes
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
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

// --- Add New Item Functionality ---
// Moved inside DOMContentLoaded to ensure elements exist

/**
 * Shows the modal for adding a new item.
 */
function showAddItemModal() {
    if (!isLoggedIn) {
        showToast('Debe iniciar sesión para añadir nuevos artículos.', 'warning');
        return;
    }
    const addNewItemModalElement = document.getElementById('addNewItemModal');
    const addNewItemForm = document.getElementById('addNewItemForm');
    // Reset form fields
    addNewItemForm.reset();
    addNewItemModalElement.style.display = 'block';
}

/**
 * Hides the modal for adding a new item.
 */
function hideAddItemModal() {
    const addNewItemModalElement = document.getElementById('addNewItemModal');
    addNewItemModalElement.style.display = 'none';
}

/**
 * Handles the submission of the add new item form.
 * @param {Event} event - The form submission event.
 */
function handleAddNewItem(event) {
    event.preventDefault();

    const addNewItemForm = document.getElementById('addNewItemForm');

    const newItem = {
        referencia: addNewItemForm.referencia.value,
        descripcion: addNewItemForm.descripcion.value,
        precio_unitario: parseFloat(addNewItemForm.precio_unitario.value),
        exhibidor: parseInt(addNewItemForm.exhibidor.value),
        bodega: parseInt(addNewItemForm.bodega.value),
        vendidos: 0 // New items start with 0 sold
    };

    // Basic validation
    if (inventory.some(item => item.referencia === newItem.referencia)) {
        showToast('Ya existe un artículo con esta referencia.', 'error');
        return;
    }
    if (isNaN(newItem.precio_unitario) || isNaN(newItem.exhibidor) || isNaN(newItem.bodega) || newItem.precio_unitario <= 0 || newItem.exhibidor < 0 || newItem.bodega < 0) {
        showToast('Por favor, ingrese valores numéricos válidos y positivos para precio, exhibidor y bodega.', 'error');
        return;
    }

    inventory.push(newItem);
    saveInventory();
    updateView();
    hideAddItemModal();
    showToast('Artículo añadido exitosamente.', 'success');
}


// --- Edit Item Functionality ---
/**
 * Toggles a table row between display mode and edit mode.
 * @param {HTMLTableRowElement} row - The table row to toggle.
 * @param {object} item - The inventory item associated with the row.
 */
function toggleEditMode(row, item) {
    const fields = ['referencia', 'descripcion', 'precio_unitario', 'exhibidor', 'bodega'];
    const cells = row.querySelectorAll('td[data-field]');
    const actionsCell = row.querySelector('td:last-child');

    if (row.classList.contains('editing')) { // Currently in edit mode, switch to display
        // This case should ideally not be reached if save/cancel buttons replace edit button
        // But as a fallback, it would revert to display
        updateView(); // Re-render the whole table to ensure consistency
    } else { // Switch to edit mode
        row.classList.add('editing');
        cells.forEach(cell => {
            const field = cell.dataset.field;
            let value = item[field];

            // Special handling for currency to remove formatting for editing
            if (field === 'precio_unitario') {
                value = item.precio_unitario; // Use raw number
            }

            let inputType = 'text';
            if (field === 'precio_unitario' || field === 'exhibidor' || field === 'bodega') {
                inputType = 'number';
            }

            // For 'referencia', make it read-only to prevent changing primary key
            const readOnlyAttr = (field === 'referencia') ? 'readonly' : '';

            cell.innerHTML = `<input type="${inputType}" value="${value}" data-field="${field}" ${readOnlyAttr}>`;
        });

        // Replace action buttons with Save and Cancel
        actionsCell.innerHTML = `
            <button class="btn-success" data-reference="${item.referencia}" data-action="saveEdit">Guardar</button>
            <button class="btn-danger" data-reference="${item.referencia}" data-action="cancelEdit">Cancelar</button>
        `;
        actionsCell.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', handleAction);
        });
    }
}

/**
 * Saves the edited item data from the row.
 * @param {HTMLTableRowElement} row - The table row being edited.
 * @param {object} item - The original inventory item.
 */
function saveEditedItem(row, item) {
    const inputs = row.querySelectorAll('td input');
    let updatedItem = { ...item }; // Create a copy to update

    inputs.forEach(input => {
        const field = input.dataset.field;
        let value = input.value;

        if (field === 'precio_unitario' || field === 'exhibidor' || field === 'bodega') {
            value = parseFloat(value);
            if (isNaN(value) || value < 0) {
                showToast(`Valor inválido para ${field}.`, 'error');
                return; // Prevent saving if validation fails
            }
        }
        updatedItem[field] = value;
    });

    // Validate if reference changed (should be readonly, but as a safeguard)
    if (updatedItem.referencia !== item.referencia) {
        showToast('No se puede cambiar la referencia de un artículo existente.', 'error');
        updateView(); // Re-render to discard changes
        return;
    }

    // Update the original item in the inventory array
    const itemIndex = inventory.findIndex(invItem => invItem.referencia === item.referencia);
    if (itemIndex !== -1) {
        inventory[itemIndex] = updatedItem;
        saveInventory();
        showToast('Artículo actualizado exitosamente.', 'success');
    } else {
        showToast('Error al encontrar el artículo para actualizar.', 'error');
    }
    updateView(); // Re-render to show updated data and exit edit mode
}

/**
 * Cancels the edit mode for a row and reverts changes.
 * @param {HTMLTableRowElement} row - The table row being edited.
 * @param {object} item - The original inventory item.
 */
function cancelEdit(row, item) {
    showToast('Edición cancelada.', 'info');
    updateView(); // Re-render the whole table to revert changes
}


// 7. Event Listeners (Global Controls)
document.addEventListener('DOMContentLoaded', async () => { // Made async to await loadInventory
    console.log('DOM Content Loaded.');
    await loadInventory(); // Await the loading of inventory
    updateAuthUI(); // Update UI based on initial login status
    updateView(); // Initial render

    document.getElementById('resetDataBtn').addEventListener('click', resetData);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('searchInput').addEventListener('input', updateView);
    document.getElementById('sortSelect').addEventListener('change', updateView);

    // --- Authentication Event Listeners ---
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeButton = loginModal ? loginModal.querySelector('.close-button') : null;
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    console.log('loginBtn element:', loginBtn);
    console.log('loginModal element:', loginModal);

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked.');
            if (loginModal) {
                loginModal.style.display = 'block';
                console.log('Login modal display set to block.');
            } else {
                console.error('Login modal element not found.');
            }
        });
    } else {
        console.error('Login button element not found.');
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('Close button clicked.');
            if (loginModal) {
                loginModal.style.display = 'none';
                console.log('Login modal display set to none.');
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            console.log('Clicked outside login modal.');
            loginModal.style.display = 'none';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Login form submitted.');
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            const success = await login(usernameInput, passwordInput);
            if (success) {
                loginModal.style.display = 'none';
                updateAuthUI();
                updateView(); // Re-render to show edit buttons
            }
            loginForm.reset(); // Clear form fields
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // --- Add New Item Event Listener ---
    const addNewItemBtn = document.getElementById('addNewItemBtn');
    console.log('addNewItemBtn element:', addNewItemBtn);
    if (addNewItemBtn) {
        addNewItemBtn.addEventListener('click', showAddItemModal);
    }

    const addNewItemModalElement = document.getElementById('addNewItemModal');
    const closeAddNewItemButton = addNewItemModalElement ? addNewItemModalElement.querySelector('.close-button') : null;
    const addNewItemForm = document.getElementById('addNewItemForm');

    console.log('addNewItemModalElement element:', addNewItemModalElement);
    console.log('closeAddNewItemButton element:', closeAddNewItemButton);
    console.log('addNewItemForm element:', addNewItemForm);

    if (closeAddNewItemButton) {
        closeAddNewItemButton.addEventListener('click', hideAddItemModal);
    }

    if (addNewItemModalElement) {
        window.addEventListener('click', (event) => {
            if (event.target === addNewItemModalElement) {
                hideAddItemModal();
            }
        });
    }

    if (addNewItemForm) {
        addNewItemForm.addEventListener('submit', handleAddNewItem);
    }
});