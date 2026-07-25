# Article Image Zoom Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a local Alpine.js lightbox that opens, zooms, and pans Markdown images inside article .prose content.

**Architecture:** A rehype plugin marks every Markdown image during the MDX pipeline. The article route dispatches a browser event only for marked images, and ImageLightbox.astro owns the Alpine state, dialog lifecycle, body-scroll lock, and input handling. Styling remains in an isolated component stylesheet.

**Tech Stack:** Astro 6 SSR, MDX rehype pipeline, Alpine.js 3, TypeScript, CSS, pnpm.

## Global Constraints

- Only images rendered inside article .prose content are interactive. ArticleCoverImage remains unchanged.
- Do not add runtime or test dependencies, React code, or a global Alpine registration.
- Preserve source conventions: single quotes, no semicolons, type-only imports, Chinese comments only where useful.
- Preserve existing image class names while appending zoomable-img and data-zoomable.
- Support mouse-wheel zoom, pointer pan, touch pinch, double-click 1x/2.5x, Escape, backdrop click, and close-button dismissal.
- Clamp zoom to [1, 5] and restore the exact previous document.body.style.overflow value on close.
- No automated test runner exists. Do not add one: verify with pnpm astro check, pnpm lint, pnpm build, and browser acceptance at /articles/example-post-with-images.

---

## File Structure

| File | Responsibility |
| --- | --- |
| src/lib/rehype/rehype-image-zoom.ts | Mark HAST image nodes for the route selector and lightbox styling. |
| astro.config.mjs | Register the image marker before HTML minification. |
| src/components/content/ImageLightbox.astro | Define a local Alpine dialog and all zoom/pan lifecycle methods. |
| src/styles/components/image-lightbox.css | Own overlay, containment, transform, and cursor styles. |
| src/styles/global.css | Import the new component stylesheet. |
| src/pages/articles/[slug].astro | Mount one lightbox and dispatch the open event for .prose images only. |

### Task 1: Mark Markdown Images During Rehype Processing

**Files:**
- Create: src/lib/rehype/rehype-image-zoom.ts
- Modify: astro.config.mjs

**Interfaces:**
- Consumes: HAST Root supplied by MDX rehypePlugins.
- Produces: each img has properties.dataZoomable === true and a zoomable-img class.

- [ ] **Step 1: Add the plugin import and registration**

Add this import beside the existing local rehype imports in astro.config.mjs:

~~~
import rehypeImageZoom from './src/lib/rehype/rehype-image-zoom.ts'
~~~

Add rehypeImageZoom after rehypeCodeHeader and before rehypeKatex in the existing rehypePlugins array.

- [ ] **Step 2: Prove the missing implementation fails validation**

Run: pnpm astro check

Expected: FAIL with a module-resolution error for src/lib/rehype/rehype-image-zoom.ts.

- [ ] **Step 3: Implement the marker plugin**

Create src/lib/rehype/rehype-image-zoom.ts:

~~~ts
import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

export default function rehypeImageZoom() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return

      const properties = node.properties || {}
      const existingClassNames = properties.className
      const classNames = Array.isArray(existingClassNames)
        ? existingClassNames.map(String)
        : typeof existingClassNames === 'string'
          ? existingClassNames.split(' ')
          : []

      node.properties = {
        ...properties,
        dataZoomable: true,
        className: [...new Set([...classNames, 'zoomable-img'])],
      }
    })
  }
}
~~~

The plugin mutates image nodes only and leaves src, alt, dimensions, and existing classes intact.

- [ ] **Step 4: Verify the pipeline output**

Run: pnpm astro check
Expected: PASS.

Run: pnpm build
Expected: PASS.

Start pnpm dev and inspect an image within .prose on /articles/example-post-with-images.
Expected: it has data-zoomable="true" and zoomable-img; ArticleCoverImage has neither.

- [ ] **Step 5: Commit**

~~~bash
git add astro.config.mjs src/lib/rehype/rehype-image-zoom.ts
git commit -m "feat: 标记文章可放大图片"
~~~

### Task 2: Build the Local Alpine Lightbox and Styles

**Files:**
- Create: src/components/content/ImageLightbox.astro
- Create: src/styles/components/image-lightbox.css
- Modify: src/styles/global.css

**Interfaces:**
- Consumes: a window event named image-lightbox:open with detail { src: string, alt: string }.
- Produces: a local Alpine component named imageLightbox, containing open, src, alt, scale, x, and y state.

- [ ] **Step 1: Create the component shell and verify its static syntax**

Create src/components/content/ImageLightbox.astro:

~~~astro
---
---

<div x-data="imageLightbox"></div>
~~~

Run: pnpm astro check
Expected: PASS. The shell is valid Astro, but browser interaction must not yet open a dialog.

- [ ] **Step 2: Replace the shell with the Alpine component and dialog**

Use one component-local inline script that waits for alpine:init and registers Alpine.data('imageLightbox', () => state). Define all state fields before use:

~~~js
{
  open: false,
  src: '',
  alt: '',
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseX: 0,
  baseY: 0,
  pinchDistance: 0,
  previousBodyOverflow: '',
  handleOpen: null,
}
~~~

Add init, destroy, openImage, close, resetTransform, restoreScroll, clampScale, zoomByWheel, startDrag, moveDrag, endDrag, startPinch, movePinch, endPinch, toggleZoom, and handleImageError methods with these exact semantics:

- init assigns handleOpen to an event listener that calls openImage(event.detail); destroy removes it and restores scrolling.
- openImage resets the transform, records src and alt, opens the dialog, saves document.body.style.overflow, then sets overflow to hidden.
- close clears src and alt, resets transforms, closes the dialog, and restores the saved overflow.
- clampScale returns Math.min(5, Math.max(1, value)); any transition to 1 resets x and y to zero.
- clampPan(x, y, image) returns an object whose x/y are constrained to plus or minus (image.offsetWidth * (scale - 1)) / 2 and plus or minus (image.offsetHeight * (scale - 1)) / 2 respectively.
- zoomByWheel applies a 0.15 increment for an upward wheel and -0.15 otherwise. Calculate originX/Y from the pointer position relative to the transformed image centre, calculate ratio as nextScale / previousScale, then use x + (1 - ratio) * originX and y + (1 - ratio) * originY before passing the result through clampPan. This preserves the pixel beneath the pointer as the zoom anchor.
- startDrag uses currentTarget.setPointerCapture(event.pointerId), and moveDrag updates x/y only while scale > 1 using the recorded pointer start and base coordinates, then passes the candidate position through clampPan.
- startPinch records Euclidean touch distance only for exactly two touches; movePinch changes scale by currentDistance / pinchDistance; endPinch clears pinchDistance when fewer than two touches remain.
- toggleZoom switches scale between 1 and 2.5 and resets x/y.
- handleImageError logs console.error('图片预览加载失败:', this.src) and then calls close.

Render the complete accessible dialog with this handler contract:

~~~astro
<div
  x-data="imageLightbox"
  x-show="open"
  x-cloak
  x-transition.opacity
  class="image-lightbox"
  role="dialog"
  aria-modal="true"
  aria-label="图片预览"
  @click.self="close()"
  @keydown.escape.window="close()"
>
  <button class="image-lightbox__close" type="button" aria-label="关闭图片预览" @click="close()">
    <img src="/svgs/close.svg" width="24" height="24" alt="" />
  </button>
  <div class="image-lightbox__viewport">
    <img
      class="image-lightbox__image"
      :class="{ 'is-dragging': dragging, 'is-zoomed': scale > 1 }"
      :src="src"
      :alt="alt"
      :style="'--lightbox-x: ' + x + 'px; --lightbox-y: ' + y + 'px; --lightbox-scale: ' + scale"
      @wheel.prevent="zoomByWheel($event)"
      @pointerdown="startDrag($event)"
      @pointermove="moveDrag($event)"
      @pointerup="endDrag($event)"
      @pointercancel="endDrag($event)"
      @dblclick="toggleZoom()"
      @touchstart="startPinch($event)"
      @touchmove.prevent="movePinch($event)"
      @touchend="endPinch($event)"
      @error="handleImageError()"
    />
  </div>
</div>
~~~

Bind the computed translate and scale as CSS custom properties on the image using Alpine :style. The component must not query .prose or know about article markup.

- [ ] **Step 3: Add focused styles and import them**

Create src/styles/components/image-lightbox.css:

~~~css
.zoomable-img {
  cursor: zoom-in;
}

.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: rgb(0 0 0 / 80%);
  backdrop-filter: blur(4px);
}

.image-lightbox__viewport {
  display: grid;
  max-width: 90vw;
  max-height: 90vh;
  place-items: center;
  overflow: hidden;
}

.image-lightbox__image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  cursor: zoom-out;
  transform: translate(var(--lightbox-x), var(--lightbox-y)) scale(var(--lightbox-scale));
  transition: transform 0.2s ease;
  touch-action: none;
  user-select: none;
}

.image-lightbox__image.is-zoomed {
  cursor: grab;
}

.image-lightbox__image.is-dragging {
  cursor: grabbing;
  transition: none;
}

.image-lightbox__close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 0.375rem;
  background: rgb(0 0 0 / 45%);
}

.image-lightbox__close:hover {
  background: rgb(0 0 0 / 70%);
}
~~~

Append this import after the existing component stylesheet imports in src/styles/global.css:

~~~css
@import './components/image-lightbox.css';
~~~

- [ ] **Step 4: Verify component behavior independently**

Run: pnpm astro check
Expected: PASS.

Run: pnpm lint
Expected: PASS.

On an article route, run this browser-console probe:

~~~js
window.dispatchEvent(
  new CustomEvent('image-lightbox:open', {
    detail: { src: '/imgs/blog-logo.png', alt: '验证图片' },
  }),
)
~~~

Expected: one dialog opens, body scrolling locks, and Escape closes it and restores the former overflow string.

- [ ] **Step 5: Commit**

~~~bash
git add src/components/content/ImageLightbox.astro src/styles/components/image-lightbox.css src/styles/global.css
git commit -m "feat: 添加文章图片预览灯箱"
~~~

### Task 3: Connect the Article Route and Perform Acceptance

**Files:**
- Modify: src/pages/articles/[slug].astro

**Interfaces:**
- Consumes: ImageLightbox, .prose [data-zoomable], and image-lightbox:open { src, alt }.
- Produces: only a marked article-body image opens the local dialog.

- [ ] **Step 1: Mount the component once**

Add this import with the existing content component imports:

~~~astro
import ImageLightbox from '@/components/content/ImageLightbox.astro'
~~~

Mount <ImageLightbox /> once in the article, immediately before the existing inline script. Do not modify ArticleCoverImage.

- [ ] **Step 2: Add the route-local click binding**

At the beginning of the existing DOMContentLoaded callback, insert:

~~~js
const zoomableImages = document.querySelectorAll('.prose [data-zoomable]')

zoomableImages.forEach(image => {
  image.addEventListener('click', () => {
    const src = image.getAttribute('src')
    if (!src) return

    window.dispatchEvent(
      new CustomEvent('image-lightbox:open', {
        detail: {
          src,
          alt: image.getAttribute('alt') || '',
        },
      }),
    )
  })
})
~~~

Keep the existing code-copy listener unchanged. Do not use a broad img selector.

- [ ] **Step 3: Run static and build validation**

Run: pnpm astro check
Expected: PASS.

Run: pnpm lint
Expected: PASS.

Run: pnpm build
Expected: PASS; data-zoomable survives rehypePresetMinify.

- [ ] **Step 4: Run desktop and mobile browser acceptance**

Run: pnpm dev

At http://localhost:4321/articles/example-post-with-images verify:

1. A .prose image gets zoom-in cursor; the article cover does not.
2. Clicking that image opens the dialog with its original source and alt text.
3. Wheel zoom remains between 1x and 5x.
4. Pointer drag moves a zoomed image only; cursor changes grab to grabbing while dragging.
5. Double-click switches between 1x and 2.5x and resets pan.
6. Backdrop click, close button, and Escape each close the dialog and restore scrolling.
7. In a mobile viewport, two-finger pinch changes zoom and one-finger drag pans after zooming.
8. In dark mode, the overlay and close control are visible.

Capture a screenshot for any failed check. Correct only the failed feature behavior, then rerun this task's validation.

- [ ] **Step 5: Commit**

~~~bash
git add src/pages/articles/[slug].astro
git commit -m "feat: 启用文章图片点击放大预览"
~~~

### Task 4: Final Regression Check

**Files:**
- Modify: none unless a verified feature defect is found.

**Interfaces:**
- Consumes: all completed feature tasks.
- Produces: regression evidence for image preview and the existing code-copy behavior.

- [ ] **Step 1: Run complete static verification**

Run: pnpm astro check
Expected: PASS.

Run: pnpm lint
Expected: PASS.

Run: pnpm build
Expected: PASS.

- [ ] **Step 2: Verify code-copy stays independent**

On /articles/example-post-with-images, click a .code-copy-btn in a rendered code block.

Expected: the existing copied feedback appears and no lightbox opens.

- [ ] **Step 3: Check final repository state**

Run: git diff --check
Expected: no whitespace errors.

Run: git status --short
Expected: no uncommitted feature files. If a correction was required in this task, stage only that correction and commit it with a message describing the correction.
