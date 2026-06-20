<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { renderPixels, type Font } from 'js-pixel-fonts';
import convertFont from './font/converter';
import fontUrl from './assets/fonts/BlackOpsOne-Regular.ttf?url';

// reactive state
const text = ref('Hello there!');
const fontSize = ref<number | null>(24);
const pixels = ref<ReturnType<typeof renderPixels> | null>(null);
const activeFontUrl = ref(fontUrl);
const chars = ref<Set<string>>(new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?., '));

// font handling
const font = ref<Font | null>(null);

watch(
  [activeFontUrl, fontSize, text],
  async ([nextFontUrl, nextFontSize]) => {
    if (nextFontSize === null || nextFontSize <= 0) {
      return;
    }
    for (const char of text.value) {
      chars.value.add(char);
    }
    font.value = await convertFont(nextFontUrl, {
      fontSize: nextFontSize,
      chars: Array.from(chars.value).join(''),
    });
  },
  { immediate: true },
);

// recompute pixels whenever text or font changes
watchEffect(() => {
  if (!font.value) return;
  pixels.value = renderPixels(text.value, font.value);
});

// handle font upload
async function handleFontUpload(options: { file?: { file: File } }) {
  const rawFile = options.file?.file as File | undefined;

  if (!rawFile) {
    console.error('No valid file found in upload payload:', options);
    return;
  }

  activeFontUrl.value = URL.createObjectURL(rawFile);
}
</script>

<template>
  <div class="space-y-4">
    <!-- TEXT INPUT -->
    <n-input v-model:value="text" type="text" placeholder="Enter pixel text" />

    <n-input-number v-model:value="fontSize" clearable placeholder="Font size" />

    <!-- FONT UPLOAD -->
    <n-upload :show-file-list="false" :custom-request="handleFontUpload" accept=".ttf">
      <n-button>Upload Font</n-button>
    </n-upload>

    <!-- PIXEL OUTPUT -->
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
