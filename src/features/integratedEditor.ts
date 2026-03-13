import * as store from '../core/store'
import { getDataSource } from '../api/dataSource'
import { getCategories } from '../api/categories'
import { $id, $input, $select } from '../utils/dom'
import * as reader from './reader'
import * as postList from './postList'

let view: any = null
let editingUrl: string | null = null
let userHasEdited = false
let fileType = 'html'

let cmLoaded = false
let langConf: any = null
let setHighlight: any = null
let htmlLang: () => any
let mdLang: () => any

async function ensureCM() {
    if (cmLoaded) return
    const [cm, state, cmView, langHtml, langMd, theme] = await Promise.all([
        import('codemirror'),
        import('@codemirror/state'),
        import('@codemirror/view'),
        import('@codemirror/lang-html'),
        import('@codemirror/lang-markdown'),
        import('@codemirror/theme-one-dark'),
    ])

    langConf = new state.Compartment()
    htmlLang = langHtml.html
    mdLang = langMd.markdown

    setHighlight = state.StateEffect.define<{ from: number; to: number } | null>()
    const highlightField = state.StateField.define({
        create: () => cmView.Decoration.none,
        update(deco: any, tr: any) {
            for (const e of tr.effects) {
                if (e.is(setHighlight)) {
                    if (e.value) {
                        return cmView.Decoration.set([
                            cmView.Decoration.mark({ class: 'cm-locate-highlight' }).range(e.value.from, e.value.to),
                        ])
                    }
                    return cmView.Decoration.none
                }
            }
            return deco
        },
        provide: (f: any) => cm.EditorView.decorations.from(f),
    })

    const editorState = state.EditorState.create({
        doc: '',
        extensions: [
            cm.basicSetup,
            langConf.of(htmlLang()),
            theme.oneDark,
            highlightField,
            cm.EditorView.updateListener.of((update: any) => {
                if (update.docChanged && view) {
                    userHasEdited = true
                    syncToPreview()
                }
            }),
        ],
    })

    const container = $id('rawSourceEditor')
    view = new cm.EditorView({ state: editorState, parent: container })
    cmLoaded = true
}

export function init() {
    void populateEditCategorySelect()
    ;['editTitle', 'editTags', 'editCategory'].forEach(id => {
        $id(id).addEventListener('input', () => { userHasEdited = true })
    })

    $id('btnEditorClose').addEventListener('click', exitEditMode)
    $id('btnEditorDiscard').addEventListener('click', exitEditMode)
    $id('btnEditorSave').addEventListener('click', saveAndExit)

    window.addEventListener('message', (e: MessageEvent) => {
        if (e.data?.type === 'locate-in-source') locateInSource(e.data.searchText)
    })
}

async function populateEditCategorySelect() {
    const sel = document.getElementById('editCategory') as HTMLSelectElement
    if (!sel) return
    const cats = await getCategories()
    sel.innerHTML = cats.map((c) => `<option value="${escapeAttr(c.slug)}">${escapeAttr(c.name)}</option>`).join('')
}

function escapeAttr(s: string) {
    const div = document.createElement('div')
    div.textContent = s
    return div.innerHTML.replace(/"/g, '&quot;')
}

export async function enterEditMode(url: string) {
    const post = store.findPost(url)
    if (!post) return

    await ensureCM()

    editingUrl = url
    userHasEdited = false
    document.body.classList.add('edit-mode')

    fileType = url.toLowerCase().endsWith('.md') ? 'md' : 'html'
    const badge = document.getElementById('fileTypeBadge')
    if (badge) {
        badge.textContent = fileType.toUpperCase()
        badge.className = `px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
            fileType === 'md' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`
    }
    if (view && langConf) {
        view.dispatch({ effects: langConf.reconfigure(fileType === 'md' ? mdLang() : htmlLang()) })
    }

    $input('editTitle').value = post.title
    $select('editCategory').value = post.category || 'robot'
    $input('editTags').value = (post.tags || []).join(', ')

    setContent('// Loading source...')
    try {
        const ds = getDataSource()
        if (ds.getPostHtml) {
            const html = await ds.getPostHtml(url)
            setContent(html ?? `// Failed to load from API`)
        } else {
            const res = await fetch(url)
            setContent(await res.text())
        }
    } catch (e: any) {
        setContent(`// Failed to load source: ${e.message}`)
    }

    if (window.location.hash.slice(1) !== url) {
        window.location.hash = url
    }
}

export function exitEditMode() {
    const was = editingUrl
    document.body.classList.remove('edit-mode')
    editingUrl = null

    if (was) {
        reader.reloadOriginal(was)
    } else {
        reader.close()
    }
}

export function saveAndExit() {
    if (editingUrl) {
        const post = store.findPost(editingUrl)
        if (post) {
            post.title = $input('editTitle').value
            post.category = $select('editCategory').value
            post.tags = $input('editTags').value.split(',').map(t => t.trim()).filter(Boolean)
        }
        postList.render()
    }
    exitEditMode()
}

function setContent(text: string) {
    if (!view) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
}

function getContent(): string {
    return view?.state.doc.toString() ?? ''
}

function syncToPreview() {
    if (!userHasEdited || !view) return
    const iframe = document.getElementById('postIframe') as HTMLIFrameElement | null
    if (!iframe) return

    const source = getContent()
    const title = $input('editTitle').value

    if (fileType === 'html') {
        const closeTag = '</' + 'script>'
        const script = `<script>document.addEventListener('click',function(e){var el=e.target;while(el&&['SPAN','A','STRONG','EM','CODE','I','B'].includes(el.tagName))el=el.parentElement;if(!el||el===document.body||el===document.documentElement)return;var id=el.id?'id="'+el.id+'"':'';var fc=el.className&&typeof el.className==='string'?el.className.trim().split(/\\s+/)[0]:'';var cls=fc?'class="'+fc+'"':'';var txt=el.textContent?el.textContent.trim().slice(0,60):'';var s=id||cls||txt;if(s)window.parent.postMessage({type:'locate-in-source',searchText:s},'*');},true);${closeTag}`
        iframe.srcdoc = source.includes('</body>') ? source.replace(/<\/body>/i, script + '</body>') : source + script
    } else {
        const esc = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:monospace;padding:2rem;line-height:1.8;white-space:pre-wrap;color:#374151;background:#fafafa;font-size:13px;}</style></head><body>${esc}</body></html>`
    }
    if (title) $id('readerTitleMini').innerText = title
}

function locateInSource(searchText: string) {
    if (!view || !searchText || !setHighlight) return
    const doc = view.state.doc.toString()
    const query = searchText.trim().slice(0, 80).toLowerCase()
    const idx = doc.toLowerCase().indexOf(query)
    if (idx !== -1) {
        view.dispatch({
            effects: setHighlight.of({ from: idx, to: idx + query.length }),
            selection: { anchor: idx },
            scrollIntoView: true,
        })
        setTimeout(() => { view?.dispatch({ effects: setHighlight.of(null) }) }, 3000)
    }
}
