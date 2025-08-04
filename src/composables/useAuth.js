import { reactive, ref, onMounted } from 'vue'

export function useAuth() {
  const form = reactive({
    name: '',
    login: '',
    password: ''
  })

  const error = ref('')
  const loginError = ref('')
  const passwordError = ref('')
  const isAuthenticated = ref(false)
  const currentUser = ref(null)

  // Проверка аутентификации при загрузке компонента
  onMounted(async () => {
    await checkAuthentication()
  })

  // Функция проверки аутентификации
  async function checkAuthentication() {
    const token = localStorage.getItem('token')
    
    if (!token) {
      isAuthenticated.value = false
      currentUser.value = null
      return
    }
    
    try {
      const response = await fetch('/testBD.json')
      if (!response.ok) {
        console.error('Ошибка загрузки базы пользователей')
        isAuthenticated.value = false
        currentUser.value = null
        localStorage.removeItem('token')
        return
      }
      
      const users = await response.json()
      const user = users.find(u => u.token === token)
      
      if (user) {
        isAuthenticated.value = true
        currentUser.value = user
        console.log('Пользователь аутентифицирован:', user.login)
      } else {
        isAuthenticated.value = false
        currentUser.value = null
        localStorage.removeItem('token')
        console.log('Токен не найден в базе данных')
      }
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error)
      isAuthenticated.value = false
      currentUser.value = null
      localStorage.removeItem('token')
    }
  }

  // Функция выхода из системы
  function logout() {
    saveToBd({expenses: JSON.parse(localStorage.getItem("expenses")),
              incomes: JSON.parse(localStorage.getItem("incomes")),
              budgetLimits: JSON.parse(localStorage.getItem("budgetLimits")),
              budgetControl: JSON.parse(localStorage.getItem("budgetControl")),
              savingGoals: JSON.parse(localStorage.getItem("savingGoals"))
    })
    localStorage.removeItem('token')
    isAuthenticated.value = false
    currentUser.value = null
    window.location.href = '/login';
    console.log('Пользователь вышел из системы')
  }

  // Валидация логина (телефон или email)
  function validateLogin(login) {
    // Паттерн для телефона: +7(XXX) XXX-XX-XX
    const phonePattern = /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/
    
    if (!login) {
      return 'Логин обязателен'
    }
    
    if (phonePattern.test(login)) {
      return '' // Валидный телефон
    }
    
    // Проверяем, является ли это email
    if (login.includes('@')) {
      return validateEmail(login)
    }
    
    return 'Логин должен быть в формате +7(XXX) XXX-XX-XX или example@email.ru'
  }

  // Детальная валидация email
  function validateEmail(email) {
    // Базовые проверки
    if (!email.includes('@')) {
      return 'Email должен содержать символ @'
    }
    
    if (!email.includes('.')) {
      return 'Email должен содержать точку в домене'
    }
    
    // Разделяем email на локальную часть и домен
    const parts = email.split('@')
    if (parts.length !== 2) {
      return 'Email должен содержать только один символ @'
    }
    
    const localPart = parts[0]
    const domain = parts[1]
    
    // Проверяем локальную часть
    if (localPart.length === 0) {
      return 'Локальная часть email не может быть пустой'
    }
    
    if (localPart.length > 64) {
      return 'Локальная часть email слишком длинная (максимум 64 символа)'
    }
    
    // Проверяем, что локальная часть начинается и заканчивается буквой или цифрой
    if (!/^[a-zA-Z0-9]/.test(localPart)) {
      return 'Локальная часть email должна начинаться с буквы или цифры'
    }
    
    if (!/[a-zA-Z0-9]$/.test(localPart)) {
      return 'Локальная часть email должна заканчиваться буквой или цифрой'
    }
    
    // Проверяем допустимые символы в локальной части
    if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
      return 'Локальная часть email содержит недопустимые символы'
    }
    
    // Проверяем, что точки не стоят рядом
    if (localPart.includes('..')) {
      return 'Локальная часть email не может содержать две точки подряд'
    }
    
    // Проверяем домен
    if (domain.length === 0) {
      return 'Домен email не может быть пустым'
    }
    
    if (domain.length > 253) {
      return 'Домен email слишком длинный (максимум 253 символа)'
    }
    
    // Проверяем, что домен начинается и заканчивается буквой или цифрой
    if (!/^[a-zA-Z0-9]/.test(domain)) {
      return 'Домен email должен начинаться с буквы или цифры'
    }
    
    if (!/[a-zA-Z0-9]$/.test(domain)) {
      return 'Домен email должен заканчиваться буквой или цифрой'
    }
    
    // Проверяем допустимые символы в домене
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return 'Домен email содержит недопустимые символы'
    }
    
    // Проверяем, что точки не стоят рядом в домене
    if (domain.includes('..')) {
      return 'Домен email не может содержать две точки подряд'
    }
    
    // Проверяем, что домен содержит хотя бы одну точку
    if (!domain.includes('.')) {
      return 'Домен email должен содержать точку'
    }
    
    // Проверяем TLD (домен верхнего уровня)
    const tld = domain.split('.').pop()
    if (tld.length < 2) {
      return 'Домен верхнего уровня должен содержать минимум 2 символа'
    }
    
    if (tld.length > 6) {
      return 'Домен верхнего уровня слишком длинный (максимум 6 символов)'
    }
    
    // Проверяем, что TLD содержит только буквы
    if (!/^[a-zA-Z]+$/.test(tld)) {
      return 'Домен верхнего уровня должен содержать только буквы'
    }
    
    // Финальная проверка с полным паттерном
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailPattern.test(email)) {
      return 'Неверный формат email'
    }
    
    return '' // Email валиден
  }

  // Валидация пароля
  function validatePassword(password) {
    if (!password) {
      return 'Пароль обязателен'
    }
    
    if (password.length < 8 || password.length > 15) {
      return 'Пароль должен содержать от 8 до 15 символов'
    }
    
    // Проверяем наличие русских букв
    const hasRussianLetters = /[а-яё]/i.test(password)
    
    // Проверяем наличие английских букв
    const hasEnglishLetters = /[a-z]/i.test(password)
    
    // Проверяем наличие цифр
    const hasNumbers = /\d/.test(password)
    
    if (!hasRussianLetters && !hasEnglishLetters) {
      return 'Пароль должен содержать русские или английские буквы'
    }
    
    if (!hasNumbers) {
      return 'Пароль должен содержать цифры'
    }
    
    return '' // Пароль валиден
  }

  // Функция для форматирования телефона при вводе
  function formatPhoneNumber(value) {
    // Убираем все символы кроме цифр
    const numbers = value.replace(/\D/g, '')
    
    // Если нет цифр, возвращаем пустую строку
    if (numbers.length === 0) return ''
    
    // Обрабатываем номер
    let processedNumbers = numbers
    
    // Если первая цифра 8, заменяем на 7
    if (processedNumbers.startsWith('8')) {
      processedNumbers = '7' + processedNumbers.slice(1)
    } else if (processedNumbers.length > 0 && !processedNumbers.startsWith('7')) {
      // Если первая цифра не 7 и не 8, добавляем 7 в начало
      processedNumbers = '7' + processedNumbers
    }
    
    // Убираем лишние цифры, если их больше 10 (без учета первой 7)
    if (processedNumbers.length > 11) {
      processedNumbers = processedNumbers.slice(0, 11)
    }
    
    // Если у нас есть 7 в начале, убираем её для форматирования
    // так как +7 будет добавлен в начале результата
    if (processedNumbers.startsWith('7')) {
      processedNumbers = processedNumbers.slice(1)
    }
    
    // Форматируем номер по шаблону +7(XXX) XXX-XX-XX
    if (processedNumbers.length <= 1) return `+7(${processedNumbers}`
    if (processedNumbers.length <= 4) return `+7(${processedNumbers.slice(0, 3)})${processedNumbers.slice(3)}`
    if (processedNumbers.length <= 7) return `+7(${processedNumbers.slice(0, 3)})${processedNumbers.slice(3, 6)}-${processedNumbers.slice(6)}`
    if (processedNumbers.length <= 9) return `+7(${processedNumbers.slice(0, 3)})${processedNumbers.slice(3, 6)}-${processedNumbers.slice(6, 8)}-${processedNumbers.slice(8)}`
    
    return `+7(${processedNumbers.slice(0, 3)})${processedNumbers.slice(3, 6)}-${processedNumbers.slice(6, 8)}-${processedNumbers.slice(8, 10)}`
  }

  // Обработчик изменения логина
  function handleLoginChange(event) {
    const value = event.target.value
    
    // Если поле пустое, очищаем
    if (value === '') {
      form.login = ''
      loginError.value = ''
      return
    }
    
    // Проверяем, является ли ввод телефоном
    const isPhoneInput = value.startsWith('+') || 
                        value.startsWith('8') || 
                        value.includes('(') || 
                        value.includes(')') || 
                        (/^\d+$/.test(value)) || // Если введены только цифры
                        (/^\d/.test(value) && !value.includes('@')) // Если начинается с цифры и не содержит @
    
    if (isPhoneInput) {
      // Если вводится только +, добавляем 7(
      if (value === '+') {
        form.login = '+7('
        return
      }
      
      // Если вводится только 8, заменяем на +7(
      if (value === '8') {
        form.login = '+7('
        return
      }
      
      // Если вводится +7, добавляем открывающую скобку
      if (value === '+7') {
        form.login = '+7('
        return
      }
      
      // Если вводится одна цифра (не 8), начинаем форматирование телефона
      if (/^\d$/.test(value) && value !== '8') {
        form.login = formatPhoneNumber(value)
        return
      }
      
      // Если поле уже содержит отформатированный номер, обрабатываем изменения
      if (form.login.includes('(') && form.login.includes(')') && form.login.includes('-')) {
        // Извлекаем только цифры из нового значения
        const newNumbers = value.replace(/\D/g, '')
        
        // Если цифр не осталось, очищаем поле
        if (newNumbers.length === 0) {
          form.login = ''
          loginError.value = ''
          return
        }
        
        // Проверяем, не пытается ли пользователь удалить символы форматирования
        const oldNumbers = form.login.replace(/\D/g, '')
        if (newNumbers.length < oldNumbers.length) {
          // Пользователь удалил цифру, переформатируем
          form.login = formatPhoneNumber(newNumbers)
        } else {
          // Пользователь добавил цифру или изменил что-то еще
          form.login = formatPhoneNumber(newNumbers)
        }
      } else {
        // Форматируем как телефон
        form.login = formatPhoneNumber(value)
      }
    } else {
      // Если это не телефон (email), оставляем как есть
      form.login = value
      // Если это email, валидируем его
      if (value.includes('@')) {
        loginError.value = validateEmail(value)
      }
    }
    
    loginError.value = validateLogin(form.login)
  }

  // Обработчик изменения пароля
  function handlePasswordChange(event) {
    form.password = event.target.value
    passwordError.value = validatePassword(form.password)
  }

  // Обработчик изменения логина для email (дополнительная валидация)
  function handleLoginInput(event) {
    const value = event.target.value
    
    // Если это email (содержит @), показываем детальную валидацию
    if (value.includes('@')) {
      loginError.value = validateEmail(value)
    }
  }

  // Обработчик нажатия клавиш для ограничения ввода в поле телефона
  function handleLoginKeydown(event) {
    const value = event.target.value
    
    // Проверяем, является ли это полем телефона
    const isPhoneField = value.startsWith('+7(') || 
                        (value.includes('(') && value.includes(')') && value.includes('-')) ||
                        (value.startsWith('+') && !value.includes('@'))
    
    // Проверяем, является ли это полем email
    const isEmailField = value.includes('@')
    
    if (isPhoneField && !isEmailField) {
      // Специальная обработка для Backspace
      if (event.key === 'Backspace') {
        const cursorPosition = event.target.selectionStart
        
        // Если курсор находится в начале +7(, очищаем поле полностью
        if (cursorPosition <= 4) { // +7( занимает 4 символа
          event.preventDefault()
          form.login = ''
          loginError.value = ''
          return
        }
        
        // Если курсор находится на символе форматирования, удаляем его и цифру за ним
        const charAtCursor = value[cursorPosition - 1]
        if (charAtCursor === '-' || charAtCursor === ')' || charAtCursor === '(') {
          event.preventDefault()
          
          // Находим позицию цифры перед символом форматирования
          let digitPosition = cursorPosition - 1
          while (digitPosition > 0 && !/\d/.test(value[digitPosition - 1])) {
            digitPosition--
          }
          
          // Удаляем символ форматирования и цифру за ним
          const newValue = value.slice(0, digitPosition - 1) + value.slice(cursorPosition)
          
          // Переформатируем номер
          const numbers = newValue.replace(/\D/g, '')
          if (numbers.length === 0) {
            form.login = ''
            loginError.value = ''
          } else {
            form.login = formatPhoneNumber(numbers)
          }
          return
        }
        
        return // Разрешаем обычное удаление
      }
      
      // Разрешаем удаление и навигацию
      if (event.key === 'Delete' || 
          event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
          event.key === 'Home' || event.key === 'End' ||
          event.key === 'Tab') {
        return
      }
      
      // Разрешаем только цифры
      if (/^\d$/.test(event.key)) {
        return
      }
      
      // Блокируем все остальные клавиши
      event.preventDefault()
    } else {
      // Для email или пустого поля разрешаем все символы
      return
    }
  }

  async function saveToBd(opName) {
    const token = localStorage.getItem("token")
    let users
    try {
        const response = await fetch('http://127.0.0.1:5000/testBD')
        if (response.ok) {
          users = await response.json()
        }
      } catch (e) {
        // Если файл не найден или ошибка, начинаем с пустого массива
        console.error('Файл не найден или ошибка подключения')
        return
      }
    // Проверяем, существует ли уже пользователь с таким токеном
    const existingUser = users.find(u => u.token === token)
    if (!existingUser) {
      error.value = 'Пользователь не существует'
      return
    }
    if ("expenses" in opName) {
      users.find(u => u === existingUser).expenses = opName.expenses
    }
    if ("incomes" in opName) {
      users.find(u => u === existingUser).incomes = opName.incomes
    }
    if ("budgetLimits" in opName) {
      users.find(u => u === existingUser).budgetLimits = opName.budgetLimits
    }
    if ("savingGoals" in opName) {
      users.find(u => u === existingUser).savingGoals = opName.savingGoals
    }
    if ("budgetControl" in opName) {
      users.find(u => u === existingUser).budgetControl = opName.budgetControl
    }
    

    try {
      // Сохраняем обновленный массив пользователей обратно в testBD.json
      await fetch('http://127.0.0.1:5000/testBD', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      })
    }
    catch (e) {
      console.error('Ошибка обновления бд')
    }
 }

  async function getDataFromBd() {
    const token = localStorage.getItem("token")
    let users
    try {
        const response = await fetch('http://127.0.0.1:5000/testBD')
        if (response.ok) {
          users = await response.json()
        }
      } catch (e) {
        // Если файл не найден или ошибка, начинаем с пустого массива
        console.error('Файл не найден или ошибка подключения')
        return
      }
    // Проверяем, существует ли уже пользователь с таким токеном
    const existingUser = users.find(u => u.token === token)
    if (!existingUser) {
      error.value = 'Пользователь не существует'
      return
    }
    localStorage.setItem("expenses", JSON.stringify(users.find(u => u === existingUser).expenses))

    localStorage.setItem("incomes", JSON.stringify(users.find(u => u === existingUser).incomes))

    localStorage.setItem("budgetLimits", JSON.stringify(users.find(u => u === existingUser).budgetLimits))

    localStorage.setItem("savingGoals", JSON.stringify(users.find(u => u === existingUser).savingGoals))

    localStorage.setItem("budgetControl", JSON.stringify(users.find(u => u === existingUser).budgetControl))
 }

  // Простая функция хеширования пароля (SHA-256)
  async function hashPassword(password) {
    // 1. Создаём TextEncoder для преобразования строки пароля в массив байтов (Uint8Array).
    const encoder = new TextEncoder()
    // 2. Кодируем пароль в байтовый массив.
    const data = encoder.encode(password)
    // 3. Вычисляем хеш от байтового массива с помощью встроенного API Web Crypto (SHA-256).
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    // 4. Преобразуем полученный ArrayBuffer в обычный массив байтов.
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    // 5. Каждый байт переводим в строку в шестнадцатеричном формате и объединяем в одну строку.
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  return {
    // Состояние
    form,
    error,
    loginError,
    passwordError,
    isAuthenticated,
    currentUser,
    
    // Методы
    checkAuthentication,
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
    saveToBd,
    getDataFromBd
  }
} 