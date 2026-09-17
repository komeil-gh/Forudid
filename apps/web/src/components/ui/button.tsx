import * as Slot from 'radix-ui/slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'
const variants = cva('button', { variants: { variant: {
  default: 'button-default', ghost: 'button-ghost',
} }, defaultVariants: { variant: 'default' } })
export function Button({ className, variant, asChild = false, ...props }:
  ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : 'button'
  return <Component className={twMerge(clsx(variants({ variant }), className))} {...props} />
}
