<template>
  <div class="date-picker">
    <div class="date-picker-header">
      <button class="nav-btn" @click="prevMonth">&lt;</button>
      <span class="month-title">{{ year }}年{{ month }}月</span>
      <button class="nav-btn" @click="nextMonth">&gt;</button>
    </div>
    <div class="weekdays">
      <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
    </div>
    <div class="days">
      <button
        v-for="(day, index) in days"
        :key="index"
        :class="[
          'day-btn',
          {
            'other-month': day.otherMonth,
            'today': day.isToday,
            'selected': day.date === selectedDate,
            'disabled': day.disabled,
            'in-range': day.inRange
          }
        ]"
        :disabled="day.disabled || day.otherMonth"
        @click="selectDate(day)"
      >
        {{ day.day }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  minDate: {
    type: String,
    default: ''
  },
  maxDate: {
    type: String,
    default: ''
  },
  selectedDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 计算日历天数
const days = computed(() => {
  const daysArray = []
  const firstDay = new Date(year.value, month.value - 1, 1)
  const lastDay = new Date(year.value, month.value, 0)
  
  // 获取当月第一天是星期几（0-6，需要转换为1-7）
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6
  
  // 填充上月末尾天数
  const prevMonthLastDay = new Date(year.value, month.value - 1, 0)
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i
    const date = formatDate(new Date(year.value, month.value - 2, day))
    daysArray.push({
      day,
      date,
      otherMonth: true,
      disabled: isDisabled(date),
      inRange: isInRange(date)
    })
  }
  
  // 填充当月天数
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = formatDate(new Date(year.value, month.value - 1, i))
    daysArray.push({
      day: i,
      date,
      otherMonth: false,
      isToday: date === formatDate(today),
      disabled: isDisabled(date),
      inRange: isInRange(date)
    })
  }
  
  // 填充下月开头天数
  const remainingDays = 42 - daysArray.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = formatDate(new Date(year.value, month.value, i))
    daysArray.push({
      day: i,
      date,
      otherMonth: true,
      disabled: isDisabled(date),
      inRange: isInRange(date)
    })
  }
  
  return daysArray
})

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekdayName(date) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

function isDisabled(date) {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  // 禁止过去的日期
  if (date < formatDate(today)) return true
  return false
}

function isInRange(date) {
  if (!props.minDate || !props.maxDate) return false
  return date >= props.minDate && date <= props.maxDate
}

function prevMonth() {
  if (month.value === 1) {
    month.value = 12
    year.value--
  } else {
    month.value--
  }
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1
    year.value++
  } else {
    month.value++
  }
}

function selectDate(day) {
  if (day.disabled || day.otherMonth) return
  emit('select', day.date)
}
</script>

<style scoped>
.date-picker {
  background: var(--bg-secondary, #1e1e1e);
  border: 1px solid var(--border-color, #2d2d2d);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  max-width: 320px;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #e3e3e3);
}

.nav-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-tertiary, #2d2d2d);
  color: var(--text-muted, #8e8e8e);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--bg-hover, #3d3d3d);
  color: var(--text-primary, #e3e3e3);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted, #8e8e8e);
  padding: 4px 0;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-primary, #e3e3e3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.day-btn:hover:not(:disabled) {
  background: var(--bg-hover, #3d3d3d);
}

.day-btn.other-month {
  color: var(--text-muted, #8e8e8e);
  opacity: 0.4;
}

.day-btn.today {
  border: 1px solid var(--primary-color, #4285f4);
  color: var(--primary-color, #4285f4);
}

.day-btn.selected {
  background: var(--primary-color, #4285f4);
  color: white;
}

.day-btn.disabled {
  color: var(--text-muted, #8e8e8e);
  opacity: 0.3;
  cursor: not-allowed;
}

.day-btn.in-range:not(.selected):not(.other-month) {
  background: rgba(66, 133, 244, 0.1);
}
</style>
