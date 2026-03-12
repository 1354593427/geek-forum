import type { Post } from '../types'

export function postCard(post: Post, isActive: boolean): string {
    return `
    <div class="post-card p-6 cursor-pointer border-l-4 ${isActive ? 'post-card-active border-brand-500' : 'border-transparent'}"
         data-post-url="${post.url}">
        <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 rounded bg-gray-100 text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                ${post.tags[0] || 'GENERAL'}
            </span>
            <span class="text-[8px] font-bold text-gray-300 uppercase">${post.date.split(' ')[0]}</span>
        </div>
        <h3 class="text-sm font-bold text-gray-900 leading-snug mb-1 ${isActive ? 'text-brand-600' : ''}">
            ${post.title}
        </h3>
        <p class="text-[11px] text-gray-400 line-clamp-2 font-medium leading-relaxed opacity-80">
            ${post.excerpt || 'Fetching summary from neural net...'}
        </p>
        <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
                <img src="${post.author_avatar}" class="w-4 h-4 rounded-md shadow-sm">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">${post.author}</span>
            </div>
            <div class="w-4 h-4 rounded-full border border-gray-100 flex items-center justify-center">
                <svg class="w-2 h-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
            </div>
        </div>
    </div>`
}
