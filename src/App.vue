<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fonts, renderPixels, type Font } from 'js-pixel-fonts';
import convertFont from './font/converter';

const MIN_ZOOM = 1;
const MAX_ZOOM = 50;

function useDragScroll() {
  const el = ref<HTMLElement | null>(null);
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let scrollTop = 0;

  function onMouseDown(e: MouseEvent) {
    if (!el.value) return;
    dragging = true;
    startX = e.pageX - el.value.offsetLeft;
    startY = e.pageY - el.value.offsetTop;
    scrollLeft = el.value.scrollLeft;
    scrollTop = el.value.scrollTop;
    el.value.style.cursor = 'grabbing';
    el.value.style.userSelect = 'none';
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging || !el.value) return;
    e.preventDefault();
    const x = e.pageX - el.value.offsetLeft;
    const y = e.pageY - el.value.offsetTop;
    el.value.scrollLeft = scrollLeft - (x - startX);
    el.value.scrollTop = scrollTop - (y - startY);
  }

  function onMouseUp() {
    dragging = false;
    if (!el.value) return;
    el.value.style.cursor = 'grab';
    el.value.style.userSelect = '';
  }

  return { el, onMouseDown, onMouseMove, onMouseUp };
}

const { el: pixelStageEl, onMouseDown, onMouseMove, onMouseUp } = useDragScroll();

function onWheelZoom(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -1 : 1;
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value + delta));
}

// reactive state
const text = ref('Hello there!');
const fontSize = ref<number | null>(24);
const zoom = ref((MIN_ZOOM + MAX_ZOOM) / 2);
const pixels = ref<ReturnType<typeof renderPixels> | null>(null);
const activeFontUrl = ref<string | null>(null);
const activeFontName = ref('Seven Plus');
const font = ref<Font | null>(null);

function inferFontName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const normalizedName = baseName
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  if (!normalizedName) {
    return 'Custom Font';
  }

  return normalizedName.replace(/\b\w/g, (char) => char.toUpperCase());
}

async function renderText() {
  const nextFontSize = fontSize.value;

  if (nextFontSize === null || nextFontSize <= 0) {
    return;
  }

  if (activeFontUrl.value) {
    const charsString = Array.from(new Set(text.value)).join('');
    font.value = await convertFont(activeFontUrl.value, {
      fontName: activeFontName.value,
      fontSize: nextFontSize,
      chars: charsString,
    });
  }

  pixels.value = renderPixels(text.value, font.value ?? fonts.sevenPlus);
}

onMounted(() => {
  void renderText();
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
  activeFontName.value = inferFontName(rawFile.name);
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6"
    style="
      background:
        radial-gradient(circle at 20% 15%, peachpuff 0%, transparent 44%),
        radial-gradient(circle at 85% 20%, lightskyblue 0%, transparent 35%),
        linear-gradient(135deg, floralwhite, aliceblue 55%, mistyrose);
    "
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-25"
      style="background-image: radial-gradient(lightgray 0.7px, transparent 0.7px); background-size: 6px 6px"
    />

    <main class="relative z-10 mx-auto flex w-full max-w-none flex-col gap-4">
      <section class="w-full rounded-[18px] border border-slate-700/15 bg-white/85 p-5 shadow-xl backdrop-blur">
        <p class="m-0 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-600">Text to Pixel Art</p>
        <h1 class="mt-1 text-[clamp(1.7rem,2.8vw,2.3rem)] leading-[1.1] font-bold text-slate-900">
          Generate pixel art from your favorite fonts
        </h1>

        <div class="mt-4 grid gap-3">
          <p class="mb-1 text-[0.8rem] font-bold text-slate-700">Text</p>
          <n-input v-model:value="text" type="text" placeholder="Enter pixel text" />

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-[10px] border border-slate-700/15 bg-white/70 px-3 py-3">
              <p class="mb-1 text-[0.8rem] font-bold text-slate-700">Font Upload</p>
              <n-upload :show-file-list="false" :custom-request="handleFontUpload" accept=".ttf">
                <n-button secondary class="w-full">Upload Font</n-button>
              </n-upload>
              <p class="mt-2 text-[0.78rem] text-slate-500">
                {{ activeFontUrl ? activeFontName : 'Using Seven Plus' }}
              </p>
            </div>

            <div class="rounded-[10px] border border-slate-700/15 bg-white/70 px-3 py-3">
              <p class="mb-1 text-[0.8rem] font-bold text-slate-700">Font Size</p>
              <n-input-number :disabled="!activeFontUrl" v-model:value="fontSize" clearable placeholder="Font size" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <n-button type="primary" @click="renderText">Render</n-button>
          </div>
        </div>
      </section>

      <section
        class="grid w-full gap-3 rounded-[18px] border border-slate-700/15 bg-white/85 p-5 shadow-xl backdrop-blur"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="m-0 text-base font-semibold text-slate-800">Pixel Output</h2>
        </div>

        <div class="rounded-[10px] border border-slate-700/15 bg-white/70 px-3 py-3">
          <p class="mb-1 text-[0.8rem] font-bold text-slate-700">Zoom: {{ zoom }}</p>
          <n-slider v-model:value="zoom" :min="MIN_ZOOM" :max="MAX_ZOOM" :step="1" />
        </div>

        <div
          v-if="pixels"
          ref="pixelStageEl"
          class="w-full max-h-96 cursor-grab select-none overflow-auto rounded-[10px] border border-slate-700/15 bg-white/80 p-3"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @wheel.prevent="onWheelZoom"
        >
          <!-- top column counter -->
          <div v-show="zoom >= 16" class="flex items-center">
            <span class="w-10 shrink-0" />
            <div
              v-for="(_, x) in pixels[0]"
              :key="x"
              class="shrink-0 overflow-hidden text-center text-[0.6rem] font-medium text-slate-400"
              :style="{ width: `${zoom}px` }"
            >
              {{ x + 1 }}
            </div>
            <span class="w-10 shrink-0" />
          </div>

          <!-- pixel rows with row counter on both sides -->
          <div v-for="(row, y) in pixels" :key="y" class="flex items-center">
            <span v-show="zoom >= 16" class="w-10 shrink-0 text-right text-xs font-medium text-slate-500">{{
              y + 1
            }}</span>
            <div
              v-for="(p, x) in row"
              :key="x"
              class="shrink-0 border"
              :style="{
                width: `${zoom}px`,
                height: `${zoom}px`,
                backgroundColor: p ? 'black' : 'transparent',
                borderColor: p ? 'gainsboro' : 'lightgray',
              }"
            />
            <span v-show="zoom >= 16" class="w-10 shrink-0 pl-2 text-left text-xs font-medium text-slate-500">{{
              y + 1
            }}</span>
          </div>

          <!-- bottom column counter -->
          <div v-show="zoom >= 16" class="flex items-center">
            <span class="w-10 shrink-0" />
            <div
              v-for="(_, x) in pixels[0]"
              :key="x"
              class="shrink-0 overflow-hidden text-center text-[0.6rem] font-medium text-slate-400"
              :style="{ width: `${zoom}px` }"
            >
              {{ x + 1 }}
            </div>
            <span class="w-10 shrink-0" />
          </div>
        </div>

        <div
          v-else
          class="rounded-[10px] border border-dashed border-slate-700/30 bg-white/70 px-4 py-5 text-center text-slate-600"
        >
          Click Render to generate output.
        </div>
      </section>
    </main>
  </div>
</template>
