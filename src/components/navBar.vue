<template>
  <div class="sidebar-container">
    <!-- Кнопка переключения (видна только на мобильных) -->
    <button @click="toggleSidebar" class="sidebar-toggle">
      <img :src="menuIcon" alt="Menu" />
    </button>

    <!-- Основной сайдбар -->
    <aside 
      class="sidebar"
      :class="{
        'sidebar--collapsed': collapsed,
        'sidebar--expanded': !collapsed,
        'sidebar--dark': darkMode
      }"
    >
      <!-- Профиль пользователя -->
      <div class="sidebar-profile">
        <div class="avatar" :style="{ backgroundImage: `url(${avatarUrl})` }"></div>
        <transition name="fade">
          <div v-if="!collapsed" class="profile-info">
            <h3 class="username">Finance.app</h3>
            <p class="user-email">Finance.app demo</p>
          </div>
        </transition>
      </div>

      <!-- Поиск -->
      <div class="sidebar-search">
        <img :src="searchIcon" alt="Search" />
        <transition name="slide-fade">
          <input 
            v-if="!collapsed"
            type="text" 
            placeholder="Search..." 
            class="search-input"
          />
        </transition>
      </div>

      <!-- Навигационное меню -->
      <nav class="sidebar-nav">
        <template v-for="item in menuItems" :key="item.name">
          <router-link 
            :to="item.path" 
            class="nav-item"
            active-class="active"
            @mouseenter="hoverItem = item.name"
            @mouseleave="hoverItem = null"
          >
            <img :src="item.icon" :alt="item.name" />
            <transition name="slide-fade">
              <span v-if="!collapsed">{{ item.name }}</span>
            </transition>
            <div 
              class="hover-glow"
              :class="{ 'hover-glow--active': hoverItem === item.name }"
            ></div>
          </router-link>
        </template>
      </nav>

      <!-- Нижняя часть (выход и переключатель темы) -->
      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout()">
          <img :src="logoutIcon" alt="Logout" />
          <transition name="slide-fade">
            <span v-if="!collapsed">Выйти</span>
          </transition>
        </button>

        <div class="theme-switcher">
          <img :src="themeIcon" alt="Theme" />
          <transition name="slide-fade">
            <span v-if="!collapsed">{{ darkMode ? 'Тёмный' : 'Светлый' }} режим</span>
          </transition>
          <label class="switch">
            <input type="checkbox" v-model="darkMode" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const {
  logout
} = useAuth()

const router = useRouter()

// Состояние
const collapsed = ref(false)
const darkMode = ref(true)
const hoverItem = ref(null)
const isMobile = ref(window.innerWidth < 768)

// Иконки (замените на свои пути)
const menuIcon = '/House.svg'
const searchIcon = '/Search.svg'
const logoutIcon = '/Logout.svg'
const themeIcon = '/Sun.svg'
const avatarUrl = '/Avatar.png'

// Пункты меню
const menuItems = ref([
  { name: 'Главная', path: '/', icon: '/House.svg' },
  { name: 'Расходы', path: '/expenses', icon: '/Dashboard.svg' },
  { name: 'Доходы', path: '/salary', icon: '/Shipping.svg' },
  { name: 'Мой бюджет', path: '/myfinance', icon: '/Chevron -Right.svg' },
  { name: 'Статистика', path: '/statistics', icon: '/Chart.svg' }
])

// Переключение сайдбара
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// Адаптация под мобильные устройства
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) collapsed.value = true
}

// Наблюдатель за изменением темы
watch(darkMode, (newVal) => {
  document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light')
})

// Инициализация
onMounted(() => {
  window.addEventListener('resize', checkScreenSize)
  checkScreenSize()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* Базовые переменные */
@import '../assets/sidebar.css';
</style>