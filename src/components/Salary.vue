<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted, reactive } from 'vue'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'

// Регистрируем необходимые компоненты Chart.js
Chart.register(ArcElement, Tooltip, Legend, PieController)

// Состояние компонента
const allIncomes = ref([]);
const incomes = ref([])
const newIncome = ref({
  title: '',
  amount: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
})

const categories = ref([
  { id: 'freelance', name: 'Фриланс', icon: '💻', color: 'rgba(45, 140, 252, 1)'},
  { id: 'salary', name: 'Зарплата', icon: '💰', color: 'rgba(45, 140, 252, 0.8)'},
  { id: 'investments', name: 'Инвестиции', icon: '📈', color: 'rgba(45, 140, 252, 0.6)'},
  { id: 'business', name: 'Бизнес', icon: '🏢', color: 'rgba(45, 140, 252, 0.4)'},
  { id: 'gifts', name: 'Подарки', icon: '🎁', color: 'rgba(45, 140, 252, 0.2)'},
  { id: 'other', name: 'Другое', icon: '❓', color: 'rgba(120, 160, 252, 0.25)'}
])

const selectedCategory = ref('')
const showAddForm = ref(false)
const totalIncomes = ref(0)
const chartCanvas = ref(null)

let chartInstance = null
let currentDate = ref(new Date(Date.now()))
const currentYear = ref(currentDate.value.getFullYear());
const currentMonth = ref(currentDate.value.getMonth());
const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];
let month = ref(currentMonth.value);
const selectedMonth = reactive({})
const selectedYear = reactive({})
let year = ref(currentYear.value);
selectedYear.value = year
selectedMonth.value = months[month.value]

const nextMonth = () => {
  if (month.value == 11) {
    month.value = 0
    year.value += 1
  } else {
    month.value += 1
  }
  selectedYear.value = year
  selectedMonth.value = months[month.value]
  return month.value
} 


const previusMonth = () => {
  if (month.value == 0) {
    month.value = 11
    year.value -= 1
  } else {
    month.value -= 1
  }
  selectedYear.value = year
  selectedMonth.value = months[month.value]
  return 
}

const isNextMonthDisabled = computed(() => {
  const now = new Date();
  return (
    month.value === now.getMonth() && 
    year.value === now.getFullYear()
  );
});

// Вычисляемые свойства
const totalAmount = computed(() => {
  return incomes.value.reduce((sum, income) => sum + parseFloat(income.amount), 0)
})

const incomesByCategory = computed(() => {
  const grouped = {}
  categories.value.forEach(cat => {
    grouped[cat.id] = incomes.value
      .filter(exp => exp.category === cat.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  })
  return grouped
})

// Данные для диаграммы
const chartData = computed(() => {
  const data = []
  const labels = []
  const colors = []
  
  console.log('Computing chart data...')
  console.log('Incomes:', incomes.value)
  console.log('Incomes by category:', incomesByCategory.value)
  
  categories.value.forEach(category => {
    const amount = incomesByCategory.value[category.id]
    console.log(`Category ${category.name}: ${amount}`)
    if (amount > 0) {
      data.push(amount)
      labels.push(category.name)
      colors.push(category.color)
    }
  })
  
  console.log('Chart data result:', { data, labels, colors })
  return { data, labels, colors }
})

// Методы
const addIncome = () => {
  if (!newIncome.value.title || !newIncome.value.amount || !newIncome.value.category) {
    alert('Пожалуйста, заполните все обязательные поля')
    return
  }

  const income = {
    id: Date.now(),
    ...newIncome.value,
    amount: parseFloat(newIncome.value.amount)
  }

  allIncomes.value.push(income)
  incomes.value = filterByMonth(allIncomes.value)
  // Сброс формы
  newIncome.value = {
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
  
  showAddForm.value = false
  
  // Сохранение в localStorage
  saveIncomes()
  
  // Обновляем диаграмму
  updateChart()
}

const deleteIncome = (id) => {
  incomes.value = incomes.value.filter(exp => exp.id !== id)
  allIncomes.value = allIncomes.value.filter(exp => exp.id !== id)
  saveIncomes()
  updateChart()
}

const saveIncomes = () => {
  localStorage.setItem('incomes', JSON.stringify(allIncomes.value))
}

const filterByMonth = (expensesArray) => {
  // Проверяем что это массив
  if (!Array.isArray(expensesArray)) return []
  
  return expensesArray.filter(expense => {
    try {
      const expenseDate = new Date(expense.date)
      return (
        expenseDate.getMonth() === month.value &&
        expenseDate.getFullYear() === year.value
      )
    } catch {
      return false
    }
  })
}

const loadIncomes = () => {
  const saved = localStorage.getItem('incomes')
   try {
    // Если данные есть - парсим их, иначе используем пустой массив
    allIncomes.value = saved ? JSON.parse(saved) : []
    // Фильтруем для текущего месяца
    incomes.value = filterByMonth(allIncomes.value)
  } catch (error) {
    console.error('Ошибка загрузки расходов:', error)
    allIncomes.value = []
    incomes.value = []
  }
}

const getCategoryInfo = (categoryId) => {
  return categories.value.find(cat => cat.id === categoryId) || categories.value[6]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(amount)
}

// Методы для работы с диаграммой
const createChart = () => {
  if (!chartCanvas.value) {
    console.log('Canvas not found')
    return
  }
  
  // Уничтожаем предыдущую диаграмму, если она существует
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  // Проверяем, есть ли данные для диаграммы
  if (chartData.value.data.length === 0) {
    console.log('No data for chart')
    return
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: chartData.value.labels,
      datasets: [{
        data: chartData.value.data,
        backgroundColor: chartData.value.colors,
        borderColor: '#ffffff',
        borderWidth: 1,
        hoverBorderWidth: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            },
            color: 'rgb(255,255,255)'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${formatAmount(value)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const updateChart = () => {
  console.log('Updating chart...')
  // Уничтожаем предыдущий экземпляр диаграммы
  nextTick(() => {
    createChart()
  })
}

const isMounted = ref(false)

onMounted(async () => {
  loadIncomes()
  await nextTick()
  isMounted.value = true
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
// Следим за изменениями данных для обновления диаграммы
watch(
  [month, year], () => {
  console.log('Данные обновлены!', loadIncomes(), updateChart());
  },
  () => JSON.stringify(chartData.value), // Следим за строковым представлением данных
  () => {
    if (isMounted.value) {
      updateChart()
      loadIncomes()
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="incomes-container">
    <!-- Заголовок -->
    <div class="incomes-header">
      <h1>Доходы</h1>
      <div class="action-block">
        {{selectedMonth.value}} {{selectedYear.value}}
        <div class="btns-block">
          <button @click="previusMonth" class="change-month-btn">
            {{ '<' }}
          </button>
          <button @click="nextMonth" class="change-month-btn" :disabled="isNextMonthDisabled">
            {{ '>' }}
          </button>
        </div>
      </div>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '✕' : '+ Добавить доход' }}
      </button>
    </div>
    
    
    <!-- Форма добавления дохода -->
    <div v-if="showAddForm" class="add-income-form">
      <h3>Добавить доход</h3>
      <form @submit.prevent="addIncome">
        <div class="form-group">
          <label>Название</label>
          <input 
          v-model="newIncome.title" 
          type="text" 
          placeholder="Например: Выплата за рекламу"
          required
          >
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Сумма</label>
            <input 
            v-model="newIncome.amount" 
            type="number" 
            placeholder="0"
            step="0.01"
            required
            >
          </div>
          
          <div class="form-group">
            <label>Дата</label>
              <input 
              v-model="newIncome.date" 
              type="date"
              required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label>Категория</label>
            <div class="category-grid">
              <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="category-btn"
              :class="{ active: newIncome.category === category.id }"
              @click="newIncome.category = category.id"
              :style="{ '--category-color': category.color }"
              >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Описание (необязательно)</label>
          <textarea 
          v-model="newIncome.description" 
          placeholder="Дополнительная информация..."
          rows="3"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="showAddForm = false" class="btn-secondary">
            Отмена
          </button>
          <button type="submit" class="btn-primary">
            Добавить доход
          </button>
        </div>
      </form>
    </div>
    <div class="main-content">
      <div class="left-column">
        <!-- Круговая диаграмма доходов -->
        <div class="chart-section">
          <h3>Диаграмма дохода по категориям</h3>
          <div class="chart-container">
            <div v-if="chartData.data.length === 0" class="chart-empty">
              <div class="chart-empty-icon">📊</div>
              <p>Добавьте доход, чтобы увидеть диаграмму</p>
            </div>
            <canvas v-else ref="chartCanvas" width="400" height="400" style="max-width: 100%; height: auto;"></canvas>
          </div>
        </div>
        
        <!-- Статистика по категориям -->
        <div class="categories-section">
          <h3>Доход по категориям</h3>
          <div class="categories-grid">
            <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-stat"
            :style="{ '--category-color': category.color }"
            >
            <div class="category-stat-icon">{{ category.icon }}</div>
            <div class="category-stat-info">
                <h4>{{ category.name }}</h4>
                <p>{{ formatAmount(incomesByCategory[category.id]) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-column">
        <!-- Общая статистика -->
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <h3>Общий доход</h3>
              <p class="stat-amount">{{ formatAmount(totalAmount) }}</p>
            </div>
          </div>
          <div class="stat-card count">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>Количество</h3>
              <p class="stat-amount">{{ incomes.length }}</p>
            </div>
          </div>
        </div>
    
        <!-- Список расходов -->
        <div class="incomes-list">
          <h3>Последний доход</h3>
          <div v-if="incomes.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>У вас пока нет дохода</p>
            <button @click="showAddForm = true" class="btn-primary">
              Добавить первый доход
            </button>
          </div>
          
          <div v-else class="incomes-items">
            <div 
              v-for="income in incomes.slice().reverse()" 
              :key="income.id"
              class="income-item"
            >
              <div class="income-icon" :style="{ backgroundColor: getCategoryInfo(income.category).color }">
                {{ getCategoryInfo(income.category).icon }}
              </div>
              
              <div class="income-info">
                <h4>{{ income.title }}</h4>
                <div class="income-dopinfo">
                  <p class="income-category">{{ getCategoryInfo(income.category).name }}</p>
                  <p class="income-date">{{ formatDate(income.date) }}</p>
                </div>
                <div>
                  <p v-if="income.description" class="income-description">
                    {{ income.description }}
                  </p>
                </div>
              </div>
              
              <div class="income-amount">
                <span>{{ formatAmount(income.amount) }}</span>
                <button @click="deleteIncome(income.id)" class="delete-btn">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  display: grid;
  grid-template-columns: 2fr 2fr;
  gap: 30px;
  margin-bottom: 30px;
}

.right-column {
  margin-top: 47px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.incomes-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.incomes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.incomes-header h1 {
  margin: 0;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 700;
}

.action-block {
  font-size: 2rem;
  color: #fff;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-items: center;
  justify-content: center;
}

.btns-block {
  font-size: 2rem;
  color: #fff;
  font-weight: 700;
  display: flex;
  flex-direction: row;
  margin-top: 20px;
  width: 150px;
  align-items: stretch;
  justify-content: space-between;
}

.change-month-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-btn {
  width: 300px;
  height: 60px;
  border-radius: 80px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-btn:hover {
  transform: scale(1.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--contrast);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h3 {
  margin: 0 0 5px 0;
  font-size: 0.7rem;
  color: white;
  font-weight: 500;
}

.stat-amount {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.add-income-form {
  background: var(--contrast);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.add-income-form h3 {
  margin: 0 0 20px 0;
  color: #fff;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #fff;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: var(--category-color);
  transform: translateY(-2px);
}

.category-btn.active {
  border-color: var(--category-color);
  background: var(--category-color);
  color: white;
}

.category-icon {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.category-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e5e9;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chart-section {
  margin-bottom: 30px;
}

.chart-section h3 {
  margin: 0 0 20px 0;
  color: #fff;
}

.chart-container {
  background: var(--contrast);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.chart-empty {
  text-align: center;
  color: #ddd;
}

.chart-empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.chart-empty p {
  margin: 0;
  font-size: 1.1rem;
}

.categories-section {
  margin-bottom: 30px;
}

.categories-section h3 {
  margin: 0 0 20px 0;
  color: #fff;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.category-stat {
  background: var(--contrast);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid var(--category-color);
}

.category-stat-icon {
  font-size: 1.5rem;
}

.category-stat-info h4 {
  margin: 0 0 5px 0;
  font-size: 0.7rem;
  color: #ddd;
}

.category-stat-info p {
  margin: 0;
  font-weight: 700;
  color: white;
}

.incomes-list h3 {
  margin: 0 0 20px 0;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: var(--contrast);
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.empty-state p {
  color: #ddd;
  margin-bottom: 20px;
}

.incomes-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.income-item {
  background: var(--contrast);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
}

.income-item:hover {
  transform: translateY(-2px);
}

.income-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.income-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-self: start;
}

.income-dopinfo {
  display: flex;
  flex-direction: row;
  gap: 30px;
  justify-content:stretch;
}

.income-info h4 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 1rem;
}

.income-category {
  margin: 0 0 3px 0;
  color: #ddd;
  font-size: 0.7rem;
}

.income-date {
  margin: 0 0 5px 0;
  color: #ddd;
  font-size: 0.7rem;
}

.income-description {
  margin: 0;
  color: #ddd;
  font-size: 0.7rem;
  font-style: italic;
}

.income-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.income-amount span {
  font-weight: 700;
  color: white;
  font-size: 1.1rem;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .incomes-container {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    padding: 15px;
    min-height: 300px;
  }
  
  .income-item {
    flex-direction: column;
    text-align: center;
  }
  
  .income-amount {
    flex-direction: row;
    align-items: center;
    gap: 15px;
  }
}
</style>
