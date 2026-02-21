import { ref } from 'vue'

/**
 * 工作流解析工具
 * 用于解析 AI 返回的内容，提取交互组件数据
 */

/**
 * 解析流式内容，提取交互组件
 * @param {string} content - 原始消息内容
 * @returns {Object} 解析结果 { confirmationCard, timePicker, displayContent }
 */
export function parseStreamContent(content) {
  if (!content) {
    return { confirmationCard: null, timePicker: null, displayContent: '' }
  }

  let confirmationCard = null
  let timePicker = null
  let displayContent = content

  // 解析确认卡片格式：[CONFIRM_CARD]...[/CONFIRM_CARD]
  const confirmMatch = content.match(/\[CONFIRM_CARD\]([\s\S]*?)\[\/CONFIRM_CARD\]/)
  if (confirmMatch) {
    try {
      confirmationCard = JSON.parse(confirmMatch[1])
      displayContent = displayContent.replace(confirmMatch[0], '').trim()
    } catch (e) {
      console.warn('解析确认卡片失败:', e)
    }
  }

  // 解析时间选择器格式：[TIME_PICKER]...[/TIME_PICKER]
  const timeMatch = content.match(/\[TIME_PICKER\]([\s\S]*?)\[\/TIME_PICKER\]/)
  if (timeMatch) {
    try {
      timePicker = JSON.parse(timeMatch[1])
      displayContent = displayContent.replace(timeMatch[0], '').trim()
    } catch (e) {
      console.warn('解析时间选择器失败:', e)
    }
  }

  // 解析 JSON 格式的确认卡片
  const jsonConfirmMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonConfirmMatch) {
    try {
      const parsed = JSON.parse(jsonConfirmMatch[1])
      if (parsed.type === 'confirmation_card' || parsed.title || parsed.items) {
        confirmationCard = parsed
        displayContent = displayContent.replace(jsonConfirmMatch[0], '').trim()
      }
    } catch (e) {
      // 不是有效的 JSON，保持原样
    }
  }

  return {
    confirmationCard,
    timePicker,
    displayContent
  }
}

/**
 * 工作流状态管理
 */
export function useWorkflow() {
  const stages = ref([])
  const currentStage = ref('')
  const progress = ref(0)

  function setStages(newStages) {
    stages.value = newStages
  }

  function setStage(stageId) {
    currentStage.value = stageId
    const index = stages.value.findIndex(s => s.id === stageId)
    if (index >= 0) {
      progress.value = Math.round(((index + 1) / stages.value.length) * 100)
    }
  }

  function reset() {
    stages.value = []
    currentStage.value = ''
    progress.value = 0
  }

  return {
    stages,
    currentStage,
    progress,
    setStages,
    setStage,
    reset
  }
}
