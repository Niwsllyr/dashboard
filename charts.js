let barChart;
let slaDriverChart;

export function renderCharts(data, mode = 'default', extra = {}) {

  if (barChart) barChart.destroy();
  if (slaDriverChart) slaDriverChart.destroy();

  const selectedStatus = extra.status || '';

  /* ===============================
     🔤 GRAFICO 1 (NUMERICO)
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
    ([, value]) => Number(value) || 0
  );

  // 🔥 NOVO: CORES DINÂMICAS POR STATUS
  const statusColors = filteredStatus.map(([status]) => {
    if (status === 'Delivered') return '#22c55e';   // verde
    if (status === 'Delivering') return '#facc15';  // amarelo
    return '#ef4444'; // vermelho para os outros
  });

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: statusLabels,
      datasets: [{
        label: 'Quantidade',
        data: statusValues,
        backgroundColor: statusColors // 🔥 ALTERADO AQUI
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  /* ===============================
     🔥 GRAFICO 2 (PORCENTAGEM)
  =============================== */

  let labels = [];
  let values = [];
  let rawValues = [];
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

  /* ===============================
     🔥 DS (AGORA POR CIDADE)
  =============================== */
  if (mode === 'DS') {

    title = 'Performance por Cidade (%)';

    const cityStats = {};

    (extra.rawData || []).forEach(row => {
      const cep = row['Postal Code'];
      const city = cityMap[cep] || cep;
      const status = row['Status'];

      if (!city) return;

      if (!cityStats[city]) {
        cityStats[city] = {
          total: 0,
          delivered: 0
        };
      }

      cityStats[city].total++;

      if (status === 'Delivered') {
        cityStats[city].delivered++;
      }
    });

    const sorted = Object.entries(cityStats)
      .map(([name, stats]) => {
        const percent = stats.total
          ? (stats.delivered / stats.total) * 100
          : 0;

        return {
          name,
          percent,
          total: stats.total,
          delivered: stats.delivered
        };
      })
      .sort((a, b) => b.percent - a.percent);

    labels = sorted.map(c => c.name);
    values = sorted.map(c => c.percent);
    rawValues = sorted.map(c => `${c.delivered}/${c.total}`);

    colors = sorted.map(c =>
      c.percent >= 98 ? '#22c55e' :
      c.percent >= 95 ? '#facc15' :
      '#ef4444'
    );
  }

  /* ===============================
     🔥 ONHOLD
  =============================== */
  else if (selectedStatus === 'OnHold') {

    title = 'Ocorrências por Entregador (%)';

    const driverCount = {};

    (extra.rawData || []).forEach(row => {
      const driver = row['Driver Name'];
      const status = row['Status'];

      if (status === 'OnHold' && driver) {
        driverCount[driver] = (driverCount[driver] || 0) + 1;
      }
    });

    const total = Object.values(driverCount).reduce((a, b) => a + b, 0);

    const sorted = Object.entries(driverCount)
      .map(([name, totalDriver]) => ({
        name,
        total: totalDriver,
        percent: total ? (totalDriver / total) * 100 : 0
      }))
      .sort((a, b) => b.percent - a.percent);

    labels = sorted.map(d => d.name);
    rawValues = sorted.map(d => d.total);
    values = sorted.map(d => d.percent);

    colors = sorted.map(() => '#ef4444');
  }

  /* ===============================
     🔥 SLA (MANTIDO)
  =============================== */
  else {

    title = 'SLA por Cidade (%)';

    const sorted = (data.citySLA || [])
      .filter(c => c.name)
      .map(c => ({
        name: c.name,
        percent: Number(c.sla) || 0,
        total: c.total || 0
      }))
      .sort((a, b) => b.percent - a.percent);

    labels = sorted.map(c => c.name);
    rawValues = sorted.map(c => c.total);
    values = sorted.map(c => c.percent);

    colors = sorted.map(c =>
      c.percent >= 98 ? '#22c55e' :
      c.percent >= 95 ? '#facc15' :
      '#ef4444'
    );
  }

  if (!labels.length) {
    labels = ['Sem dados'];
    values = [0];
    rawValues = ['0/0'];
    colors = ['#999'];
  }

  const pieCanvas = document.getElementById('pieChart');

  slaDriverChart = new Chart(pieCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        barThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => value + '%'
          }
        }
      },

      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const i = context.dataIndex;
              return `${values[i].toFixed(2)}% (${rawValues[i]})`;
            }
          }
        }
      }
    }
  });
}

