<script setup lang="ts">
import { useId } from 'vue'

// 使用 Vue 3.4+ 的 defineModel 语法处理 v-model
const model = defineModel<boolean>({ default: false })

interface Props {
  /** 提示标签文本 */
  label?: string
  /** 描述信息文本 */
  description?: string
  /** 是否禁用开关 */
  disabled?: boolean
  /** 自定义 id（不传将自动生成） */
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// 生成唯一的控件 ID，用于关联 label 和 input
const inputId = props.id || useId()
</script>

<template>
  <div class="inline-flex items-center justify-between gap-x-4">
    <!-- 文本标签与描述（可选） -->
    <div v-if="label || description" class="flex flex-col text-sm">
      <label
        :for="inputId"
        class="font-medium text-gray-900 dark:text-gray-100 select-none cursor-pointer"
        :class="{ 'cursor-not-allowed opacity-50': disabled }"
      >
        {{ label }}
      </label>
      <span
        v-if="description"
        class="text-gray-500 dark:text-gray-400 select-none"
        :class="{ 'opacity-50': disabled }"
      >
        {{ description }}
      </span>
    </div>

    <!-- Toggle 开关主体 -->
    <label
      :for="inputId"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-within:outline-none"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    >
      <!-- 原生 Checkbox 输入框 (隐藏但保持无障碍支持) -->
      <input
        :id="inputId"
        type="checkbox"
        v-model="model"
        :disabled="disabled"
        class="peer sr-only"
      />

      <!-- 开关轨道背景 (Track) -->
      <span
        class="pointer-events-none absolute inset-0 rounded-full bg-gray-200 transition-colors duration-200 ease-in-out dark:bg-gray-700 peer-checked:bg-indigo-600 peer-checked:dark:bg-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-600 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900"
      ></span>

      <!-- 开关滑块 (Thumb) -->
      <span
        class="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out translate-x-0 peer-checked:translate-x-5 dark:bg-gray-100"
      ></span>
    </label>
  </div>
</template>