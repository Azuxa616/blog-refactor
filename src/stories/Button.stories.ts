export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
  },
}

export const Primary = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
  },
  render: (args: { label: string; variant: string; size: string; disabled: boolean }) => {
    const baseClasses = 'rounded-lg font-semibold transition-all duration-200 cursor-pointer'
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
      ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 disabled:text-gray-400',
    }
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    }
    
    return `
      <button 
        class="${baseClasses} ${variantClasses[args.variant as keyof typeof variantClasses]} ${sizeClasses[args.size as keyof typeof sizeClasses]}"
        ${args.disabled ? 'disabled' : ''}
      >
        ${args.label}
      </button>
    `
  },
}

export const Secondary = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
    disabled: false,
  },
}

export const Danger = {
  args: {
    label: 'Danger Button',
    variant: 'danger',
    size: 'medium',
    disabled: false,
  },
}

export const Ghost = {
  args: {
    label: 'Ghost Button',
    variant: 'ghost',
    size: 'medium',
    disabled: false,
  },
}

export const AllSizes = {
  args: {
    label: 'Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
  },
  render: (args: { label: string; variant: string; size: string; disabled: boolean }) => {
    const baseClasses = 'rounded-lg font-semibold transition-all duration-200 cursor-pointer'
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
      ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 disabled:text-gray-400',
    }
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    }
    
    return `
      <div class="flex gap-4 items-center">
        <button class="${baseClasses} ${variantClasses[args.variant as keyof typeof variantClasses]} ${sizeClasses.small}">${args.label} Small</button>
        <button class="${baseClasses} ${variantClasses[args.variant as keyof typeof variantClasses]} ${sizeClasses.medium}">${args.label} Medium</button>
        <button class="${baseClasses} ${variantClasses[args.variant as keyof typeof variantClasses]} ${sizeClasses.large}">${args.label} Large</button>
      </div>
    `
  },
}
