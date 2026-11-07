// Data State Management
let floatBalance = parseFloat(localStorage.getItem('mpesa_float')) || 0;
let transactions = JSON.parse(localStorage.getItem('mpesa_txs')) || [];

// DOM Elements
const currentDateEl = document.getElementById('current-date');
const floatForm = document.getElementById('float-form');
const floatInput = document.getElementById('opening-float');
const txForm = document.getElementById('transaction-form');
const ledgerBody = document.getElementById('ledger-body');
const clearBtn = document.getElementById('clear-ledger-btn');

// Stats Elements
const statFloat = document.getElementById('stat-float');
const statInflow = document.getElementById('stat-inflow');
const statCharges = document.getElementById('stat-charges');
const statNet = document.getElementById('stat-net');

currentDateEl.textContent = new Date().toLocaleDateString('en-KE', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
});

// Set Opening Float
floatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  floatBalance = parseFloat(floatInput.value);
  saveAndRender();
});

// Add New Transaction
txForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const type = document.getElementById('tx-type').value;
  const desc = document.getElementById('tx-desc').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const fee = parseFloat(document.getElementById('tx-fee').value) || 0;

  const newTx = {
    id: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type,
    desc,
    amount,
    fee
  };

  // Adjust Float based on transaction type
  if (type === 'Customer Payment' || type === 'Float Top-Up') {
    floatBalance += amount;
  } else if (type === 'Cash Out' || type === 'Expense') {
    floatBalance -= (amount + fee);
  }

  transactions.unshift(newTx);
  saveAndRender();
  txForm.reset();
  document.getElementById('tx-fee').value = "0";
});

// Render Stats & Ledger Table
function render() {
  floatInput.value = floatBalance ? floatBalance : '';
  statFloat.textContent = `KES ${floatBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  let totalInflow = 0;
  let totalCharges = 0;
  let totalOutflow = 0;

  ledgerBody.innerHTML = '';

  if (transactions.length === 0) {
    ledgerBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No transactions recorded today.</td></tr>`;
  }

  transactions.forEach(tx => {
    totalCharges += tx.fee;

    let badgeClass = 'badge-inflow';
    if (tx.type === 'Customer Payment') {
      totalInflow += tx.amount;
    } else if (tx.type === 'Cash Out' || tx.type === 'Expense') {
      totalOutflow += tx.amount;
      badgeClass = 'badge-outflow';
    } else if (tx.type === 'Float Top-Up') {
      badgeClass = 'badge-topup';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tx.time}</td>
      <td><span class="badge ${badgeClass}">${tx.type}</span></td>
      <td>${tx.desc}</td>
      <td class="${tx.type === 'Customer Payment' || tx.type === 'Float Top-Up' ? 'success-text' : 'danger-text'}">
        ${tx.type === 'Customer Payment' || tx.type === 'Float Top-Up' ? '+' : '-'}KES ${tx.amount.toFixed(2)}
      </td>
      <td class="danger-text">KES ${tx.fee.toFixed(2)}</td>
      <td><button onclick="deleteTx(${tx.id})" class="btn-danger"><i class="fa-solid fa-trash"></i></button></td>
    `;
    ledgerBody.appendChild(tr);
  });

  const netSales = totalInflow - totalOutflow - totalCharges;

  statInflow.textContent = `KES ${totalInflow.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  statCharges.textContent = `KES ${totalCharges.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  statNet.textContent = `KES ${netSales.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

// Delete Single Transaction
function deleteTx(id) {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    if (tx.type === 'Customer Payment' || tx.type === 'Float Top-Up') {
      floatBalance -= tx.amount;
    } else if (tx.type === 'Cash Out' || tx.type === 'Expense') {
      floatBalance += (tx.amount + tx.fee);
    }
    transactions = transactions.filter(t => t.id !== id);
    saveAndRender();
  }
}

// Reset Entire Day
clearBtn.addEventListener('click', () => {
  if (confirm("Reset today's transaction log and float history?")) {
    floatBalance = 0;
    transactions = [];
    saveAndRender();
  }
});

// Save to LocalStorage and re-render
function saveAndRender() {
  localStorage.setItem('mpesa_float', floatBalance);
  localStorage.setItem('mpesa_txs', JSON.stringify(transactions));
  render();
}

// Initial Run
render();
