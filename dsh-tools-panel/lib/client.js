// dsh-tools-panel —— Client 半区(原生单包,__ModuleLoader__ 工厂格式)。
// 通过 /dsh-tools/api/* JSON 路由调用 Host;不再依赖动态沙箱的 host/React 全局。
window.__ModuleLoader__.load({
  id: 'dsh-tools-panel',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    const STYLE_ID = 'dsh-tools-panel/styles'
    const CSS = `.dsh-tool-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:13px; border-radius:999px; border:1px solid var(--dsw-alias-border-l2); background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
.dsh-tool-btn:hover { background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); }
.dsh-tool-btn-active { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.dsh-tool-hammer { font-size:12px; line-height:1; }
.dsh-tool-panel { position:fixed; z-index:9999; pointer-events:auto; width:340px; max-height:80vh; display:flex; flex-direction:column; background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-primary); border:1px solid var(--dsw-alias-border-l2); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.28); overflow:hidden; }
.dsh-tool-panel-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 12px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.dsh-tool-panel-title { font-size:13px; font-weight:600; }
.dsh-tool-panel-close { border:none; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; font-size:14px; line-height:1; padding:4px 6px; border-radius:6px; }
.dsh-tool-panel-close:hover { background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); }
.dsh-tool-scroll { overflow:auto; padding:10px 12px; }
.dsh-tool-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(88px,1fr)); gap:8px; }
.dsh-tool-tile { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:10px 6px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); }
.dsh-tool-iconbtn { display:flex; flex-direction:column; align-items:center; gap:6px; width:100%; border:none; background:transparent; color:var(--dsw-alias-label-primary); cursor:pointer; padding:0; }
.dsh-tool-img { width:28px; height:28px; object-fit:contain; }
.dsh-tool-glyph { font-size:24px; line-height:1; }
.dsh-tool-name { font-size:12px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-tool-tile:hover .dsh-tool-tilemenu { opacity:1; }
.dsh-tool-tilemenu { position:absolute; top:4px; right:4px; display:flex; gap:2px; opacity:0; transition:opacity .12s ease; }
.dsh-tool-mini { border:none; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-secondary); cursor:pointer; font-size:11px; padding:2px 5px; border-radius:5px; }
.dsh-tool-mini:hover { color:var(--dsw-alias-label-primary); }
.dsh-tool-mini.danger:hover { color:var(--dsw-alias-state-error-primary); }
.dsh-tool-tile.add { border-style:dashed; cursor:pointer; color:var(--dsw-alias-label-secondary); }
.dsh-tool-tile.add:hover { color:var(--dsw-alias-label-primary); }
.dsh-tool-rename { width:100%; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:7px; padding:5px 6px; font-size:12px; text-align:center; }
.dsh-tool-ok { border:none; background:var(--dsw-alias-brand-primary); color:#fff; border-radius:6px; padding:3px 8px; font-size:12px; cursor:pointer; }
.dsh-tool-status { margin:0 12px 10px; padding:6px 10px; border-radius:8px; font-size:12px; }
.dsh-tool-status.ok { background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); color:var(--dsw-alias-state-success-primary); }
.dsh-tool-status.fail { background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); color:var(--dsw-alias-state-error-primary); }`
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-tools-panel'
      tag.dataset.pluginCss = STYLE_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    const api = async function (method, payload) {
      const res = await fetch('/dsh-tools/api/' + method, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {}),
      })
      return res.json()
    }

    const PANEL_W = 340
    const STORE_KEY = 'dsh.tools.items'

    function loadItems() {
      try {
        const raw = localStorage.getItem(STORE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && Array.isArray(parsed.items)) return parsed.items
        }
      } catch (e) {}
      return []
    }
    function saveItems(items) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ items: items })) } catch (e) {}
    }
    function genId() {
      return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    }
    function glyphFor(path) {
      const ext = String(path || '').split('.').pop().toLowerCase()
      if (ext === 'exe') return '▶'
      if (ext === 'bat' || ext === 'cmd') return '⚡'
      if (ext === 'ps1') return '⌘'
      if (ext === 'lnk') return '🔗'
      if (ext === 'msi') return '📦'
      return '▣'
    }

    let state = {
      open: false,
      anchor: null,
      items: loadItems(),
      renamingId: null,
      renameVal: '',
      busy: false,
      status: null,
    }
    const listeners = new Set()
    function get() { return state }
    function set(patch) {
      state = Object.assign({}, state, (typeof patch === 'function' ? patch(state) : patch))
      listeners.forEach(function (l) { l() })
    }
    function subscribe(fn) {
      listeners.add(fn)
      return function () { listeners.delete(fn) }
    }

    function ToolButton() {
      const ref = React.useRef(null)
      const [s, setS] = React.useState(get())
      React.useEffect(function () { return subscribe(function () { setS(Object.assign({}, get())) }) }, [])
      const toggle = function () {
        let anchor = { top: 64, left: 12 }
        const el = ref.current
        if (el) {
          const r = el.getBoundingClientRect()
          anchor = { top: r.bottom + 8, left: Math.max(8, r.right - PANEL_W) }
        }
        set({ open: !get().open, anchor: anchor })
      }
      return React.createElement('button', {
        ref: ref,
        'data-dsh-tool-btn': true,
        className: 'dsh-tool-btn' + (get().open ? ' dsh-tool-btn-active' : ''),
        onClick: toggle,
        title: '本地工具',
      }, '工具', React.createElement('span', { className: 'dsh-tool-hammer' }, '🔨'))
    }

    function ToolPanel() {
      const [s, setS] = React.useState(get())
      React.useEffect(function () { return subscribe(function () { setS(Object.assign({}, get())) }) }, [])
      React.useEffect(function () {
        if (!s.open) return
        const items = get().items || []
        items.forEach(function (item) {
          if (item.icon) return
          api('icon', { path: item.path }).then(function (res) {
            if (res && res.dataUrl) {
              const items2 = (get().items || []).map(function (x) { return x.id === item.id ? Object.assign({}, x, { icon: res.dataUrl }) : x })
              saveItems(items2)
              set({ items: items2 })
            }
          }).catch(function () {})
        })
      }, [s.open, s.items])
      React.useEffect(function () {
        if (!s.open) return
        const onDown = function (e) {
          const t = e.target
          if (t && t.closest && (t.closest('[data-dsh-tool-panel]') || t.closest('[data-dsh-tool-btn]'))) return
          set({ open: false })
        }
        document.addEventListener('mousedown', onDown)
        return function () { document.removeEventListener('mousedown', onDown) }
      }, [s.open])
      if (!s.open) return null

      const a = s.anchor || { top: 64, left: 12 }
      const items = s.items || []

      const doRun = async function (item) {
        set({ open: false })
        try {
          await api('run', { path: item.path })
        } catch (err) {}
      }
      const doAdd = async function () {
        if (s.busy) return
        set({ busy: true, status: null })
        let res = null
        try { res = await api('pick', {}) } catch (err) { res = { ok: false, error: String((err && err.message) || err) } }
        set({ busy: false })
        if (res && res.path) {
          const base = String(res.path).split(/[\\/]/).pop()
          const dot = base.lastIndexOf('.')
          const name = res.name || (dot > 0 ? base.slice(0, dot) : base)
          let icon = null
          try { const ic = await api('icon', { path: res.path }); if (ic && ic.dataUrl) icon = ic.dataUrl } catch (e) {}
          const items2 = (get().items || []).concat([{ id: genId(), name: name, path: res.path, icon: icon }])
          saveItems(items2)
          set({ items: items2, status: { ok: true, msg: '已添加 ' + name } })
        } else if (res && res.error) {
          set({ status: res })
        }
      }
      const doRenameStart = function (item) { set({ renamingId: item.id, renameVal: item.name }) }
      const doRenameCommit = function (item) {
        const val = (get().renameVal || '').trim() || item.name
        const items2 = (get().items || []).map(function (x) { return x.id === item.id ? Object.assign({}, x, { name: val }) : x })
        saveItems(items2)
        set({ items: items2, renamingId: null })
      }
      const doDelete = function (item) {
        const items2 = (get().items || []).filter(function (x) { return x.id !== item.id })
        saveItems(items2)
        set({ items: items2 })
      }

      const head = React.createElement('div', { className: 'dsh-tool-panel-head' },
        React.createElement('span', { className: 'dsh-tool-panel-title' }, '本地工具'),
        React.createElement('button', { className: 'dsh-tool-panel-close', onClick: function () { set({ open: false }) } }, '✕')
      )

      const tiles = items.map(function (item) {
        const isRenaming = s.renamingId === item.id
        if (isRenaming) {
          return React.createElement('div', { className: 'dsh-tool-tile renaming', key: item.id },
            React.createElement('input', {
              className: 'dsh-tool-rename',
              value: s.renameVal,
              onChange: function (e) { set({ renameVal: e.target.value }) },
              onKeyDown: function (e) { if (e.key === 'Enter') doRenameCommit(item); if (e.key === 'Escape') set({ renamingId: null }) },
              autoFocus: true,
            }),
            React.createElement('button', { className: 'dsh-tool-ok', onClick: function () { doRenameCommit(item) } }, '✓')
          )
        }
        const iconEl = item.icon
          ? React.createElement('img', { className: 'dsh-tool-img', src: item.icon, alt: '', draggable: false })
          : React.createElement('span', { className: 'dsh-tool-glyph' }, glyphFor(item.path))
        const iconBtn = React.createElement('button', { className: 'dsh-tool-iconbtn', onClick: function () { doRun(item) }, title: item.path },
          iconEl,
          React.createElement('span', { className: 'dsh-tool-name' }, item.name)
        )
        const menu = React.createElement('div', { className: 'dsh-tool-tilemenu' },
          React.createElement('button', { className: 'dsh-tool-mini', onClick: function () { doRenameStart(item) }, title: '重命名' }, '✎'),
          React.createElement('button', { className: 'dsh-tool-mini danger', onClick: function () { doDelete(item) }, title: '删除' }, '🗑')
        )
        return React.createElement('div', { className: 'dsh-tool-tile', key: item.id }, iconBtn, menu)
      })

      const addTile = React.createElement('button', {
        className: 'dsh-tool-tile add',
        key: 'add',
        onClick: doAdd,
        title: '添加本地程序',
        disabled: s.busy,
      },
        React.createElement('span', { className: 'dsh-tool-glyph' }, s.busy ? '…' : '+'),
        React.createElement('span', { className: 'dsh-tool-name' }, s.busy ? '选择中…' : '添加')
      )
      tiles.push(addTile)

      const grid = React.createElement('div', { className: 'dsh-tool-grid' }, tiles)
      let statusEl = null
      if (s.status) {
        const cls = 'dsh-tool-status' + (s.status.ok ? ' ok' : ' fail')
        const txt = s.status.ok ? (s.status.msg || '已启动') : (s.status.error || '已取消')
        statusEl = React.createElement('div', { className: cls }, txt)
      }
      const scroll = React.createElement('div', { className: 'dsh-tool-scroll' }, grid)

      return React.createElement('div', { className: 'dsh-tool-panel', 'data-dsh-tool-panel': true, style: { top: a.top + 'px', left: a.left + 'px' } },
        head,
        scroll,
        statusEl
      )
    }

    const inject = ['slots']
    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return

      slots.inject('conversation.session.header.utilities', function () {
        return slots.register({ name: 'conversation.session.header.utilities', id: 'tools', order: 100, label: '工具' }, function () {
          return React.createElement(ToolButton)
        })
      })
      slots.inject('shell.overlay', function () {
        return slots.register({ name: 'shell.overlay', id: 'tools.panel', order: 100, label: '工具' }, function () {
          return React.createElement(ToolPanel)
        })
      })
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
