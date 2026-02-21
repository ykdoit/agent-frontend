import { ref, watch } from 'vue'

// 单例模式：确保所有组件共享同一个主题状态
const theme = ref('dark')

/**
 * 主题管理 Composable（单例）
 */
export function useTheme() {
  
  /**
   * 加载主题设置
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      theme.value = savedTheme
      applyTheme(savedTheme)
    } else {
      applyTheme(theme.value)
    }
  }
  
  /**
   * 应用主题到 DOM
   */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t)
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(t)
  }
  
  /**
   * 切换主题
   */
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
  }
  
  /**
   * 设置主题
   */
  function setTheme(newTheme) {
    theme.value = newTheme
    applyTheme(newTheme)
  }
  
  /**
   * 保存主题到 localStorage
   */
  function saveTheme() {
    localStorage.setItem('theme', theme.value)
  }
  
  /**
   * 获取当前主题标签
   */
  function getThemeLabel() {
    return theme.value === 'dark' ? '浅色模式' : '深色模式'
  }
  
  /**
   * 是否为深色主题
   */
  function isDark() {
    return theme.value === 'dark'
  }
  
  // 监听主题变化，自动保存和应用
  watch(theme, (newTheme) => {
    saveTheme()
    applyTheme(newTheme)
  })
  
  return {
    theme,
    loadTheme,
    toggleTheme,
    setTheme,
    getThemeLabel,
    isDark
  }
}
