<script setup lang="ts">
import { ref } from 'vue';
import { fonts, renderPixels, type Font } from 'js-pixel-fonts';
import convertFont from './font/converter';

// reactive state
const text = ref('Hello there!');
const fontSize = ref<number | null>(24);
const pixels = ref<ReturnType<typeof renderPixels> | null>(null);
const activeFontUrl = ref();
const font = ref<Font | null>(null);

async function renderText() {
  const nextFontSize = fontSize.value;

  if (nextFontSize === null || nextFontSize <= 0) {
    return;
  }

  if (activeFontUrl.value) {
    const charsString = Array.from(new Set(text.value)).join('');
    font.value = await convertFont(activeFontUrl.value, {
      fontSize: nextFontSize,
      chars: charsString,
    });
  }

  pixels.value = renderPixels(text.value, font.value ?? fonts.sevenPlus);
}

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
    <div class="w-50">
      <n-input v-model:value="text" type="text" placeholder="Enter pixel text" />

      <n-input-number v-if="activeFontUrl" v-model:value="fontSize" clearable placeholder="Font size" />

      <n-upload :show-file-list="false" :custom-request="handleFontUpload" accept=".ttf">
        <n-button>Upload Font</n-button>
      </n-upload>
      <n-button @click="renderText"> Render </n-button>
    </div>

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
