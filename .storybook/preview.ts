import type { Preview } from '@storybook/html'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      current: 'dark',
      classTarget: 'html',
      stylePreview: true,
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const { theme } = context.globals
      const htmlClass = theme === 'dark' ? 'dark' : ''
      return {
        template: `
          <html class="${htmlClass}">
            <body>
              <story/>
            </body>
          </html>
        `,
      }
    },
  ],
}

export default preview
