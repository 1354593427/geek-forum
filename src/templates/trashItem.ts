import type { Post } from '../types'

export function trashItem(post: Post, idx: number): string {
    return `
    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
        <div class="flex flex-col">
            <span class="text-xs font-black text-gray-900">${post.title}</span>
            <span class="text-[9px] font-bold text-gray-400 uppercase mt-1">${post.url}</span>
        </div>
        <button data-trash-restore="${idx}" class="p-2 text-brand-500 hover:bg-brand-50 rounded-xl transition-all" title="还原">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
            </svg>
        </button>
    </div>`
}
