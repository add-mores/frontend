import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// // src/lib/utils.ts
// /** className 합쳐주는 유틸 */
// export function cn(...classes: (string|false|null|undefined)[]) {
//   return classes.filter(Boolean).join(' ')
// }