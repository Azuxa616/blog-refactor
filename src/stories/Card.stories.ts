export default {
  title: 'Components/Card',
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    padding: {
      control: 'select',
      options: ['p-4', 'p-6', 'p-8', 'p-12'],
    },
    children: { control: 'text' },
  },
}

export const Default = {
  args: {
    className: '',
    padding: 'p-8',
    children: `
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Card Title</h3>
      <p class="text-gray-600 dark:text-gray-400">This is a card component with padding.</p>
    `,
  },
  render: (args: { className: string; padding: string; children: string }) => `
    <div class="relative flex bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl ${args.padding} hover:shadow-2xl transition-all duration-300 ${args.className}">
      ${args.children}
    </div>
  `,
}

export const SmallPadding = {
  args: {
    className: '',
    padding: 'p-4',
    children: `
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Small Padding</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">Card with small padding.</p>
    `,
  },
}

export const LargePadding = {
  args: {
    className: '',
    padding: 'p-12',
    children: `
      <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Large Padding</h3>
      <p class="text-lg text-gray-600 dark:text-gray-400">Card with large padding for more spacious content.</p>
    `,
  },
}

export const WithImage = {
  args: {
    className: '',
    padding: 'p-0',
    children: `
      <div class="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl"></div>
      <div class="p-8">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Card with Image</h3>
        <p class="text-gray-600 dark:text-gray-400">This card has an image at the top with rounded corners.</p>
      </div>
    `,
  },
}

export const WithActions = {
  args: {
    className: '',
    padding: 'p-8',
    children: `
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Card with Actions</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">This card includes action buttons at the bottom.</p>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Primary</button>
        <button class="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors">Secondary</button>
      </div>
    `,
  },
}
