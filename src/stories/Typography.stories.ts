export default {
  title: 'Example/Typography',
  tags: ['autodocs'],
}

export const Heading = {
  render: () => `
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Heading 1</h1>
    <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Heading 2</h2>
    <h3 class="text-2xl font-medium text-gray-900 dark:text-white mb-4">Heading 3</h3>
    <p class="text-base text-gray-700 dark:text-gray-300 mb-4">This is a paragraph of text. It contains normal text content for display purposes.</p>
    <p class="text-sm text-gray-500 dark:text-gray-400">This is small text.</p>
  `,
}

export const TextColors = {
  render: () => `
    <p class="text-gray-900 dark:text-white">Gray 900</p>
    <p class="text-gray-700 dark:text-gray-200">Gray 700</p>
    <p class="text-gray-500 dark:text-gray-400">Gray 500</p>
    <p class="text-gray-300 dark:text-gray-600">Gray 300</p>
  `,
}

export const TextSizes = {
  render: () => `
    <p class="text-xs">Extra Small Text</p>
    <p class="text-sm">Small Text</p>
    <p class="text-base">Base Text</p>
    <p class="text-lg">Large Text</p>
    <p class="text-xl">Extra Large Text</p>
    <p class="text-2xl font-bold">Very Large Bold Text</p>
  `,
}
