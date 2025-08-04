<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const props = defineProps({

})

// Используем композабл для общей логики
const {
  form,
  error,
  loginError,
  passwordError,
  isAuthenticated,
  currentUser,
  logout,
  validateLogin,
  validateEmail,
  validatePassword,
  formatPhoneNumber,
  handleLoginChange,
  handlePasswordChange,
  handleLoginInput,
  handleLoginKeydown,
  hashPassword,
  checkAuthentication
} = useAuth()

// Логика входа (специфичная для формы входа)
async function submit() {
  error.value = ''
  loginError.value = validateLogin(form.login)
  passwordError.value = validatePassword(form.password)
  
  if (loginError.value || passwordError.value) {
    error.value = 'Пожалуйста, исправьте ошибки в форме'
    return
  }
  
  try {
    const hashedPassword = await hashPassword(form.password)
    // Здесь можно отправить form.login и hashedPassword на сервер
    // Например:
    // await api.login({ login: form.login, password: hashedPassword })
    console.log('Login:', form.login)
    console.log('Hashed password:', hashedPassword)
    const response = await fetch('http://127.0.0.1:5000/testBD')
    if (!response.ok) {
      error.value = 'Ошибка загрузки базы пользователей'
      return
    }
    const users = await response.json()
    const user = users.find(
      u => u.login === form.login && u.password === hashedPassword
    )
    
    if (!user) {
      error.value = 'Неверный логин или пароль'
      return
    }
    
    // Берём токен пользователя и записываем его в localStorage только если пользователь найден
    const token = user.token
    localStorage.setItem('token', token)

    // Обновляем состояние аутентификации
    isAuthenticated.value = true
    currentUser.value = user
    
    window.location.href ='/expenses';
    // ПЕРЕХОД <-
    // Очистка формы после успешного входа
    form.login = ''
    form.password = ''
    loginError.value = ''
    passwordError.value = ''
  } catch (e) {
    error.value = 'Ошибка при входе'
  }
}

</script>

<template>
  <!-- Вход -->
  <div class="container">
    <div class="modal-container login">
        <div class="modal-content">
            <h1><span class="active">Вход </span><span class="inactive">/ <RouterLink to="/registration">Регистрация</RouterLink></span></h1>
            <form name="loginForm" @submit.prevent="submit">
                <div class="loginForm-group">
                    <input class="loginFormInput" type="text" name="loginPageLogin" placeholder="Email или телефон" required v-model="form.login" @input="handleLoginChange" @keydown="handleLoginKeydown" @blur="handleLoginInput"></input>
                    <hr :style="{ marginBottom: loginError ? '0px' : '45px' }">
                    <div class="error" v-if="loginError">
                        {{ loginError }}
                    </div>
                </div>
                <div class="loginForm-group">
                    <input class="loginFormInput" type="password" name="loginPagePassword" placeholder="Пароль" required v-model="form.password" @input="handlePasswordChange"></input>
                    <hr :style="{ marginBottom: passwordError ? '0px' : '45px' }">
                    <div class="error" v-if="passwordError">
                        {{ passwordError }}
                    </div>
                </div>
                <div class="error" v-if="error">
                    {{ error }}
                </div>
                <button class="loginFormBtn" type="submit" :style="{ marginTop: (loginError || passwordError || error) ? '10px' : '20px' }">Войти</button>
            </form>
            <RouterView />
        </div>
    </div>
  </div>
</template>

<style scoped>
    @import '../assets/login.css';
</style>