<template>
  <div class="budget-page">
    <h1>Мой бюджет</h1>
    <div class="budget-sections">
        <transition name="slide-fade">
          <!-- Текущие лимиты по категориям -->
          <section class="budget-section a">
            <div class="section-header">
              <h2>Текущие лимиты</h2>
              <button class="add-button" @click="openModal('limit')">+ Добавить лимит</button>
            </div>
            
            <div v-if="limits.length > 0" class="limits-list">
                <div  v-for="limit in limits" :key="limit.id" class="limit-icons-container" :class="{'exceeded': isLimitExceeded(limit)}">
                  <div class="css-progress-container">
                    <div class="css-progress-circle" 
                        :style="getProgressStyle(limit)"
                        :data-tooltip="`${getCategoryName(limit.category)}\nРасходы: ${getCategorySpending(limit.category)}₽\nЛимит: ${limit.amount} ₽`"
                      >
                      <div class="css-progress-fill">
                        <div class="css-progress-icon">
                          <!-- Иконка здесь -->
                          <div 
                            class="limit-icon" 
                            v-for="(iconData, index) in limitIcons" :key="index">
                            <div class="icon-flex" v-if="iconData.name === limit.category">
                              <img class="icon" :src=iconData.component>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- <div class="limit-info">
                      <span class="category-name">{{ getCategoryName(limit.category) }}</span>
                      <span class="limit-amount">{{ getCategorySpending(limit.category) }} / {{ limit.amount }} ₽</span>
                    </div> -->
                    <button class="remove-limit" @click="removeLimit(limit.id)">×</button>
                  </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>Лимиты не установлены</p>
            </div>
          </section>
         </transition>
      
      <!-- Контроль бюджета -->
      <transition name="slide-fade">
        <section class="budget-section b">
          <div class="section-header">
            <h2>Контроль бюджета</h2>
            <button v-if="!budgetControl.active" class="add-button" @click="openModal('budget')">
              + Установить контроль
            </button>
          </div>
          
          <div v-if="budgetControl.active" class="budget-control-info">
            <div class="budget-summary" :style="{...getExceededStyle()}">
              <div class="budget-amount">
                <span class="label">Установленный бюджет:</span>
                <span class="value">{{ budgetControl.amount }} ₽</span>
              </div>
              <div class="remaining-amount">
                <span class="label" >{{ remainingBudget < 0 ? 'Превышение' : 'Осталось:'}} </span>
                <span class="value" style="color: var(--progress-color)">{{ Math.abs(remainingBudget) }} ₽</span>
              </div>
            </div>
            <div class="progress-bar" :style="{...getExceededStyle()}">
              <div class="progress" :style="{width: budgetProgress + '%'}"></div>
            </div>
            <button class="remove-budget-control" @click="removeBudgetControl">× Удалить контроль</button>
          </div>
          <div v-else class="empty-state">
            <p>Контроль бюджета не установлен</p>
          </div>
        </section>
      </transition>
      <transition name="slide-fade">
        <!-- Накопления на цели -->
        <section class="budget-section c">
          <div class="section-header">
            <h2>Накопления на цели</h2>
            <button class="add-button" @click="openModal('saving')">+ Добавить цель</button>
          </div>
          
          <div v-if="savingGoals.length > 0" class="savings-list">
            <div v-for="goal in savingGoals" :key="goal.id" class="saving-item">
              <div class="saving-header">
                <span class="goal-name">{{ goal.name }}</span>
                <span class="goal-amount">{{ totalSavings }} ₽ / {{ goal.targetAmount }} ₽ ({{ goalProgress(goal) }}%)</span>
                <button class="remove-goal" @click="removeGoal(goal.id)">×</button>
              </div>
              <div class="progress-bar">
                <div class="progress" :style="{width: goalProgress(goal) + '%'}"></div>
              </div>
              <div class="saving-details">
                <div class="detail">
                  <span class="label">Ежемесячно:</span>
                  <span class="value">{{ goal.monthlyPayment }} ₽</span>
                </div>
                <div class="detail">
                  <span class="label">До:</span>
                  <span class="value">{{ formatDate(goal.targetDate) }}</span>
                </div>
                <div class="detail">
                  <span :class="['status', {'on-track': isOnTrack(goal), 'behind': !isOnTrack(goal)}]">
                    {{ isOnTrack(goal) ? 'Успеваете' : 'Отстаёте' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>Цели накоплений не установлены</p>
          </div>
        </section>
      </transition>
    </div>
    
    <!-- Модальное окно для добавления лимита -->
    <div v-if="modalType === 'limit'" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Добавить лимит</h3>
          <button class="close-modal" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="limit-amount">Сумма:</label>
            <input id="limit-amount" type="number" v-model.number="newLimit.amount" placeholder="Введите сумму">
          </div>
          <div class="form-group">
            <label for="limit-category">Категория:</label>
            <select 
              id="limit-category" 
              v-model="newLimit.category"
              :class="{'has-limit': isCategoryLimited(newLimit.category)}">
              <option value="">{{'Выберите категорию'}}</option>
              <option 
                v-for="category in availableCategories" 
                :key="category" 
                :value="category"
                :disabled="isCategoryLimited(category)"
              >
                {{ getCategoryName(category) }}
                {{ isCategoryLimited(category) ? '(лимит установлен)' : '' }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-button" @click="setLimit">Сохранить</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно для контроля бюджета -->
    <div v-if="modalType === 'budget'" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Установить бюджет</h3>
          <button class="close-modal" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="budget-amount">Сумма бюджета:</label>
            <input id="budget-amount" type="number" v-model.number="budgetControl.amount" placeholder="Введите сумму">
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-button" @click="setBudgetControl">Сохранить</button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно для целей накоплений -->
    <div v-if="modalType === 'saving'" class="modal-overlay" @click.self="closeModal">
      <div class="goal-modal">
        <div class="modal-header">
          <h3>Добавить цель накоплений</h3>
          <button class="close-modal" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="saving-goal">Название цели:</label>
            <input id="saving-goal" type="text" v-model="newSavingGoal.name" placeholder="Название цели">
          </div>
          <div class="form-group row-group">
            <label for="saving-amount">Сумма цели:</label>
            <label for="saving-monthly">Ежемесячный взнос:</label>
            <input id="saving-amount" type="number" v-model.number="newSavingGoal.targetAmount" placeholder="Введите сумму">
            <input id="saving-monthly" type="number" v-model.number="newSavingGoal.monthlyPayment" placeholder="Минимальный взнос">
          </div>
          <div class="form-group">
            <label for="saving-date">Дата достижения:</label>
            <input id="saving-date" type="date" v-model="newSavingGoal.targetDate">
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-button" @click="addSavingGoal">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import GiftFill from '@/assets/icons/f7_gift-fill.svg';
import Bank from '@/assets/icons/maki_bank.svg';
import BowlingAlley from '@/assets/icons/maki_bowling-alley.svg';
import Bus from '@/assets/icons/maki_bus.svg';
import Convenience from '@/assets/icons/maki_convenience.svg';
import Hospital from '@/assets/icons/maki_hospital.svg';
import Restaurant from '@/assets/icons/maki_restaurant.svg';
import Suitcase from '@/assets/icons/maki_suitcase.svg';
import BagDollar from '@/assets/icons/streamline_bag-dollar-solid.svg';
import ChatBubble from '@/assets/icons/streamline_chat-bubble-text-square-solid.svg';
import EconomicGrowth from '@/assets/icons/streamline_decent-work-and-economic-growth-solid.svg';
import DesktopDollar from '@/assets/icons/streamline_desktop-dollar.svg';

import { useAuth } from '@/composables/useAuth';

const {
  saveToBd,
  getDataFromBd
} = useAuth()
// Категории расходов
const expenseCategories = ref([
  'food', 'transport', 'entertainment', 'shopping', 
  'health', 'bills', 'other'
]);

// Названия категорий для отображения
const categoryNames = {
  food: 'Еда',
  transport: 'Транспорт',
  entertainment: 'Развлечения',
  shopping: 'Шопинг',
  health: 'Здоровье',
  bills: 'Счета',
  other: 'Другое',
  salary: 'Зарплата',
  freelance: 'Фриланс',
  investments: 'Инвестиции',
  business: 'Бизнес',
  gifts: 'Подарки'
};

const limitIcons = [
  { name: 'gifts', component: GiftFill },
  { name: 'bills', component: Bank },
  { name: 'entertainment', component: BowlingAlley },
  { name: 'transport', component: Bus },
  { name: 'shopping', component: Convenience },
  { name: 'health', component: Hospital },
  { name: 'food', component: Restaurant },
  { name: 'business', component: Suitcase },
  { name: 'salary', component: BagDollar },
  { name: 'other', component: ChatBubble },
  { name: 'investments', component: EconomicGrowth },
  { name: 'freelance', component: DesktopDollar }
];

// Данные для формы установки лимитов
const newLimit = ref({
  amount: '',
  category: ''
});

// Данные для контроля бюджета
const budgetControl = ref({
  active: false,
  amount: ''
});

// Данные для новой цели накоплений
const newSavingGoal = ref({
  name: '',
  targetAmount: '',
  monthlyPayment: '',
  targetDate: ''
});

// Лимиты по категориям
const limits = ref([]);

// Цели накоплений
const savingGoals = ref([]);

// Расходы и доходы
const expenses = ref([]);
const incomes = ref([]);

// Управление модальными окнами
const modalType = ref('');


// Загрузка данных из localStorage
const loadData = () => {
  getDataFromBd()
  const savedLimits = localStorage.getItem('budgetLimits');
  const savedBudgetControl = localStorage.getItem('budgetControl');
  const savedSavingGoals = localStorage.getItem('savingGoals');
  const savedExpenses = localStorage.getItem('expenses');
  const savedIncomes = localStorage.getItem('incomes');
  
  if (savedLimits) limits.value = JSON.parse(savedLimits);
  if (savedBudgetControl) budgetControl.value = JSON.parse(savedBudgetControl);
  if (savedSavingGoals) savingGoals.value = JSON.parse(savedSavingGoals);
  if (savedExpenses) expenses.value = JSON.parse(savedExpenses);
  if (savedIncomes) incomes.value = JSON.parse(savedIncomes);
};

// Сохранение данных в localStorage
const saveLimits = () => {
  localStorage.setItem('budgetLimits', JSON.stringify(limits.value));
  saveToBd({budgetLimits: limits.value})
};

const saveBudgetControl = () => {
  localStorage.setItem('budgetControl', JSON.stringify(budgetControl.value));
  saveToBd({budgetControl: budgetControl.value})
};

const saveSavingGoals = () => {
  localStorage.setItem('savingGoals', JSON.stringify(savingGoals.value));
  saveToBd({savingGoals: savingGoals.value})
};

// Вычисляемые свойства
const totalSpending = computed(() => {
  return expenses.value
    .filter(expense => isInCurrentMonth(expense.date))
    .reduce((sum, expense) => sum + expense.amount, 0);
});

const totalSavings = computed(() => {
  const totalIncome = incomes.value.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.value.reduce((sum, expense) => sum + expense.amount, 0);
  return totalIncome - totalExpenses;
});

const spendingByCategory = computed(() => {
  const result = {};
  expenseCategories.value.forEach(category => {
    result[category] = expenses.value
      .filter(expense => expense.category === category && isInCurrentMonth(expense.date))
      .reduce((sum, expense) => sum + expense.amount, 0);
  });
  return result;
});

const remainingBudget = computed(() => {
  if (!budgetControl.value.active) return 0;
  let acc = budgetControl.value.amount - totalSpending.value
  return acc
});


const budgetProgress = computed(() => {
  if (!budgetControl.value.active || budgetControl.value.amount <= 0) return 0;
  return Math.min(100, (totalSpending.value / budgetControl.value.amount) * 100);
});

// Методы
const getExceededStyle = () => {
  return {
    '--progress-color': isExceeded.value ? 'rgba(227, 26, 26, 1)' : 'rgba(1, 181, 116, 1)'
  };
};

const isExceeded = computed(() => {
  return remainingBudget.value < 0
})

const getCategoryName = (category) => {
  return categoryNames[category] || category;
};

const getCategorySpending = (category) => {
  return spendingByCategory.value[category] || 0;
};

const getLimitProgress = (limit) => {
  const spent = getCategorySpending(limit.category);
  return Math.min(100, (spent / limit.amount) * 100);
};

const isLimitExceeded = (limit) => {
  return getCategorySpending(limit.category) > limit.amount;
};

// Доступные категории (без тех, где уже есть лимит)
const availableCategories = ref(computed(() => {
  return expenseCategories.value.filter(
    category => !limits.value.some(limit => limit.category === category)
  );
}));

// Проверка, есть ли лимит для категории
const isCategoryLimited = (category) => {
  return limits.value.some(limit => limit.category === category);
};

const setLimit = () => {
  if (!newLimit.value.amount || !newLimit.value.category) {
    alert('Заполните все поля');
    return;
  }
  
  if (isCategoryLimited(newLimit.value.category)) {
    alert(`Лимит для категории "${getCategoryName(newLimit.value.category)}" уже установлен`);
    return;
  }
  
  const limit = {
    id: Date.now().toString(),
    category: newLimit.value.category,
    amount: parseFloat(newLimit.value.amount)
  };
  
  limits.value.push(limit);
  saveLimits();
  newLimit.value = { amount: '', category: '' };
  closeModal();
};

const removeLimit = (limitId) => {
  limits.value = limits.value.filter(limit => limit.id !== limitId);
  saveLimits();
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

// Проверка, что дата находится в текущем месяце
const isInCurrentMonth = (date) => {
  const { start, end } = getCurrentMonthRange();
  const transactionDate = new Date(date);
  return transactionDate >= start && transactionDate <= end;
};

const setBudgetControl = () => {
  if (!budgetControl.value.amount) return;
  
  budgetControl.value.active = true;
  saveBudgetControl();
  closeModal();
};

const removeBudgetControl = () => {
  budgetControl.value = { active: false, amount: '' };
  saveBudgetControl();
};

const addSavingGoal = () => {
  if (!newSavingGoal.value.name || !newSavingGoal.value.targetAmount || 
      !newSavingGoal.value.monthlyPayment || !newSavingGoal.value.targetDate) {
    return;
  }
  
  const goal = {
    id: Date.now().toString(),
    name: newSavingGoal.value.name,
    targetAmount: parseFloat(newSavingGoal.value.targetAmount),
    monthlyPayment: parseFloat(newSavingGoal.value.monthlyPayment),
    targetDate: newSavingGoal.value.targetDate,
    currentAmount: totalSavings,
    createdAt: new Date().toISOString()
  };
  
  savingGoals.value.push(goal);
  saveSavingGoals();
  newSavingGoal.value = { name: '', targetAmount: '', monthlyPayment: '', targetDate: '' };
  closeModal();
};

const getProgressStyle = (limit) => {
  const progress = getLimitProgress(limit);
  return {
    '--progress': `${progress}%`,
    '--progress-color': isLimitExceeded(limit) ? 'rgba(227, 26, 26, 1)' : 'rgba(1, 181, 116, 1)'
  };
};

const removeGoal = (goalId) => {
  savingGoals.value = savingGoals.value.filter(goal => goal.id !== goalId);
  saveSavingGoals();
};

const goalProgress = (goal) => {
  return Math.min(100, Math.round((totalSavings.value / goal.targetAmount) * 100));
};

const isOnTrack = (goal) => {
  const now = new Date();
  const targetDate = new Date(goal.targetDate);

  if (targetDate <= now) return false;

  let monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12;
  monthsLeft += targetDate.getMonth() - now.getMonth();
  if (targetDate.getDate() < now.getDate()) {
    monthsLeft--;
}
  
  if (monthsLeft <= 0) {
    return goal.currentAmount >= goal.targetAmount;
  }

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const neededMonthly = remainingAmount / monthsLeft;
  
  return goal.monthlyPayment >= neededMonthly || 
         (monthsLeft === 1 && goal.currentAmount + goal.monthlyPayment >= goal.targetAmount);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ru-RU', options);
};

// Методы для модальных окон
const openModal = (type) => {
  modalType.value = type;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  modalType.value = '';
  document.body.style.overflow = '';
};

// Загрузка данных при монтировании
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.css-progress-container {
  width: 90px;
  height: 90px;
  position: relative;
}

.css-progress-container:hover {
  transform: translatey(-5%);
  transition: 0.15s ease-in;
}

.css-progress-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    var(--progress-color) var(--progress),
    #e0e0e0 0
  );
  position: relative;
}


.css-progress-circle:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  width: max-content;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 100;
  pointer-events: none;
  white-space: pre-line; /* Разрешает перенос строки через \n */
  text-align: center;
}

.css-progress-fill {
  position: absolute;
  width: 85%;
  height: 85%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  top: 8%;
  left: 8%;
}

.css-progress-icon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
}

.icon-flex {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 32px;
  filter: invert(100%) sepia(100%) saturate(2%) hue-rotate(36deg) brightness(111%) contrast(100%)
}

.budget-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.budget-page h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 600;
}

.savings-summary {
  background: rgba(19, 20, 109, 0.837);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.savings-summary .savings-amount {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
}

.savings-summary .label {
  color: #ffffff;
}

.savings-summary .value {
  color: rgba(1, 181, 116, 1);
  font-weight: 600;
}

.budget-sections {
  display: grid;
  grid-template-areas: 
    "a b b"
    "a c c";
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 30px;
  width: 72vw;
}

.budget-section {
  background: var(--contrast);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0px 0px 100px 10px rgba(161, 161, 161, 0.162);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.budget-section .section-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  align-items: start;
  margin-bottom: 20px;
}

.budget-section .section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
}

.a {
  height: fit-content;
  grid-area: a;
}

.b {
  grid-area: b;
}

.c {
  grid-area: c;
}

.current-spending, .label, .value {
  color: #fff;
}

.add-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 0.2s;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.add-button:hover {
  transform: scale(1.1);
}

.savings-list {
  display: grid;
  gap: 15px;
}

.limits-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  justify-items: center;
  align-items: start;
  background: rgba(19, 20, 109, 0.837);
  height: max-content;
  border-radius: 8px;
  padding: 20px;
}

.saving-item {
  background: rgba(19, 20, 109, 0.837);
  border-radius: 8px;
  padding: 18px;
  padding-top: 30px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.saving-item .progress-bar .progress {
  --progress-color: rgba(1, 181, 116, 1);
}

.limit-item {
  background: rgba(19, 20, 109, 0.837);
  border-radius: 8px;
  padding: 18px;
  padding-top: 30px;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.limit-item:hover,
.saving-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.limit-icons-container {
  transform: none;
}

.limit-info,
.saving-header {
  display: flex;
  
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.limit-info, .category-name {
  flex-direction: column;
  font-size: 1em;
  color: #fff;
}

.saving-header .goal-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #ffffff;
}

.limit-info .limit-amount,
.saving-header .goal-amount {
  font-weight: 500;
  color: #ffffff;
}

.limit-icons-container{
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar {
  height: 10px;
  background: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
  margin: 12px 0;
}

.progress-bar .progress {
  height: 100%;
  background: var(--progress-color);
  transition: width 0.5s ease-out;
}

.progress-bar .progress .exceeded{
  background: rgba(227, 26, 26, 1);
}

.progress-bar .progress {
  background: var(--progress-color);
}

.remove-limit,
.remove-goal {
  margin-bottom: 10px;
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgb(0, 0, 0);
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.remove-limit {
  top: 0px;
  right: 0px;
}

.remove-limit:hover,
.remove-goal:hover {
  background: #a22300;
}

.budget-control-info {
  background: rgba(19, 20, 109, 0.837);
  border-radius: 8px;
  padding: 20px;
}

.budget-control-info .budget-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.budget-control-info .budget-summary .budget-amount,
.budget-control-info .budget-summary .remaining-amount {
  display: flex;
  flex-direction: column;
}

.budget-control-info .budget-summary .label {
  font-size: 0.9rem;
  color: #ffffff;
}

.budget-control-info .budget-summary .value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
}

select.has-limit {
  border-color: #ff9800;
}

option:disabled {
  color: #ccc;
  background-color: #f5f5f5;
}

.budget-control-info .budget-summary .remaining-amount .value {
  color: rgba(1, 181, 116, 1);
}

.remove-budget-control {
  margin-top: 15px;
  background: rgba(227, 26, 26, 1);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  position: relative;
  right: -60%;
  cursor: pointer;
  transition: transform 0.2s;
}

.remove-budget-control:hover {
  background: #a30000;
}

.saving-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.saving-details .detail {
  display: flex;
  flex-direction: column;
}

.saving-details .detail .label {
  font-size: 0.8rem;
  color: #ffadfcbe;
}

.saving-details .detail .value {
  font-size: 0.9rem;
  font-weight: 500;
}

.saving-details .detail .status {
  font-weight: 600;
}

.saving-details .detail .status.on-track {
  color: rgba(1, 181, 116, 1);
}

.saving-details .detail .status.behind {
  color: rgba(227, 26, 26, 1);
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Стили для модальных окон */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: rgb(4, 17, 41) ;
  border: 3px solid rgb(0, 77, 166);
  border-radius: 20px;
  width: 495px;
  padding: 40px;
  box-shadow: 10px 30px 30px 10px rgba(0, 0, 0, 0.162), 
              0 1px 3px rgba(0, 0, 0, 0.726);
  position: relative;
}

.goal-modal {
  /* background: linear-gradient(129deg, rgba(6, 11, 40, .94) 19.41%, rgba(10, 14, 35, .49) 76.65%); */
  background-color: rgb(4, 17, 41) ;
  border: 3px solid rgb(0, 77, 166);
  border-radius: 20px;
  width: 50vw;
  padding: 40px;
  box-shadow: 10px 30px 30px 10px rgba(0, 0, 0, 0.162), 
              0 1px 3px rgba(0, 0, 0, 0.726);
  position: relative;
}

option {
  background: rgb(12, 2, 70);
}

.row-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1vw;
}

.modal-header {
  margin-bottom: 30px;
  text-align: center;
}

.modal-header h3 {
  font-size: 1.5rem;
  color: #fff;
  margin: 0;
}

.close-modal {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
  padding: 5px;
}

.close-modal:hover {
  color: #6b6b6b;
}

.modal-body {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #fff;
}

.form-group input,
.form-group select {
  width: 100%;
  height: calc(2.25rem + 2px);
  padding: 0.375rem 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  color: #bebebe;
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out;
}

.form-group input::placeholder,
.form-group select::placeholder {
  color: #d7d7d7;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: rgb(0, 117, 255);
  border-radius: 10px;
  border-width: 3px;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.save-button,
.cancel-button {
  padding: 15px;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  border: none;
}

.save-button {
  background-color: rgb(0, 117, 255);
  color: white;
}

.save-button:hover {
  background-color: rgb(0, 117, 255);
}

.cancel-button {
  background: transparent;
  color: #979797;
}

.cancel-button:hover {
  color: #000;
}

/* Специфичные стили для select с установленным лимитом */
select.has-limit {
  border-color: #ff6b6b;
}

.error {
  margin: 10px 0px;
  color: red;
  font-size: 0.8rem;
}
</style>