<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { fonts, renderPixels, type Font } from 'js-pixel-fonts';
import convertFont from './font/converter';

// reactive state
const text = ref('Hello there!');
const fontSize = ref<number | null>(24);
const pixels = ref<ReturnType<typeof renderPixels> | null>(null);
const activeFontUrl = ref();
const chars = ref<Set<string>>(new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?., '));
const font = ref<Font | null>(null);
let convertRequestId = 0;
let lastConvertedKey = '';
watch(
  [activeFontUrl, fontSize, text],
  async ([nextFontUrl, nextFontSize, nextText]) => {
    if (nextFontSize === null || nextFontSize <= 0 || !activeFontUrl.value) return;
    for (const char of nextText) {
      chars.value.add(char);
    }
    const charsString = Array.from(chars.value).join('');
    const key = `${nextFontUrl}|${nextFontSize}|${charsString}`;

    if (key === lastConvertedKey) return;
    const requestId = ++convertRequestId;
    const nextFont = await convertFont(nextFontUrl, {
      fontSize: nextFontSize,
      chars: charsString,
    });

    if (requestId !== convertRequestId) return;
    lastConvertedKey = key;
    font.value = nextFont;
  },
  { immediate: true },
);

watchEffect(() => {
  pixels.value = renderPixels(text.value, font.value ?? fonts.sevenPlus);
});

let uploadedFontObjectUrl: string | null = null;

async function handleFontUpload(options: { file?: { file: File } }) {
  const rawFile = options.file?.file as File | undefined;

  if (!rawFile) {
    console.error('No valid file found in upload payload:', options);
    return;
  }

  if (uploadedFontObjectUrl) {
    URL.revokeObjectURL(uploadedFontObjectUrl);
  }
  uploadedFontObjectUrl = URL.createObjectURL(rawFile);
  activeFontUrl.value = uploadedFontObjectUrl;
}
</script>

<template>
  <div class="space-y-4">
    <n-input v-model:value="text" type="text" placeholder="Enter pixel text" />

    <n-input-number v-if="font" v-model:value="fontSize" clearable placeholder="Font size" />

    <n-upload :show-file-list="false" :custom-request="handleFontUpload" accept=".ttf">
      <n-button>Upload Font</n-button>
    </n-upload>

    <div v-if="pixels" class="inline-block">
      <div v-for="(row, y) in pixels" :key="y" class="flex">
        <div
          v-for="(p, x) in row"
          :key="x"
          class="w-5 h-5 border border-gray-300"
          :style="{ backgroundColor: p ? '#000' : 'transparent' }"
        />
      </div>
    </div>
  </div>
</template>
