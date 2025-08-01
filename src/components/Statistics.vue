<template>
  <div class="stats-container">
    <h1>Финансовая статистика</h1>
    <div class="charts-grid">
      <!-- Колонка с доходами -->
      <div class="charts-column">
        <div class="chart-card">
          <h2>Финансовый контроль</h2>
          <canvas ref="incomeChart"></canvas>
        </div>
        <div class="chart-card">
          <h2>Динамика доходов</h2>
          <canvas ref="incomeTrendChart"></canvas>
        </div>
      </div>

      <!-- Колонка с расходами -->
      <div class="charts-column">
        <div class="chart-card">
          <h2>Расходы по категориям</h2>
          <canvas ref="expenseChart"></canvas>
        </div>
        <div class="chart-card">
          <h2>Сравнение доходов/расходов</h2>
          <canvas ref="comparisonChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
  setup() {
    const incomeChart = ref(null);
    const expenseChart = ref(null);
    const incomeTrendChart = ref(null);
    const comparisonChart = ref(null);

    const chartColors = [
        // Основные цвета с градиентными переходами
        'rgba(198, 134, 248, 1)',     // Фиолетовый (базовый)
        'rgba(180, 140, 255, 1)',     // Фиолетово-синий
        'rgba(156, 136, 255, 0.9)',   // Светло-фиолетовый
        'rgba(133, 113, 244, 0.8)',   // Сине-фиолетовый
        'rgba(120, 140, 240, 0.7)',   // Голубовато-фиолетовый
        'rgba(128, 159, 184, 0.6)',   // Мягкий синий
        'rgba(140, 170, 200, 0.5)',   // Светлый аквамарин
        'rgba(160, 180, 220, 0.4)'    // Очень светлый перелив
    ];

    const getData = () => {
      const incomes = JSON.parse(localStorage.getItem('incomes')) || [];
      const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
      return { incomes, expenses };
    };

    const analyzeByCategory = (data, type) => {
      const categories = type === 'income' 
        ? ['salary', 'freelance', 'investments', 'business', 'gifts', 'other']
        : ['food', 'transport', 'entertainment', 'shopping', 'health', 'bills', 'other'];

      const result = {};
      categories.forEach(cat => result[cat] = 0);

      data.forEach(item => {
        result[item.category] += item.amount;
      });

      return {
        labels: categories.map(cat => {
          const names = {
            income: {
              salary: 'Зарплата',
              freelance: 'Фриланс',
              investments: 'Инвестиции',
              business: 'Бизнес',
              gifts: 'Подарки',
              other: 'Другое'
            },
            expense: {
              food: 'Еда',
              transport: 'Транспорт',
              entertainment: 'Развлечения',
              shopping: 'Шопинг',
              health: 'Здоровье',
              bills: 'Счета',
              other: 'Другое'
            }
          };
          return names[type][cat] || cat;
        }),
        data: categories.map(cat => result[cat])
      };
    };

    const analyzeByMonth = (data) => {
      const months = Array(12).fill(0);
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

      data.forEach(item => {
        const date = new Date(item.date);
        const month = date.getMonth();
        months[month] += item.amount;
      });

      return {
        labels: monthNames,
        data: months
      };
    };

    const createBubbleChart = (ctx, incomes, expenses) => {
        // Анализируем данные для bubble chart
        const allTransactions = [...incomes, ...expenses].map(item => ({
            x: new Date(item.date).getMonth(), // Месяц по оси X
            y: item.amount,                    // Сумма по оси Y
            r: Math.sqrt(item.amount) / 10     // Размер пузырька
        }));

        return new Chart(ctx, {
            type: 'bubble',
            data: {
            datasets: [
                {
                label: 'Доходы',
                data: incomes.map(item => ({
                    x: new Date(item.date).getMonth(),
                    y: item.amount,
                    r: Math.sqrt(item.amount) / 10
                })),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)'
                },
                {
                label: 'Расходы',
                data: expenses.map(item => ({
                    x: new Date(item.date).getMonth(),
                    y: -item.amount, // Отрицательные значения для расходов
                    r: Math.sqrt(item.amount) / 10
                })),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)'
                }
            ]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                labels: {
                    color: 'white'
                }
                },
                tooltip: {
                callbacks: {
                    label: function(context) {
                    const amount = Math.abs(context.raw.y);
                    const type = context.dataset.label === 'Доходы' ? 'Доход' : 'Расход';
                    return `${type}: ${amount} ₽ (${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][context.raw.x]})`;
                    }
                },
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)'
                }
            },
            scales: {
                x: {
                title: {
                    display: true,
                    text: 'Месяц',
                    color: 'white'
                },
                ticks: {
                    color: 'white',
                    callback: function(value) {
                    return ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][value];
                    }
                },
                grid: {
                    color: 'rgba(255,255,255,0.1)'
                }
                },
                y: {
                title: {
                    display: true,
                    text: 'Сумма (₽)',
                    color: 'white'
                },
                ticks: {
                    color: 'white',
                    callback: function(value) {
                    return Math.abs(value);
                    }
                },
                grid: {
                    color: 'rgba(255,255,255,0.1)'
                }
                }
            }
            }
        });
        };

    const createBarChart = (ctx, labels, data, title) => {
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: title,
            data: data,
            backgroundColor: chartColors[0],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              bodyColor: 'white',
              titleColor: 'white',
              backgroundColor: 'rgba(0,0,0,0.7)'
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              }
            },
            y: {
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              },
              beginAtZero: true
            }
          }
        }
      });
    };

    const createRadarChart = (ctx, labels, data, title) => {
      return new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: title,
            data: data,
            backgroundColor: 'rgba(198, 134, 248, 0.4)',
            borderColor: 'rgba(198, 134, 248, 1)',
            pointBackgroundColor: 'rgba(198, 134, 248, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(198, 134, 248, 1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: 'white',
                font: {
                    size : '15px'
                }
              }
            },
            tooltip: {
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)'
            }
          },
          scales: {
            r: {
              angleLines: {
                color: 'rgba(255,255,255,0.1)'
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              pointLabels: {
                color: 'white',
                font: {
                    size : '15px'
                }
              },
              ticks: {
                color: 'white',
                backdropColor: 'transparent'
              }
            }
          }
        }
      });
    };

    const createComparisonChart = (ctx, incomes, expenses) => {
      const incomeData = analyzeByMonth(incomes).data;
      const expenseData = analyzeByMonth(expenses).data;
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

      return new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthNames,
          datasets: [
            {
              label: 'Доходы',
              data: incomeData,
              borderColor: 'rgba(198, 134, 248, 1)',
              backgroundColor: 'rgba(198, 134, 248, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Расходы',
              data: expenseData,
              borderColor: 'rgba(133, 113, 244, 1)',
              backgroundColor: 'rgba(133, 113, 244, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            },
            tooltip: {
              bodyColor: 'white',
              titleColor: 'white',
              backgroundColor: 'rgba(0,0,0,0.7)'
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              }
            },
            y: {
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              },
              beginAtZero: true
            }
          }
        }
      });
    };

    onMounted(() => {
      const { incomes, expenses } = getData();

      // Доходы по категориям (кольцевая диаграмма)
      createBubbleChart(
        incomeChart.value.getContext('2d'),
        incomes,
        expenses,
        'Финансовый контроль'
    );

      // Расходы по категориям (радарная диаграмма)
      const expenseCategories = analyzeByCategory(expenses, 'expense');
      createRadarChart(
        expenseChart.value.getContext('2d'),
        expenseCategories.labels,
        expenseCategories.data,
        'Расходы по категориям'
      );

      // Динамика доходов (столбчатая диаграмма)
      const incomeTrend = analyzeByMonth(incomes);
      createBarChart(
        incomeTrendChart.value.getContext('2d'),
        incomeTrend.labels,
        incomeTrend.data,
        'Доходы'
      );

      // Сравнение доходов и расходов (линейная диаграмма)
      createComparisonChart(
        comparisonChart.value.getContext('2d'),
        incomes,
        expenses
      );
    });

    return {
      incomeChart,
      expenseChart,
      incomeTrendChart,
      comparisonChart
    };
  }
};
</script>

<style scoped>
.stats-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: white;
}

h1 {
  text-align: start;
  margin-bottom: 30px;
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.charts-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.chart-card {
  background: var(--contrast);
  border-radius: 12px;
  width: 35vw;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.chart-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1rem;
  color: white;
  text-align: center;
  font-weight: 500;
}

.chart-card canvas {
  width: 100% !important;
  height: 300px !important;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>