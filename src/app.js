const COINS = ['bitcoin', 'ethereum', 'solana', 'cardano'];
let priceChart = null;
let selectedCoin = 'bitcoin';

// ── Fetch live prices ─────────────────────────────────
async function fetchPrices() {
  try {
    const ids = COINS.join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
    const res = await fetch(url);
    const data = await res.json();
    updateCards(data);
    updateTable(data);
    updateTime();
  } catch (err) {
    console.error('Price fetch failed:', err);
  }
}

// ── Update stat cards ─────────────────────────────────
function updateCards(coins) {
  coins.forEach(coin => {
    const priceEl = document.getElementById(`price-${coin.id}`);
    const changeEl = document.getElementById(`change-${coin.id}`);
    const iconEl = document.getElementById(`icon-${coin.id}`);

    if (priceEl) priceEl.textContent = `$${coin.current_price.toLocaleString()}`;
    if (iconEl) iconEl.src = coin.image;
    if (changeEl) {
      const change = coin.price_change_percentage_24h;
      const sign = change >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${change.toFixed(2)}% (24h)`;
      changeEl.className = `coin-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
  });
}

// ── Update market table ───────────────────────────────
function updateTable(coins) {
  const tbody = document.getElementById('market-table-body');
  tbody.innerHTML = coins.map((coin, i) => {
    const change = coin.price_change_percentage_24h;
    const sign = change >= 0 ? '+' : '';
    const changeClass = change >= 0 ? 'positive' : 'negative';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="coin-cell">
            <img src="${coin.image}" alt="${coin.name}" />
            <span>${coin.name}</span>
            <span class="symbol">${coin.symbol.toUpperCase()}</span>
          </div>
        </td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td class="${changeClass}">${sign}${change.toFixed(2)}%</td>
        <td>$${(coin.market_cap / 1e9).toFixed(2)}B</td>
        <td>$${(coin.total_volume / 1e9).toFixed(2)}B</td>
      </tr>
    `;
  }).join('');
}

// ── Fetch 7-day chart data ────────────────────────────
async function fetchChartData(coinId) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`;
    const res = await fetch(url);
    const data = await res.json();
    renderChart(coinId, data.prices);
  } catch (err) {
    console.error('Chart fetch failed:', err);
  }
}

// ── Render Chart.js chart ─────────────────────────────
function renderChart(coinId, prices) {
  const labels = prices.map(p => {
    const d = new Date(p[0]);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00`;
  });
  const values = prices.map(p => p[1]);

  const isUp = values[values.length - 1] >= values[0];
  const color = isUp ? '#00e5a0' : '#ff4d4d';

  const ctx = document.getElementById('priceChart').getContext('2d');
  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: coinId.charAt(0).toUpperCase() + coinId.slice(1),
        data: values,
        borderColor: color,
        backgroundColor: `${color}18`,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#1c1c1c',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          titleColor: '#888',
          bodyColor: '#f0f0f0',
          callbacks: {
            label: ctx => ` $${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#666', maxTicksLimit: 7, font: { family: 'Courier New' } },
          grid: { color: '#1e1e1e' }
        },
        y: {
          ticks: {
            color: '#666',
            font: { family: 'Courier New' },
            callback: val => `$${val.toLocaleString()}`
          },
          grid: { color: '#1e1e1e' }
        }
      }
    }
  });
}

// ── Coin selector buttons ─────────────────────────────
document.querySelectorAll('.selector-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCoin = btn.dataset.coin;
    fetchChartData(selectedCoin);
  });
});

// ── Update timestamp ──────────────────────────────────
function updateTime() {
  const now = new Date();
  document.getElementById('update-time').textContent = now.toLocaleTimeString();
}

// ── Init ──────────────────────────────────────────────
fetchPrices();
fetchChartData(selectedCoin);

// Auto-refresh every 60 seconds
setInterval(() => {
  fetchPrices();
  fetchChartData(selectedCoin);
}, 60000);