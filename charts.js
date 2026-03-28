let barChart;
let slaDriverChart;

export function renderCharts(data, mode = 'default', extra = {}) {

  if (barChart) barChart.destroy();
  if (slaDriverChart) slaDriverChart.destroy();

  const selectedStatus = extra.status || '';

  /* ===============================
     🔤 STATUS DOS PEDIDOS
  =============================== */
  const statusLabelsMap = {
    Delivered: 'Entregue',
    Delivering: 'Em Rota',
    Hub_Assigned: 'Hub Atribuído',
    Hub_Received: 'Recebido no Hub',
    LM_Hub_InTransit: 'Em Transferência',
    OnHold: 'Ocorrência'
  };

  const filteredStatus = Object.entries(data.statusMap || {})
    .filter(([status]) => status && status !== 'undefined');

  const statusLabels = filteredStatus.map(
    ([status]) => statusLabelsMap[status] || status
  );

  const statusValues = filteredStatus.map(
    ([, value]) => value
  );

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: statusLabels,
      datasets: [{
        label: 'Status dos Pedidos',
        data: statusValues,
        backgroundColor: '#ff0000'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      // 🔥 HOVER MELHORADO
      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {
        y: { beginAtZero: true }
      },

      plugins: {
        tooltip: {
          enabled: true,
          backgroundColor: '#111',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ff0000',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Quantidade: ${context.raw}`;
            }
          }
        }
      }
    }
  });

  /* ===============================
     🔥 GRÁFICO HORIZONTAL
  =============================== */

  let labels = [];
  let values = [];
  let title = '';
  let colors = [];

const cityMap = {
  '65413-000': 'Alto Alegre do Maranhão',
  '65700-000': 'Bacabal',
  '65723-000': 'Bernardo do Mearim',
  '65704-000': 'Bom Lugar',
  '65340-000': 'Conceição do Lago-Açu',
  '65720-000': 'Igarapé Grande',
  '65715-000': 'Lago da Pedra',
  '65710-000': 'Lago do Junco',
  '65712-000': 'Lago dos Rodrigues',
  '65705-000': 'Lago Verde',
  '65728-000': 'Lima Campos',
  '65706-000': 'Olho d’Água das Cunhãs',
  '65716-000': 'Paulo Ramos',
  '65725-000': 'Pedreiras',
  '65740-000': 'Poção de Pedras',
  '65708-000': 'São Luís Gonzaga do Maranhão',
  '65470-000': 'São Mateus do Maranhão',
  '65727-000': 'Trizidela do Vale',
  '65320-000': 'Vitorino Freire'
};

  // 🔥 DS
  if (mode === 'DS') {

    title = 'Quantidade por Cidade';

    const cityCount = {};

    (extra.rawData || []).forEach(row => {
      const cep = row['Postal Code'];
      const city = cityMap[cep] || cep;

      if (city) {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });

    const sorted = Object.entries(cityCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(c => c.name);
    values = sorted.map(c => c.total);

    colors = sorted.map(() => '#ff0000');
  }

  // 🔥 ONHOLD
  else if (selectedStatus === 'OnHold') {

    title = 'Ocorrências por Entregador';

    const driverCount = {};

    (extra.rawData || []).forEach(row => {
      const driver = row['Driver Name'];
      const status = row['Status'];

      if (status === 'OnHold' && driver) {
        driverCount[driver] = (driverCount[driver] || 0) + 1;
      }
    });

    const sorted = Object.entries(driverCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(d => d.name);
    values = sorted.map(d => d.total);

    colors = sorted.map(() => '#ef4444');
  }

  // 🔥 PADRÃO
  else {

    title = 'Quantidade por Cidade';

    const sorted = (data.citySLA || [])
      .filter(c => c.name)
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(c => c.name);
    values = sorted.map(c => c.total);

    colors = sorted.map(c =>
      c.sla >= 98 ? '#22c55e' :
      c.sla >= 95 ? '#facc15' :
      '#ef4444'
    );
  }

  // 🔥 FALLBACK
  if (!values.length) {
    labels = ['Sem dados'];
    values = [0];
    colors = ['#999'];
  }

  const pieCanvas = document.getElementById('pieChart');
  const chartWrapper = pieCanvas.parentElement;

 

  slaDriverChart = new Chart(pieCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: values.map(v => {
          const num = Number(v);
          return isNaN(num) ? 0 : Math.round(num);
        }),
        backgroundColor: colors,
        borderRadius: 6,
        barThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      // 🔥 HOVER CORRIGIDO (ESSA LINHA FAZ MÁGICA)
      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {
        y: {
          ticks: {
            autoSkip: false,
            font: { size: 12 }
          }
        },
        x: {
  beginAtZero: true,
  min: 0,
  max: Math.max(...values) + 1, // adiciona folga
  ticks: {
    stepSize: 1,
    precision: 10
  }
}
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          enabled: true,
          backgroundColor: '#111',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ff0000',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Quantidade: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}
