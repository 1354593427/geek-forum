export function draftItem(draft: any, idx: number): string {
    const date = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : '--'
    const title = draft.title || 'Untitled Draft'
    return `
    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
        <div class="flex flex-col flex-1 min-w-0 mr-4">
            <span class="text-xs font-black text-gray-900 truncate">${title}</span>
            <span class="text-[9px] font-bold text-gray-400 uppercase mt-1">${date}</span>
        </div>
        <div class="flex items-center gap-2">
            <a href="editor.html" target="_blank" class="px-3 py-1.5 text-brand-500 hover:bg-brand-50 rounded-xl transition-all text-[10px] font-black uppercase">Open</a>
            <button data-draft-delete="${idx}" class="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all" title="删除此草稿">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    </div>`
}
