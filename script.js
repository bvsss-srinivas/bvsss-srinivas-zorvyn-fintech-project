// =======================
// State & Configuration
// =======================
const STORAGE_KEY = 'finDashTransactions';
const THEME_KEY = 'finDashTheme';
const PROFILE_KEY = 'finDashProfile';

// Advanced Feature: Exchange Rates Engine
const exchangeRates = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'INR': 83.20
};

// Initial Dummy Data if localStorage is empty
// Removed hardcoded defaultTransactions to simulate real API fetch

let transactions = []; // Populated via Mock API Call
let currentRole = 'admin'; // 'admin' or 'viewer'

const defaultProfile = { name: 'Admin User', email: 'admin@dash.test', currency: 'INR' };
let userProfile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || defaultProfile;

// Chart Instances
let balanceChartInstance = null;
let categoryChartInstance = null;
let comboChartInstance = null;

// =======================
// DOM Elements
// =======================
const els = {
    // Navigation
    navLinks: document.querySelectorAll('#navLinks .nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    pageTitle: document.getElementById('pageTitle'),

    dateDisplay: document.getElementById('currentDate'),
    themeToggleBtn: document.getElementById('themeToggle'),
    themeIcon: document.querySelector('.theme-icon'),
    themeText: document.querySelector('.theme-text'),
    roleSelect: document.getElementById('roleSelect'),
    
    // Cards
    totalBalance: document.getElementById('totalBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpenses: document.getElementById('totalExpenses'),
    netSavings: document.getElementById('netSavings'),
    
    // Insights
    dynamicInsight: document.getElementById('dynamicInsight'),
    topSpendingCategory: document.getElementById('topSpendingCategory'),
    topSpendingAmount: document.getElementById('topSpendingAmount'),
    topSpendingList: document.getElementById('topSpendingList'),
    monthlyComparePerc: document.getElementById('monthlyComparePerc'),
    thisMonthExpense: document.getElementById('thisMonthExpense'),
    lastMonthExpense: document.getElementById('lastMonthExpense'),
    savingsRateVal: document.getElementById('savingsRateVal'),
    totalTxnCount: document.getElementById('totalTxnCount'),
    monthTxnCount: document.getElementById('monthTxnCount'),
    
    // Charts
    balanceCtx: document.getElementById('balanceChart').getContext('2d'),
    categoryCtx: document.getElementById('categoryChart').getContext('2d'),
    categoryLegend: document.getElementById('categoryLegend'),
    comboCtx: document.getElementById('comboChart') ? document.getElementById('comboChart').getContext('2d') : null,
    
    // Table UI
    tableBody: document.getElementById('transactionTbody'),
    emptyState: document.getElementById('emptyState'),
    sortSelect: document.getElementById('sortSelect'),
    searchInput: document.getElementById('searchInput'),
    filterType: document.getElementById('filterType'),
    filterCategory: document.getElementById('filterCategory'),
    exportCsvBtn: document.getElementById('exportCsvBtnHeader') || document.getElementById('exportCsvBtn'),
    addTxnBtn: document.getElementById('addTxnBtn'),
    
    // Quick Transfer
    quickTransferAmount: document.getElementById('quickTransferAmount'),
    quickTransferError: document.getElementById('quickTransferError'),
    quickTransferBtn: document.getElementById('quickTransferBtn'),
    
    // Wallet Limits
    primaryLimitText: document.getElementById('primaryLimitText'),
    primaryLimitFill: document.getElementById('primaryLimitFill'),
    secondaryLimitText: document.getElementById('secondaryLimitText'),
    secondaryLimitFill: document.getElementById('secondaryLimitFill'),
    
    // Settings
    resetDataBtn: document.getElementById('resetDataBtn'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    currencySelect: document.getElementById('currencySelect'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    headerAvatar: document.getElementById('headerAvatar'),
    globalAddBtn: document.getElementById('globalAddBtn'),

    // Modal & Global
    modal: document.getElementById('txnModal'),
    modalTitle: document.getElementById('modalTitle'),
    txnModalError: document.getElementById('txnModalError'),
    saveTxnBtn: document.getElementById('saveTxnBtn'),
    txnForm: document.getElementById('txnForm'),
    txnId: document.getElementById('txnId'),
    txnDescription: document.getElementById('txnDescription'),
    txnAmount: document.getElementById('txnAmount'),
    txnDate: document.getElementById('txnDate'),
    txnType: document.getElementById('txnType'),
    txnCategory: document.getElementById('txnCategory'),
    closeBtn: document.getElementById('closeModalBtn'),
    cancelBtn: document.getElementById('cancelModalBtn'),
    toastContainer: document.getElementById('toastContainer'),

    // Confirm Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmMessage: document.getElementById('confirmMessage'),
    cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
    okConfirmBtn: document.getElementById('okConfirmBtn'),
    
    // API State
    apiLoadingOverlay: document.getElementById('apiLoadingOverlay'),
    
    // Mobile responsive
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.querySelector('.sidebar')
};

// =======================
// Initialization Engine & Mock API
// =======================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    loadProfileUI();
    updateDateDisplay();
    setupEventListeners();
    
    // Mock API Fetch Sequence
    await fetchMockTransactions();
    
    updateDashboard(); // First render after load
});

async function fetchMockTransactions(forceFetch = false) {
    if (els.apiLoadingOverlay) els.apiLoadingOverlay.classList.remove('hidden');
    
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached && !forceFetch) {
            transactions = JSON.parse(cached);
            // Artificial delay to simulate fast cached network response
            await new Promise(resolve => setTimeout(resolve, 300));
        } else {
            // Artificial network delay for initial fetch
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = await fetch('./mock-data.json');
            if(!response.ok) throw new Error('API Error');
            transactions = await response.json();
            saveData();
        }
    } catch (error) {
        console.error("Failed to fetch mock API", error);
        showToast("Error loading data from mock server", "error");
        transactions = [];
    } finally {
        if (els.apiLoadingOverlay) els.apiLoadingOverlay.classList.add('hidden');
    }
}

// =======================
// Event Listeners setup
// =======================
function setupEventListeners() {
    // Navigation
    els.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchTab(targetId, link);
            
            // Close sidebar on mobile after clicking a link
            if (els.sidebar && els.sidebar.classList.contains('open')) {
                els.sidebar.classList.remove('open');
            }
        });
    });
    
    // Mobile Menu
    if (els.mobileMenuBtn && els.sidebar) {
        els.mobileMenuBtn.addEventListener('click', () => {
            els.sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (els.sidebar.classList.contains('open')) {
                if (!els.sidebar.contains(e.target) && !els.mobileMenuBtn.contains(e.target)) {
                    els.sidebar.classList.remove('open');
                }
            }
        });
    }

    // Theme
    if(els.themeToggleBtn) els.themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Role handling
    els.roleSelect.addEventListener('change', (e) => {
        currentRole = e.target.value;
        if (currentRole === 'viewer') {
            showToast("Viewer mode: actions are restricted", 'info');
        }
        applyRoleRestrictions();
        renderTransactionsList(); // Refresh list to hide/show action icons
    });

    // Table Actions & Filters
    if(els.searchInput) els.searchInput.addEventListener('input', () => renderTransactionsList());
    if(els.sortSelect) els.sortSelect.addEventListener('change', () => renderTransactionsList());
    if(els.filterType) els.filterType.addEventListener('change', () => renderTransactionsList());
    if(els.filterCategory) els.filterCategory.addEventListener('change', () => renderTransactionsList());
    if(els.exportCsvBtn) els.exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Settings
    if(els.resetDataBtn) els.resetDataBtn.addEventListener('click', handleDataReset);
    if(els.saveProfileBtn) els.saveProfileBtn.addEventListener('click', handleProfileSave);

    // Modal
    if(els.addTxnBtn) els.addTxnBtn.addEventListener('click', () => openModal());
    if(els.globalAddBtn) els.globalAddBtn.addEventListener('click', () => openModal());
    if(els.closeBtn) els.closeBtn.addEventListener('click', closeModal);
    if(els.cancelBtn) els.cancelBtn.addEventListener('click', closeModal);
    if(els.txnForm) els.txnForm.addEventListener('submit', handleFormSubmit);

    // Global click for Modal overlay closing
    els.modal.addEventListener('click', (e) => {
        if (e.target === els.modal) closeModal();
    });

    if (els.confirmModal) {
        els.cancelConfirmBtn.addEventListener('click', () => {
            pendingConfirmCallback = null;
            els.confirmModal.classList.add('hidden');
        });
        els.okConfirmBtn.addEventListener('click', () => {
            if (pendingConfirmCallback) pendingConfirmCallback();
            els.confirmModal.classList.add('hidden');
            pendingConfirmCallback = null;
        });
        els.confirmModal.addEventListener('click', (e) => {
            if (e.target === els.confirmModal) els.confirmModal.classList.add('hidden');
        });
    }

    // Quick Transfer
    if (els.quickTransferBtn) {
        els.quickTransferBtn.addEventListener('click', handleQuickTransfer);
    }
    if (els.quickTransferAmount) {
        els.quickTransferAmount.addEventListener('input', (e) => {
            if (currentRole === 'viewer') return;
            els.quickTransferBtn.disabled = !e.target.value || parseFloat(e.target.value) <= 0;
            els.quickTransferBtn.style.opacity = els.quickTransferBtn.disabled ? '0.6' : '1';
        });
        // Initial state
        if (currentRole !== 'viewer') els.quickTransferBtn.disabled = true;
    }

    // 3D Credit Card Hover Physics
    const creditCards = document.querySelectorAll('.credit-card');
    if (creditCards.length > 0) {
        creditCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -15; // Max 15 degree tilt
                const rotateY = ((x - centerX) / centerX) * 15;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                card.style.transition = 'transform 0.1s ease-out';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
                card.style.transition = 'transform 0.5s ease-out';
            });
        });
    }
}

// =======================
// Quick Transfer Logic
// =======================
function handleQuickTransfer() {
    if (currentRole === 'viewer') return;
    
    els.quickTransferError.classList.add('hidden');
    const amountVal = parseFloat(els.quickTransferAmount.value);
    
    if (!amountVal || amountVal <= 0) {
        els.quickTransferError.textContent = 'Enter a valid transfer amount.';
        els.quickTransferError.classList.remove('hidden');
        return;
    }

    // Calculate current balance for validation
    let income = 0;
    let expense = 0;
    transactions.forEach(txn => {
        if (txn.type === 'income') income += parseFloat(txn.amount);
        else expense += parseFloat(txn.amount);
    });
    const currentBalance = income - expense;

    if (amountVal > currentBalance) {
        els.quickTransferError.textContent = 'Insufficient balance!';
        els.quickTransferError.classList.remove('hidden');
        return;
    }
    
    // Simulate Processing State
    els.quickTransferBtn.disabled = true;
    els.quickTransferBtn.textContent = 'Processing...';
    
    const rate = exchangeRates[userProfile.currency] || 1;
    const baseAmountVal = amountVal / rate;

    setTimeout(() => {
        const newTxn = {
            id: generateId(),
            description: 'Quick Transfer',
            amount: baseAmountVal,
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            category: 'Transfer'
        };
        
        transactions.push(newTxn);
        updateDashboard();
        
        els.quickTransferAmount.value = '';
        els.quickTransferBtn.disabled = false;
        els.quickTransferBtn.textContent = 'Send Money';
        showToast(`Successfully transferred ${formatCurrency(amountVal)}!`, 'success');
    }, 500);
}

// =======================
// Navigation Logic
// =======================
function switchTab(targetId, activeLinkElement) {
    // 1. Remove active state from all nav links
    els.navLinks.forEach(nav => nav.classList.remove('active'));
    // 2. Add active state to clicked link
    if (activeLinkElement) {
        activeLinkElement.classList.add('active');
    }
    
    // 3. Hide all view sections
    els.viewSections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    // 4. Show target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
    }

    // 5. Update header title dynamically
    const titleMap = {
        'dashboard': 'Overview',
        'wallet': 'My Wallet',
        'transactions': 'Transaction History',
        'settings': 'Account Settings'
    };
    els.pageTitle.textContent = titleMap[targetId] || 'Dashboard';
}

// =======================
// Theme Logic
// =======================
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeUI(false);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
    updateCharts(); // Re-render charts with correct theme colors
}

function updateThemeUI(isDark) {
    if(els.themeIcon) els.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    if(els.themeText) els.themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    
    // Tell Chart.js about color scheme base
    Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
    Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if(els.dateDisplay) els.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
}

// =======================
// Role Base Control
// =======================
function applyRoleRestrictions() {
    const adminElements = document.querySelectorAll('.admin-only');
    const viewerElements = document.querySelectorAll('.viewer-only');

    if (currentRole === 'viewer') {
        adminElements.forEach(el => el.classList.add('hidden'));
        viewerElements.forEach(el => el.style.display = 'block');
        
        // Disabled inputs per user spec
        if (els.quickTransferBtn) {
            els.quickTransferBtn.disabled = true;
            els.quickTransferBtn.style.opacity = '0.5';
            els.quickTransferBtn.style.cursor = 'not-allowed';
        }
        if (els.quickTransferAmount) {
            els.quickTransferAmount.disabled = true;
        }
    } else {
        adminElements.forEach(el => el.classList.remove('hidden'));
        viewerElements.forEach(el => el.style.display = 'none');
        
        // Re-enabled inputs
        if (els.quickTransferBtn) {
            els.quickTransferBtn.disabled = false;
            els.quickTransferBtn.style.opacity = '1';
            els.quickTransferBtn.style.cursor = 'pointer';
        }
        if (els.quickTransferAmount) {
            els.quickTransferAmount.disabled = false;
        }
    }
}

// =======================
// Settings Logic
// =======================
function handleDataReset() {
    if (currentRole === 'viewer') return;
    window.showConfirmModal("Are you totally sure? This will wipe all recorded transactions and reset to server data. This action cannot be undone.", async () => {
        localStorage.removeItem(STORAGE_KEY);
        transactions = [];
        updateDashboard(); // Clear UI briefly
        
        await fetchMockTransactions(true); // Force refetch from server
        
        updateDashboard();
        showToast('Data completely reset to server defaults', 'info');
    });
}

function handleProfileSave() {
    if (currentRole === 'viewer') return;
    userProfile.name = els.profileName.value;
    userProfile.email = els.profileEmail.value;
    userProfile.currency = els.currencySelect.value;
    
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    
    // Refresh avatar image in header
    if(els.headerAvatar) els.headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=6366f1&color=fff`;
    
    // Update global UI to reflect new currency across the app
    updateDashboard(); 
    showToast('Profile saved successfully!', 'success');
}

function loadProfileUI() {
    if(els.profileName) els.profileName.value = userProfile.name;
    if(els.profileEmail) els.profileEmail.value = userProfile.email;
    if(els.currencySelect) els.currencySelect.value = userProfile.currency;
    if(els.headerAvatar) els.headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=6366f1&color=fff`;
}

// =======================
// Core Update Functions
// =======================
function updateDashboard() {
    saveData();
    calculateCards();
    generateInsights();
    renderTransactionsList();
    calculateBudgets();
    renderSubscriptions();
    updateCharts();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// =======================
// Budget Tracking Engine & Subscriptions
// =======================
function calculateBudgets() {
    let primaryExpenseUSD = 0; // Essential Needs (Housing, Utilities, Food)
    let secondaryExpenseUSD = 0; // Flexible Spending (Everything else)
    
    // Calculate for current real month
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    
    transactions.forEach(txn => {
        const d = new Date(txn.date);
        if (txn.type === 'expense' && d.getMonth() === currMonth && d.getFullYear() === currYear) {
            if (['Housing', 'Utilities', 'Food'].includes(txn.category)) {
                primaryExpenseUSD += parseFloat(txn.amount);
            } else {
                secondaryExpenseUSD += parseFloat(txn.amount);
            }
        }
    });

    const primaryBudgetUSD = 2500;
    const secondaryBudgetUSD = 1000;

    updateProgressBar(els.primaryLimitText, els.primaryLimitFill, primaryExpenseUSD, primaryBudgetUSD, 'Essential Needs Limit');
    updateProgressBar(els.secondaryLimitText, els.secondaryLimitFill, secondaryExpenseUSD, secondaryBudgetUSD, 'Flexible Spending Limit');
}

function renderSubscriptions() {
    const subList = document.getElementById('subList');
    const subTotalText = document.getElementById('subTotalText');
    if(!subList) return;
    
    const subs = [
        { name: 'Netflix Premium', price: 22.99, icon: 'movie' },
        { name: 'Equinox Gym', price: 245.00, icon: 'fitness_center' },
        { name: 'AWS Cloud Services', price: 120.50, icon: 'cloud' }
    ];
    
    let html = '';
    let total = 0;
    
    subs.forEach(sub => {
        total += sub.price;
        html += `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.2rem;">
            <div style="display: flex; align-items: center; gap: 0.8rem;">
                <span class="material-symbols-rounded" style="color: var(--primary); background: rgba(99, 102, 241, 0.1); padding: 6px; border-radius: 8px; font-size: 1.2rem;">${sub.icon}</span>
                <span style="font-weight: 500; font-size: 0.9rem;">${sub.name}</span>
            </div>
            <span style="font-weight: 600; color: var(--text-color);">${formatCurrency(sub.price)}/mo</span>
        </div>`;
    });
    
    subList.innerHTML = html;
    if(subTotalText) subTotalText.textContent = `${formatCurrency(total)}/mo fixed`;
}


function updateProgressBar(textEl, fillEl, spentUSD, budgetUSD, title) {
    if(!textEl || !fillEl) return;
    const pct = Math.min((spentUSD / budgetUSD) * 100, 100);
    textEl.innerHTML = `<span style="font-size: 13px; opacity: 0.8;">${title}</span><span>${formatCurrency(spentUSD)} / ${formatCurrency(budgetUSD)}</span>`;
    
    fillEl.style.width = `${pct}%`;
    
    fillEl.className = 'progress-fill';
    if (pct >= 100) fillEl.classList.add('danger');
    else if (pct >= 80) fillEl.classList.add('warning');
}

// FORMAT CURRENCY HELPER
const formatCurrency = (amount) => {
    const rate = exchangeRates[userProfile.currency] || 1;
    const convertedAmount = amount * rate;
    const locale = userProfile.currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: userProfile.currency }).format(convertedAmount);
};

// =======================
// Summary Cards
// =======================
function calculateCards() {
    let income = 0;
    let expense = 0;
    let thisMonthSavings = 0;
    
    // Find latest month in data
    let maxDate = new Date(0);
    transactions.forEach(t => {
        let d = new Date(t.date);
        if (d > maxDate) maxDate = d;
    });
    const filterMonth = maxDate.getMonth();
    const filterYear = maxDate.getFullYear();

    transactions.forEach(txn => {
        const amt = parseFloat(txn.amount);
        if (txn.type === 'income') {
            income += amt;
        } else {
            expense += amt;
        }

        const tDate = new Date(txn.date);
        if(tDate.getMonth() === filterMonth && tDate.getFullYear() === filterYear) {
            if (txn.type === 'income') thisMonthSavings += amt;
            else thisMonthSavings -= amt;
        }
    });

    const balance = income - expense;

    // Apply Odometer Number Animation Effect
    animateCurrencyNode(els.totalIncome, income);
    animateCurrencyNode(els.totalExpenses, expense);
    animateCurrencyNode(els.totalBalance, balance);
    if(els.netSavings) animateCurrencyNode(els.netSavings, thisMonthSavings);
}

// =======================
// Odometer Animation Engine
// =======================
function animateCurrencyNode(node, newValue) {
    if (!node) return;
    const oldValue = parseFloat(node.dataset.currentVal) || 0;
    
    // If values match but we haven't animated yet, we still skip animation to prevent random flickering
    if (oldValue === newValue && node.dataset.hasAnimated) {
        node.textContent = formatCurrency(newValue);
        return;
    }
    
    node.dataset.hasAnimated = 'true';
    let startTimestamp = null;
    const duration = 1000; // 1 second smooth flip
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        const current = oldValue + (newValue - oldValue) * easeProgress;
        node.textContent = formatCurrency(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            node.textContent = formatCurrency(newValue);
            node.dataset.currentVal = newValue;
        }
    };
    window.requestAnimationFrame(step);
}

// =======================
// Top Insight Gen
// =======================
function generateInsights() {
    if (transactions.length === 0) return;

    let maxDate = new Date(0);
    transactions.forEach(t => { if(new Date(t.date) > maxDate) maxDate = new Date(t.date); });
    
    const currMonthStr = `${maxDate.getFullYear()}-${maxDate.getMonth()}`;
    const pastMonthDate = new Date(maxDate); pastMonthDate.setMonth(pastMonthDate.getMonth() - 1);
    const lastMonthStr = `${pastMonthDate.getFullYear()}-${pastMonthDate.getMonth()}`;

    let thisMonthExpense = 0;
    let lastMonthExpense = 0;
    let thisMonthIncome = 0;
    let categorySums = {};

    transactions.forEach(txn => {
        const tDate = new Date(txn.date);
        const tStr = `${tDate.getFullYear()}-${tDate.getMonth()}`;
        const amt = parseFloat(txn.amount);

        if (tStr === currMonthStr) {
            if (txn.type === 'expense') {
                thisMonthExpense += amt;
                categorySums[txn.category] = (categorySums[txn.category] || 0) + amt;
            } else {
                thisMonthIncome += amt;
            }
        }
        if (tStr === lastMonthStr && txn.type === 'expense') {
            lastMonthExpense += amt;
        }
    });

    // Populate Top Spending List
    const sortedCats = Object.entries(categorySums).sort((a,b) => b[1] - a[1]);
    const topCat = sortedCats.length > 0 ? sortedCats[0] : ['None', 0];
    
    if(els.topSpendingCategory) els.topSpendingCategory.textContent = topCat[0];
    if(els.topSpendingAmount) els.topSpendingAmount.textContent = `${formatCurrency(topCat[1])} spent this month`;

    if(els.topSpendingList) {
        let listHtml = '';
        if (thisMonthExpense > 0) {
            sortedCats.slice(0, 5).forEach(([cat, val], index) => {
                const color = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5];
                const pct = (val / thisMonthExpense) * 100;
                listHtml += `
                <div class="progress-container">
                    <div class="progress-label-row">
                        <span>${cat}</span>
                        <span style="color: var(--text-muted);">${formatCurrency(val)}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${color}"></div>
                    </div>
                </div>`;
            });
        }
        els.topSpendingList.innerHTML = listHtml;
    }

    // Populate Monthly Compare
    if(els.thisMonthExpense) els.thisMonthExpense.textContent = formatCurrency(thisMonthExpense);
    if(els.lastMonthExpense) els.lastMonthExpense.textContent = formatCurrency(lastMonthExpense);
    
    if (els.monthlyComparePerc) {
        if (lastMonthExpense === 0) {
            els.monthlyComparePerc.textContent = '+100%';
            els.monthlyComparePerc.style.color = 'var(--danger)';
        } else {
            const diff = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
            if (diff >= 0) {
                els.monthlyComparePerc.innerHTML = `&uarr;${Math.round(diff)}%`;
                els.monthlyComparePerc.style.color = 'var(--danger)';
            } else {
                els.monthlyComparePerc.innerHTML = `&darr;${Math.round(Math.abs(diff))}%`;
                els.monthlyComparePerc.style.color = 'var(--success)';
            }
        }
    }

    // Populate Financial Health
    if(els.savingsRateVal) {
        const sr = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100) : 0;
        els.savingsRateVal.textContent = `${Math.max(0, sr)}%`;
    }
    if(els.totalTxnCount) els.totalTxnCount.textContent = transactions.length;
    if(els.monthTxnCount) {
        const mCount = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === maxDate.getFullYear() && d.getMonth() === maxDate.getMonth();
        }).length;
        els.monthTxnCount.textContent = `${mCount} this month`;
    }
}

// =======================
// Render List & Sorting/Searching
// =======================
function renderTransactionsList() {
    els.tableBody.innerHTML = '';
    
    // Sort and Filter Logic
    const query = els.searchInput.value.toLowerCase().trim();
    const sortVal = els.sortSelect.value;
    const typeVal = els.filterType.value;
    const catVal = els.filterCategory.value;
    
    let filtered = transactions.filter(txn => {
        const matchSearch = txn.description.toLowerCase().includes(query) || txn.category.toLowerCase().includes(query);
        const matchType = typeVal === 'all' || txn.type === typeVal;
        const matchCat = catVal === 'all' || txn.category === catVal;
        return matchSearch && matchType && matchCat;
    });

    filtered.sort((a, b) => {
        if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortVal === 'amount-desc') return parseFloat(b.amount) - parseFloat(a.amount);
        if (sortVal === 'amount-asc') return parseFloat(a.amount) - parseFloat(b.amount);
        return 0;
    });

    if (filtered.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.tableBody.closest('table').classList.add('hidden');
    } else {
        els.emptyState.classList.add('hidden');
        els.tableBody.closest('table').classList.remove('hidden');

        filtered.forEach(txn => {
            const tr = document.createElement('tr');
            
            // formatting
            const rowDate = new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const amountDisp = formatCurrency(txn.amount);
            const amountClass = txn.type === 'income' ? 'success' : 'danger';
            const amountPrefix = txn.type === 'income' ? '+' : '-';

            let actionHtml = '';
            if (currentRole === 'admin') {
                actionHtml = `
                    <td class="action-col admin-only" data-label="ACTION">
                        <div class="txn-actions">
                            <button class="action-btn" onclick="editTransaction('${txn.id}')" title="Edit">
                                <span class="material-symbols-rounded" style="font-size:18px;">edit</span>
                            </button>
                            <button class="action-btn delete" onclick="deleteTransaction('${txn.id}')" title="Delete">
                                <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                            </button>
                        </div>
                    </td>`;
            } else {
                actionHtml = `<td class="action-col admin-only hidden" data-label="ACTION"></td>`;
            }

            tr.innerHTML = `
                <td data-label="DESCRIPTION"><strong>${txn.description}</strong></td>
                <td data-label="DATE">${rowDate}</td>
                <td data-label="CATEGORY">${txn.category}</td>
                <td data-label="TYPE"><span class="badge badge-${txn.type}">${txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}</span></td>
                <td class="amount-col" data-label="AMOUNT" style="color: var(--${amountClass})">${amountPrefix}${amountDisp}</td>
                ${actionHtml}
            `;
            els.tableBody.appendChild(tr);
        });
    }

    applyRoleRestrictions();
}

// =======================
// Modal / Form Handlers  (Admin Actions)
// =======================
function openModal(editingTxn = null) {
    if (currentRole === 'viewer') return; 
    
    // Reset Form
    els.txnForm.reset();
    if(els.txnModalError) els.txnModalError.classList.add('hidden');
    if(els.saveTxnBtn) {
        els.saveTxnBtn.disabled = false;
        els.saveTxnBtn.textContent = 'Save Transaction';
    }
    
    if (editingTxn) {
        els.modalTitle.textContent = 'Edit Transaction';
        els.txnId.value = editingTxn.id;
        els.txnDescription.value = editingTxn.description;
        const rate = exchangeRates[userProfile.currency] || 1;
        els.txnAmount.value = (editingTxn.amount * rate).toFixed(2);
        els.txnDate.value = editingTxn.date;
        els.txnType.value = editingTxn.type;
        els.txnCategory.value = editingTxn.category;
    } else {
        els.modalTitle.textContent = 'Add Transaction';
        els.txnId.value = '';
        els.txnDate.value = new Date().toISOString().split('T')[0]; // Default today
        els.txnType.value = 'expense';
        els.txnCategory.value = 'Food';
    }

    els.modal.classList.remove('hidden');
}

function closeModal() {
    els.modal.classList.add('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (currentRole === 'viewer') return; 

    els.txnModalError.classList.add('hidden');

    // Gather values
    const id = els.txnId.value;
    const desc = els.txnDescription.value.trim();
    const amountVal = parseFloat(els.txnAmount.value);
    const dateVal = els.txnDate.value;
    const typeVal = els.txnType.value;
    const catVal = els.txnCategory.value;
    
    if (!desc || isNaN(amountVal) || amountVal <= 0 || !dateVal) {
        els.txnModalError.textContent = 'Please completely fill out all fields with valid data.';
        els.txnModalError.classList.remove('hidden');
        return;
    }

    // Processing State
    els.saveTxnBtn.disabled = true;
    els.saveTxnBtn.textContent = 'Saving...';

    // Convert input to base USD for storage
    const rate = exchangeRates[userProfile.currency] || 1;
    const baseAmountVal = amountVal / rate;

    setTimeout(() => {
        const newTxn = {
            id: id || generateId(),
            description: desc,
            amount: baseAmountVal,
            date: dateVal,
            type: typeVal,
            category: catVal
        };

        if (id) {
            // Edit
            const index = transactions.findIndex(t => t.id === id);
            if (index > -1) transactions[index] = newTxn;
            showToast('Transaction successfully updated!', 'success');
        } else {
            // Add
            transactions.push(newTxn);
            showToast('Transaction successfully added!', 'success');
        }

        updateDashboard();
        closeModal();
        
        els.saveTxnBtn.disabled = false;
        els.saveTxnBtn.textContent = 'Save Transaction';
    }, 400);
}

window.editTransaction = function(id) {
    if (currentRole === 'viewer') return;
    const txn = transactions.find(t => t.id === id);
    if (txn) openModal(txn);
};

window.deleteTransaction = function(id) {
    if (currentRole === 'viewer') return;
    window.showConfirmModal("Are you sure you want to completely <strong>delete</strong> this transaction?<br>This action cannot be undone.", () => {
        transactions = transactions.filter(t => t.id !== id);
        updateDashboard();
        showToast('Transaction deleted.', 'error');
    });
};

let pendingConfirmCallback = null;
window.showConfirmModal = function(message, callback) {
    if (currentRole === 'viewer') return;
    pendingConfirmCallback = callback;
    els.confirmMessage.innerHTML = message;
    els.confirmModal.classList.remove('hidden');
};

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// =======================
// CSV Export
// =======================
function exportToCSV() {
    if(transactions.length === 0) {
        showToast('No transactions to export.', 'error');
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Description,Category,Type,Amount\n";
    
    transactions.forEach(txn => {
        const row = [txn.id, txn.date, `"${txn.description}"`, txn.category, txn.type, txn.amount].join(",");
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link); // Required for FF
    
    link.click();
    link.remove();
    showToast('Export successful!', 'success');
}

// =======================
// CSV Import
// =======================
const importCsvInput = document.getElementById('importCsvInput');
if(importCsvInput) {
    importCsvInput.addEventListener('change', function(e) {
        if (currentRole === 'viewer') {
            showToast('Viewer accounts cannot import data.', 'error');
            e.target.value = ''; // Reset
            return;
        }
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const lines = evt.target.result.split(/\r?\n/);
            if(lines.length < 2) {
                showToast('File is empty or invalid format.', 'error');
                e.target.value = '';
                return; 
            }
            
            function parseCSVRow(str) {
                const result = [];
                let insideQuote = false;
                let currentWord = '';
                for (let i = 0; i < str.length; i++) {
                    const char = str[i];
                    if (char === '"') {
                        insideQuote = !insideQuote;
                    } else if (char === ',' && !insideQuote) {
                        result.push(currentWord.trim());
                        currentWord = '';
                    } else {
                        currentWord += char;
                    }
                }
                result.push(currentWord.trim());
                return result;
            }
            
            let importedCount = 0;
            // Map existing IDs for quick deduplication
            const existingIds = new Set(transactions.map(t => t.id));
            
            for(let i=1; i<lines.length; i++) {
                const line = lines[i].trim();
                if(!line) continue;
                
                const row = parseCSVRow(line);
                if(row.length >= 6) {
                    const existingId = row[0];
                    const date = row[1];
                    const desc = row[2];
                    const cat = row[3];
                    const type = row[4].toLowerCase();
                    const amt = parseFloat(row[5]);
                    
                    if(date && desc && !isNaN(amt)) {
                        if (!existingIds.has(existingId)) {
                            // Only add if it doesn't already exist to prevent mass duplication
                            const id = existingId && existingId.startsWith('txn_') ? existingId : generateId();
                            transactions.push({ id, date, description: desc, category: cat, type, amount: amt });
                            existingIds.add(id);
                            importedCount++;
                        }
                    }
                }
            }
            
            if(importedCount > 0) {
                transactions.sort((a,b) => new Date(a.date) - new Date(b.date));
                saveData();
                updateDashboard();
                showToast(`Successfully imported ${importedCount} new transactions.`, 'success');
            } else {
                showToast('No new valid transactions found to import.', 'info');
            }
            e.target.value = ''; // FIX: Allow importing same file again
        };
        reader.readAsText(file);
    });
}

// =======================
// Toast Notification
// =======================
window.showToast = function(message, type = 'info') {
    if (!els.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type==='success') icon = 'check_circle';
    if(type==='error') icon = 'error';
    
    toast.innerHTML = `
        <span class="material-symbols-rounded">${icon}</span>
        <span>${message}</span>
    `;
    
    els.toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300); // Wait for animation
    }, 3000);
}

// =======================
// Charts Logic (Chart.js)
// =======================
function updateCharts() {
    if (!document.getElementById('balanceChart')) return;

    const isDark = document.body.classList.contains('dark-mode');
    const primaryColor = '#4f46e5';
    const secondaryColor = '#fca5a5';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = 'Outfit';

    // 1. BALANCE TREND OVER TIME (Grouped Bar Chart)
    const monthlyData = {};
    transactions.forEach(t => {
        const d = new Date(t.date);
        const mKey = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().substr(-2)}`;
        if (!monthlyData[mKey]) monthlyData[mKey] = { inc: 0, exp: 0, time: d.getTime() };
        if (t.type === 'income') monthlyData[mKey].inc += parseFloat(t.amount);
        else monthlyData[mKey].exp += parseFloat(t.amount);
    });

    const sortedMonths = Object.keys(monthlyData).sort((a,b) => monthlyData[a].time - monthlyData[b].time).slice(-6); // last 6 months
    const balLabels = sortedMonths;
    const incData = sortedMonths.map(m => monthlyData[m].inc);
    const expData = sortedMonths.map(m => monthlyData[m].exp);

    if (balanceChartInstance) balanceChartInstance.destroy();
    
    balanceChartInstance = new Chart(els.balanceCtx, {
        type: 'line',
        data: {
            labels: balLabels,
            datasets: [
                {
                    label: 'Income',
                    data: incData,
                    borderColor: primaryColor,
                    backgroundColor: primaryColor,
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: expData,
                    borderColor: secondaryColor,
                    backgroundColor: secondaryColor,
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'start', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
                tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#cbd5e1' : '#0f172a', bodyColor: isDark ? '#cbd5e1' : '#64748b', borderColor: gridColor, borderWidth: 1 }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: gridColor }, border: { dash: [4, 4], display: false } }
            }
        }
    });

    // 2. EXPENSES BY CATEGORY (Doughnut Chart + Custom Legend)
    let currMonthExp = 0;
    const catDataMap = {};
    
    // Compute current month expenses for category chart
    let latestD = new Date(0);
    transactions.forEach(t => { if(new Date(t.date) > latestD) latestD = new Date(t.date); });
    transactions.forEach(t => {
        const d = new Date(t.date);
        if (t.type === 'expense' && d.getMonth() === latestD.getMonth() && d.getFullYear() === latestD.getFullYear()) {
             currMonthExp += parseFloat(t.amount);
             catDataMap[t.category] = (catDataMap[t.category] || 0) + parseFloat(t.amount);
        }
    });

    const bgColors = ['#6366f1', '#a855f7', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'];
    const catLabels = Object.keys(catDataMap);
    const catData = Object.values(catDataMap);

    if (categoryChartInstance) categoryChartInstance.destroy();
    
    if (els.categoryCtx) {
        categoryChartInstance = new Chart(els.categoryCtx, {
            type: 'pie',
            data: {
                labels: catLabels.length ? catLabels : ['None'],
                datasets: [{
                    data: catData.length ? catData : [1],
                    backgroundColor: catData.length ? bgColors : [gridColor],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#cbd5e1' : '#0f172a', bodyColor: isDark ? '#cbd5e1' : '#64748b', borderColor: gridColor, borderWidth: 1 }
                }
            }
        });
    }

    // Build Custom Legend
    if (els.categoryLegend) {
        let legendHTML = '';
        if (catLabels.length) {
            catLabels.forEach((lbl, i) => {
                legendHTML += `
                <div class="custom-legend-item">
                    <div class="legend-label-container">
                        <div class="legend-color-box" style="background-color: ${bgColors[i % bgColors.length]}"></div>
                        <span>${lbl}</span>
                    </div>
                    <div class="legend-amount">${formatCurrency(catData[i])}</div>
                </div>`;
            });
        }
        els.categoryLegend.innerHTML = legendHTML;
    }

    // 3. COMBO CHART (Monthly Income vs Expenses insight)
    if (els.comboCtx) {
        const netData = balLabels.map((m, i) => incData[i] - expData[i]);
        if (comboChartInstance) comboChartInstance.destroy();
        
        comboChartInstance = new Chart(els.comboCtx, {
            type: 'bar',
            data: {
                labels: balLabels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Net',
                        data: netData,
                        borderColor: '#22c55e',
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#22c55e',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: 'Income',
                        data: incData,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4,
                        order: 2
                    },
                    {
                        type: 'bar',
                        label: 'Expenses',
                        data: expData,
                        backgroundColor: '#fca5a5',
                        borderRadius: 4,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', align: 'start', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: gridColor }, border: { display: false } }
                }
            }
        });
    }
}
