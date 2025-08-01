<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// Используем композабл для общей логики
const {
  form,
  error,
  loginError,
  passwordError,
  validateLogin,
  validatePassword,
  handleLoginChange,
  handlePasswordChange,
  handleLoginInput,
  handleLoginKeydown,
  hashPassword
} = useAuth()

// Дополнительные поля для регистрации
const nameError = ref('')

// Валидация имени
function validateName(name) {
  if (!name) {
    return 'Имя обязательно'
  }
  
  if (name.length < 2) {
    return 'Имя должно содержать минимум 2 символа'
  }
  
  if (name.length > 50) {
    return 'Имя слишком длинное (максимум 50 символов)'
  }
  
  // Проверяем, что имя содержит только буквы, пробелы и дефисы
  if (!/^[а-яёa-z\s-]+$/i.test(name)) {
    return 'Имя может содержать только буквы, пробелы и дефисы'
  }
  
  return '' // Имя валидно
}

// Обработчик изменения имени
function handleNameChange(event) {
  form.name = event.target.value
  nameError.value = validateName(form.name)
}

// Логика регистрации
async function submit() {
  error.value = ''
  nameError.value = validateName(form.name)
  loginError.value = validateLogin(form.login)
  passwordError.value = validatePassword(form.password)
  
  if (nameError.value || loginError.value || passwordError.value) {
    error.value = 'Пожалуйста, исправьте ошибки в форме'
    return
  }
  
  try {
    const hashedPassword = await hashPassword(form.password)
    console.log('Name:', form.name)
    console.log('Login:', form.login)
    console.log('Hashed password:', hashedPassword)
    
    // Создаем токен для пользователя с помощью готового решения (crypto.randomUUID)
    const token = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )

    // Загружаем текущих пользователей из testBD.json
    let users = []
    try {
      const response = await fetch('/testBD.json')
      if (response.ok) {
        users = await response.json()
      }
    } catch (e) {
      // Если файл не найден или ошибка, начинаем с пустого массива
      users = []
    }
    // Проверяем, существует ли уже пользователь с таким логином
    const existingUser = users.find(u => u.login === form.login)
    if (existingUser) {
      error.value = 'Пользователь с таким логином уже зарегистрирован'
      return
    }
    // Добавляем нового пользователя
    users.push({
      name: form.name,
      login: form.login,
      password: hashedPassword,
      token: token
    })

    // Сохраняем обновленный массив пользователей обратно в testBD.json
    await fetch('http://127.0.0.1:5000/testBD', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    })
    
    // Переход!!!
    window.location.href = '/login';
    
    // Очистка формы после успешной регистрации
    form.name = ''
    form.login = ''
    form.password = ''
    nameError.value = ''
    loginError.value = ''
    passwordError.value = ''
  } catch (e) {
    error.value = 'Ошибка при регистрации'
  }
}

</script>

<template>
  <div class="container">
    <div
      class="registration modal-container"
      :style="{ height: error ? '590px' : '575px' }"
    >
        <div class="modal-content">
            <h1 class="margin-dis"><span class="active">Регистрация </span><span class="inactive">/ <RouterLink to="/login">Вход</RouterLink></span></h1>
            <form name="regForm" @submit.prevent="submit">
                <div class="loginForm-group">
                    <input class="loginFormInput" type="text" name="regPageName" placeholder="Имя" required v-model="form.name" @input="handleNameChange"></input>
                    <hr :style="{ marginBottom: nameError ? '0px' : '45px' }">
                    <div class="error" v-if="nameError">
                        {{ nameError }}
                    </div>
                </div>
                <div class="loginForm-group">
                    <input class="loginFormInput" type="text" name="regPageLogin" placeholder="Email или телефон" required v-model="form.login" @input="handleLoginChange" @keydown="handleLoginKeydown" @blur="handleLoginInput"></input>
                    <hr :style="{ marginBottom: loginError ? '0px' : '45px' }">
                    <div class="error" v-if="loginError">
                        {{ loginError }}
                    </div>
                </div>
                <div class="loginForm-group">
                    <input class="loginFormInput" type="password" name="regPagePassword" placeholder="Придумайте пароль" required v-model="form.password" @input="handlePasswordChange"></input>
                    <hr :style="{ marginBottom: passwordError ? '0px' : '45px' }">
                    <div class="error" v-if="passwordError">
                        {{ passwordError }}
                    </div>
                </div>
                <div class="error" v-if="error">
                    {{ error }}
                </div>
                <!-- <button class="regFormBtn" type="submit" :style="{ marginTop: (nameError || loginError || passwordError || error) ? '10px' : '20px', 
                  bottom: error ? '-100px' : '-80px'
                }">Зарегистрироваться</button> -->
                <button 
                    class="loginFormBtn" 
                    type="submit" 
                    :style="{ 
                      marginTop: (loginError || passwordError || error) ? '20px' : '60px',
                      position: 'static'
                    }"
                  >
                    Войти
                </button>
            </form>
        </div>
    </div>
  </div>
</template>

<style scoped>
    @import '../assets/login.css';
</style>
