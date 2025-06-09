// Global variables
let currentChart = null;
let allProductData = [];

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    loadProducts();
    
    // Add event listener for the add price form
    const addPriceForm = document.getElementById('addPriceForm');
    if (addPriceForm) {
        addPriceForm.addEventListener('submit', handleAddPrice);
    }
});

// Load all available products from the API
async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('Products loaded:', products);
        
        const productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = '<option value="">請選擇產品</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.product_name;
            option.textContent = product.product_name;
            productSelect.appendChild(option);
        });
        
        console.log('Product dropdown populated');
    } catch (error) {
        console.error('Error loading products:', error);
        showError('載入產品清單失敗');
    }
}

// Handle product selection change
async function handleProductChange() {
    const selectedProduct = document.getElementById('productSelect').value;
    console.log('Product changed to:', selectedProduct);
    
    if (!selectedProduct) {
        hideElements(['yearSelectionContainer', 'dataTableContainer', 'chartContainer']);
        return;
    }
    
    try {
        // Load years for the selected product
        const response = await fetch(`/api/years/${encodeURIComponent(selectedProduct)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const years = await response.json();
        console.log('Years loaded for', selectedProduct, ':', years);
        
        populateYearDropdowns(years);
        document.getElementById('yearSelectionContainer').style.display = 'block';
        
        // Hide data and chart until year range is selected
        hideElements(['dataTableContainer', 'chartContainer']);
        
    } catch (error) {
        console.error('Error loading years:', error);
        showError('載入年份資料失敗');
    }
}

// Populate start and end year dropdowns
function populateYearDropdowns(years) {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    // Clear existing options
    startYearSelect.innerHTML = '<option value="">請選擇起始年份</option>';
    endYearSelect.innerHTML = '<option value="">請選擇結束年份</option>';
    
    years.forEach(yearObj => {
        const year = yearObj.year;
        
        // Add to start year dropdown
        const startOption = document.createElement('option');
        startOption.value = year;
        startOption.textContent = year;
        startYearSelect.appendChild(startOption);
        
        // Add to end year dropdown
        const endOption = document.createElement('option');
        endOption.value = year;
        endOption.textContent = year;
        endYearSelect.appendChild(endOption);
    });
}

// Handle year range selection change
async function handleYearRangeChange() {
    const selectedProduct = document.getElementById('productSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    
    console.log('Year range changed:', startYear, 'to', endYear);
    
    if (!selectedProduct || !startYear || !endYear) {
        hideElements(['dataTableContainer', 'chartContainer']);
        return;
    }
    
    if (parseInt(startYear) > parseInt(endYear)) {
        showError('起始年份不能大於結束年份');
        return;
    }
    
    try {
        await loadPriceData(selectedProduct, startYear, endYear);
    } catch (error) {
        console.error('Error in handleYearRangeChange:', error);
        showError('載入價格資料失敗');
    }
}

// Load price data for the selected product and year range
async function loadPriceData(productName, startYear, endYear) {
    try {
        console.log('Loading price data for:', productName, startYear, 'to', endYear);
        
        const response = await fetch(`/api/prices/${encodeURIComponent(productName)}?startYear=${startYear}&endYear=${endYear}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const priceData = await response.json();
        console.log('Price data loaded:', priceData);
        
        if (priceData.length === 0) {
            showError('查無此產品在指定年份範圍內的價格資料');
            hideElements(['dataTableContainer', 'chartContainer']);
            return;
        }
        
        allProductData = priceData;
        displayDataTable(priceData);
        displayChart(priceData, productName);
        
        // Show the containers
        document.getElementById('dataTableContainer').style.display = 'block';
        document.getElementById('chartContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading price data:', error);
        showError('載入價格資料失敗');
    }
}

// Display data in the table
function displayDataTable(data) {
    const tableBody = document.getElementById('priceTableBody');
    tableBody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year || 'N/A'}</td>
            <td>${row.product_name || 'N/A'}</td>
            <td class="text-end">${formatPrice(row.price_per_kg)}</td>
            <td>${row.unit || 'N/A'}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    console.log('Data table populated with', data.length, 'rows');
}

// Display price trend chart
function displayChart(data, productName) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }
      // Prepare data for the chart
    const chartData = data.map(row => ({
        x: row.year,
        y: parseFloat(row.price_per_kg) || 0
    })).sort((a, b) => a.x - b.x);
    
    const years = chartData.map(item => item.x);
    const prices = chartData.map(item => item.y);
    
    console.log('Chart data prepared:', chartData);
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: `${productName} 平均價格`,
                data: prices,
                borderColor: '#005a87',
                backgroundColor: 'rgba(0, 90, 135, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.2,
                pointBackgroundColor: '#005a87',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${productName} 歷年價格趨勢`,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#005a87'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '年份',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: '#e1e5e8'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '平均價格 (元)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: '#e1e5e8'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatPrice(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatPrice(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Chart created successfully');
}

// Utility function to format price
function formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return 'N/A';
    }
    return parseFloat(price).toLocaleString('zh-TW', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Utility function to hide elements
function hideElements(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Show error message to user with enhanced styling
function showError(message) {
    // Create or update error alert
    let errorAlert = document.getElementById('errorAlert');
    if (!errorAlert) {
        errorAlert = document.createElement('div');
        errorAlert.id = 'errorAlert';
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">⚠️</span>
                <div>
                    <strong>錯誤：</strong> <span id="errorMessage"></span>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="關閉"></button>
        `;
        document.querySelector('.container').insertBefore(errorAlert, document.querySelector('h1').nextSibling);
    }
    
    document.getElementById('errorMessage').textContent = message;
    errorAlert.style.display = 'block';
    errorAlert.classList.add('fade-in');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorAlert) {
            errorAlert.style.display = 'none';
        }
    }, 5000);
    
    console.error('Error shown to user:', message);
}

// Add some debugging functions for development
window.debugAPI = {
    testConnection: async function() {
        try {
            const response = await fetch('/api/debug/schema');
            const result = await response.json();
            console.log('API Connection Test:', result);
            return result;
        } catch (error) {
            console.error('API Connection Test Failed:', error);
            return error;
        }
    },
    
    sampleData: async function() {
        try {
            const response = await fetch('/api/debug/prices');
            const result = await response.json();
            console.log('Sample Data:', result);
            return result;
        } catch (error) {
            console.error('Sample Data Test Failed:', error);
            return error;
        }
    }
};

console.log('Script loaded successfully. Use window.debugAPI for testing.');

// Mode switching functions for query and add modes
function switchMode(mode) {
    const queryBtn = document.getElementById('queryModeBtn');
    const addBtn = document.getElementById('addModeBtn');
    const querySection = document.getElementById('querySection');
    const addSection = document.getElementById('addSection');
    
    if (mode === 'query') {
        queryBtn.classList.add('active');
        addBtn.classList.remove('active');
        querySection.style.display = 'block';
        addSection.style.display = 'none';
        // Hide data table and chart when switching to query mode
        hideElements(['dataTableContainer', 'chartContainer']);
    } else if (mode === 'add') {
        addBtn.classList.add('active');
        queryBtn.classList.remove('active');
        querySection.style.display = 'none';
        addSection.style.display = 'block';
        // Hide data table and chart when switching to add mode
        hideElements(['dataTableContainer', 'chartContainer']);
        // Hide any existing messages
        hideMessage();
        // Load products for the add form dropdown
        loadProductsForAddForm();
    }
}

// Handle form submission for adding new price data
// Handle adding new price data
async function handleAddPrice(event) {
    event.preventDefault();
    
    const productName = document.getElementById('newProductSelect').value.trim();
    const year = parseInt(document.getElementById('newYear').value);
    const price = parseFloat(document.getElementById('newPrice').value);
    const unit = document.getElementById('newUnit').value.trim();
    
    // Validate input
    if (!productName || !year || !price || !unit) {
        showMessage('請填寫所有欄位', 'danger');
        return;
    }
    
    if (year < 100 || year > 150) {
        showMessage('年份必須在 100-150 之間（民國年）', 'danger');
        return;
    }
    
    if (price <= 0) {
        showMessage('價格必須大於 0', 'danger');
        return;
    }
    
    try {
        console.log('Adding new price data:', { productName, year, price, unit });
        
        const response = await fetch('/api/fish-prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_name: productName,
                year: year,
                price_per_kg: price,
                unit: unit
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(result.message || '資料新增成功！', 'success');
            // Clear the form
            document.getElementById('addPriceForm').reset();
            document.getElementById('newUnit').value = '元/公斤'; // Reset unit to default
            
            // Reload products in case a new product was added
            await loadProducts();
        } else {
            showMessage(result.error || '新增資料失敗', 'danger');
        }
        
    } catch (error) {
        console.error('Error adding price data:', error);
        showMessage('網路錯誤，請稍後再試', 'danger');
    }
}

// Show message in the add section with enhanced styling
function showMessage(message, type = 'info') {
    const messageArea = document.getElementById('messageArea');
    const messageContent = document.getElementById('messageContent');
    
    if (messageArea && messageContent) {
        // Map message types to Bootstrap alert classes with icons
        const typeConfig = {
            'success': { class: 'alert-success', icon: '✅' },
            'danger': { class: 'alert-danger', icon: '❌' },
            'warning': { class: 'alert-warning', icon: '⚠️' },
            'info': { class: 'alert-info', icon: 'ℹ️' }
        };
        
        const config = typeConfig[type] || typeConfig['info'];
        
        messageContent.className = `alert ${config.class}`;
        messageContent.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${config.icon}</span>
                <div>${message}</div>
            </div>
        `;
        messageArea.style.display = 'block';
        messageArea.classList.add('fade-in');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                hideMessage();
            }, 3000);
        }
    }
}

// Hide message in the add section
function hideMessage() {
    const messageArea = document.getElementById('messageArea');
    if (messageArea) {
        messageArea.style.display = 'none';
    }
}

// Load products for the add form dropdown
async function loadProductsForAddForm() {
    try {
        console.log('Loading products for add form...');
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('Products loaded for add form:', products);
        
        const newProductSelect = document.getElementById('newProductSelect');
        if (newProductSelect) {
            newProductSelect.innerHTML = '<option value="">請選擇產品</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.product_name;
                option.textContent = product.product_name;
                newProductSelect.appendChild(option);
            });
            
            console.log('Add form product dropdown populated');
        }
    } catch (error) {
        console.error('Error loading products for add form:', error);
        showMessage('載入產品清單失敗', 'danger');
    }
}