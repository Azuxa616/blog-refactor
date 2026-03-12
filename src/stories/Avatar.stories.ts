export default {
  title: 'Components/Avatar',
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    width: { control: 'number', min: 32, max: 256, step: 8 },
    height: { control: 'number', min: 32, max: 256, step: 8 },
    alt: { control: 'text' },
  },
}

export const Default = {
  args: {
    src: '',
    width: 100,
    height: 100,
    alt: 'avatar',
  },
  render: (args: { src: string; width: number; height: number; alt: string }) => `
    <div>
      ${args.src 
        ? `<img src="${args.src}" alt="${args.alt}" width="${args.width}" height="${args.height}" class="rounded-full" />`
        : `<div class="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600" style="width: ${args.width}px; height: ${args.height}px;">
             <span class="text-white font-bold" style="font-size: ${args.width * 0.4}px">A</span>
           </div>`
      }
    </div>
  `,
}

export const Small = {
  args: {
    src: '',
    width: 48,
    height: 48,
    alt: 'avatar',
  },
}

export const Medium = {
  args: {
    src: '',
    width: 100,
    height: 100,
    alt: 'avatar',
  },
}

export const Large = {
  args: {
    src: '',
    width: 150,
    height: 150,
    alt: 'avatar',
  },
}

export const ExtraLarge = {
  args: {
    src: '',
    width: 200,
    height: 200,
    alt: 'avatar',
  },
}

export const WithGradient = {
  args: {
    src: '',
    width: 120,
    height: 120,
    alt: 'avatar',
  },
  render: (args: { src: string; width: number; height: number; alt: string }) => `
    <div class="flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500" style="width: ${args.width}px; height: ${args.height}px;">
      <span class="text-white font-bold" style="font-size: ${args.width * 0.4}px">U</span>
    </div>
  `,
}
