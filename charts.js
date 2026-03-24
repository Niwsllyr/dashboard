let barChart;
let slaDriverChart;

export function renderCharts(data) {

  if (barChart) barChart.destroy();
  if (slaDriverChart) slaDriverChart.destroy();

  const statusLabels = Object.keys(data.statusMap);
  const statusValues = Object.values(data.statusMap);

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: statusLabels,
      datasets: [{
        label: 'Status dos Pedidos',
        data: statusValues,
        backgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  slaDriverChart = new Chart(document.getElementById('pieChart'), {
    type: 'bar',
    data: {
      labels: data.driverSLA.map(d => d.name),
      datasets: [{
        label: 'SLA %',
        data: data.driverSLA.map(d => d.sla),
        backgroundColor: data.driverSLA.map(d =>
          d.sla >= 98 ? '#16a34a' :
          d.sla >= 95 ? '#eab308' :
          '#dc2626'
        )
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

  /* ===============================
     🟢 SLA POR ENTREGADOR (TODOS)
  =============================== */

  const sortedDrivers = data.driverSLA
    .filter(d => d.name && !isNaN(d.sla))
    .sort((a, b) => b.sla - a.sla);

  const fullNames = sortedDrivers.map(d => d.name);
const shortNames = sortedDrivers.map(d => d.name); // 🔥 nome completo


  /* 🔥 CONTROLE DE ALTURA + SCROLL */
  const pieCanvas = document.getElementById('pieChart');
  const chartWrapper = pieCanvas.parentElement;

  chartWrapper.style.height = '420px'; // área visível
  pieCanvas.style.height = (sortedDrivers.length * 34) + 'px'; // altura real

  slaDriverChart = new Chart(pieCanvas, {
    type: 'bar',
    data: {
      labels: shortNames,
      datasets: [{
        label: 'SLA por Entregador (%)',
        data: sortedDrivers.map(d => d.sla),
        backgroundColor: sortedDrivers.map(d =>
          d.sla >= 98 ? '#22c55e' :
          d.sla >= 95 ? '#facc15' :
          '#ef4444'
        ),
        borderRadius: 6,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        y: {
          ticks: {
            autoSkip: false,        // 🔥 evita sumir nomes
            font: { size: 12 }
          }
        },
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => value + '%'
          }
        }
      },

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function (items) {
              return fullNames[items[0].dataIndex]; // nome completo
            },
            label: function (context) {
              return `SLA: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}
