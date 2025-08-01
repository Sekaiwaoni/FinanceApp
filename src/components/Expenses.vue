<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted, reactive } from 'vue'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'

// Регистрируем необходимые компоненты Chart.js
Chart.register(ArcElement, Tooltip, Legend, PieController)

// Состояние компонента
const allExpenses = ref([]);
const expenses = ref([])
const newExpense = ref({
  title: '',
  amount: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
})

const categories = ref([
  { id: 'food', name: 'Продукты', icon: '🍽️', color: 'rgba(133, 113, 244, 0.6)' },
  { id: 'transport', name: 'Транспорт', icon: '🚗', color: 'rgba(133, 113, 244, 0.8)' },
  { id: 'entertainment', name: 'Развлечения', icon: '🎮', color: 'rgba(133, 113, 244, 1)' },
  { id: 'shopping', name: 'Покупки', icon: '🛍️', color: 'rgba(69, 208, 238, 0.6)' },
  { id: 'health', name: 'Здоровье', icon: '💊', color: 'rgba(69, 208, 238, 0.8)' },
  { id: 'bills', name: 'Счета', icon: '📄', color: 'rgba(69, 208, 238, 1)' },
  { id: 'other', name: 'Другое', icon: '📌', color: 'rgba(241, 244, 249, 1)' }
])

const selectedCategory = ref('')
const showAddForm = ref(false)
const totalExpenses = ref(0)
const chartCanvas = ref(null)
let chartInstance = null;
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
  return expenses.value.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
})

const expensesByCategory = computed(() => {
  const grouped = {}
  categories.value.forEach(cat => {
    grouped[cat.id] = expenses.value
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
  console.log('Expenses:', expenses.value)
  console.log('Expenses by category:', expensesByCategory.value)
  
  categories.value.forEach(category => {
    const amount = expensesByCategory.value[category.id]
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
const addExpense = () => {
  if (!newExpense.value.title || !newExpense.value.amount || !newExpense.value.category) {
    alert('Пожалуйста, заполните все обязательные поля')
    return
  }

  const expense = {
    id: Date.now(),
    ...newExpense.value,
    amount: parseFloat(newExpense.value.amount)
  }

  allExpenses.value.push(expense)
  expenses.value = filterByMonth(allExpenses.value)
  
  // Сброс формы
  newExpense.value = {
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
  
  showAddForm.value = false
  
  // Сохранение в localStorage
  saveExpenses()
  
  // Обновляем диаграмму
  updateChart()
}

const deleteExpense = (id) => {
  expenses.value = expenses.value.filter(exp => exp.id !== id)
  allExpenses.value = allExpenses.value.filter(exp => exp.id !== id)
  saveExpenses()
  updateChart()
}

const saveExpenses = () => {
  localStorage.setItem('expenses', JSON.stringify(allExpenses.value))
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

const loadExpenses = () => {
  const saved = localStorage.getItem('expenses')
  try {
    // Если данные есть - парсим их, иначе используем пустой массив
    allExpenses.value = saved ? JSON.parse(saved) : []
    // Фильтруем для текущего месяца
    expenses.value = filterByMonth(allExpenses.value)
  } catch (error) {
    console.error('Ошибка загрузки расходов:', error)
    allExpenses.value = []
    expenses.value = []
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
        hoverBorderWidth: 6,
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
              size: 12,
              weight: 500
            },
            color: 'rgb(255,255,255)'
          },
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
  loadExpenses()
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
  console.log('Данные обновлены!', loadExpenses(), updateChart());
  },
  () => JSON.stringify(chartData.value), // Следим за строковым представлением данных
  () => selectedMonth,
  () => {
    if (isMounted.value) {
      updateChart()
      loadExpenses()
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="expenses-container">
    <!-- Заголовок -->
    <div class="expenses-header">
      <h1>Расходы</h1>
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
        {{ showAddForm ? '✕' : '+ Добавить расход' }}
      </button>
    </div>
    
    
    <!-- Форма добавления расхода -->
    <div v-if="showAddForm" class="add-expense-form">
      <h3>Добавить расход</h3>
      <form @submit.prevent="addExpense">
        <div class="form-group">
          <label>Название</label>
          <input 
          v-model="newExpense.title" 
          type="text" 
          placeholder="Например: Продукты"
          required
          >
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Сумма</label>
            <input 
            v-model="newExpense.amount" 
            type="number" 
            placeholder="0"
            step="0.01"
            required
            >
          </div>
          
          <div class="form-group">
            <label>Дата</label>
              <input 
              v-model="newExpense.date" 
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
              :class="{ active: newExpense.category === category.id }"
              @click="newExpense.category = category.id"
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
          v-model="newExpense.description" 
          placeholder="Дополнительная информация..."
          rows="3"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="showAddForm = false" class="btn-secondary">
            Отмена
          </button>
          <button type="submit" class="btn-primary">
            Добавить расход
          </button>
        </div>
      </form>
    </div>
    <div class="main-content">
      <div class="left-column">
        <!-- Круговая диаграмма расходов -->
        <div class="chart-section">
          <h3>Диаграмма расходов по категориям</h3>
          <div class="chart-container">
            <div v-if="chartData.data.length === 0" class="chart-empty">
              <div class="chart-empty-icon">📊</div>
              <p>Добавьте расходы, чтобы увидеть диаграмму</p>
            </div>
            <canvas v-else ref="chartCanvas" width="400" height="400" style="max-width: 100%; height: auto;"></canvas>
          </div>
        </div>
        
        <!-- Статистика по категориям -->
        <div class="categories-section">
          <h3>Расходы по категориям</h3>
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
                <p>{{ formatAmount(expensesByCategory[category.id]) }}</p>
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
              <h3>Общие расходы</h3>
              <p class="stat-amount">{{ formatAmount(totalAmount) }}</p>
            </div>
          </div>
          <div class="stat-card count">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>Количество</h3>
              <p class="stat-amount">{{ expenses.length }}</p>
            </div>
          </div>
        </div>
    
        <!-- Список расходов -->
        <div class="expenses-list">
          <h3>Последний доход</h3>
          <div v-if="expenses.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>У вас пока нет дохода</p>
            <button @click="showAddForm = true" class="btn-primary">
              Добавить первый доход
            </button>
          </div>
          
          <div v-else class="expenses-items">
            <div 
              v-for="expense in expenses.slice().reverse()" 
              :key="expense.id"
              class="expense-item"
            >
              <div class="expense-icon" :style="{ backgroundColor: getCategoryInfo(expense.category).color }">
                {{ getCategoryInfo(expense.category).icon }}
              </div>
              
              <div class="expense-info">
                <h4>{{ expense.title }}</h4>
                <div class="expense-dopinfo">
                  <p class="expense-category">{{ getCategoryInfo(expense.category).name }}</p>
                  <p class="expense-date">{{ formatDate(expense.date) }}</p>
                </div>
                <div>
                  <p v-if="expense.description" class="expense-description">
                    {{ expense.description }}
                  </p>
                </div>
              </div>
              
              <div class="expense-amount">
                <span>{{ formatAmount(expense.amount) }}</span>
                <button @click="deleteExpense(expense.id)" class="delete-btn">
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

.expenses-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.expenses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.expenses-header h1 {
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
  color: var(--white);
  font-weight: 500;
}

.stat-amount {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--white);
}

.add-expense-form {
  background: var(--contrast);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.add-expense-form h3 {
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
  background: #e9ecef;
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
  color: #666;
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
  color: var(--white);
}

.category-stat-info p {
  margin: 0;
  font-weight: 700;
  color: #ddd;
}

.expenses-list h3 {
  margin: 0 0 20px 0;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

.expenses-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.expense-item {
  background: var(--contrast);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
}

.expense-item:hover {
  transform: translateY(-2px);
}

.expense-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.expense-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-self: start;
}

.expense-dopinfo {
  display: flex;
  flex-direction: row;
  gap: 30px;
  justify-content:stretch;
}

.expense-info h4 {
  margin: 0 0 5px 0;
  color: var(--white);
  font-size: 1rem;
}

.expense-category {
  margin: 0 0 3px 0;
  color: #ddd;
  font-size: 0.7rem;
}

.expense-date {
  margin: 0 0 5px 0;
  color: #ddd;
  font-size: 0.7rem;
}

.expense-description {
  margin: 0;
  color: #ddd;
  font-size: 0.7rem;
  font-style: italic;
}

.expense-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.expense-amount span {
  font-weight: 700;
  color: var(--white);
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
  .expenses-container {
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
  
  .expense-item {
    flex-direction: column;
    text-align: center;
  }
  
  .expense-amount {
    flex-direction: row;
    align-items: center;
    gap: 15px;
  }
}
</style>
