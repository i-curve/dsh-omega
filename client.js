window.__ModuleLoader__.load({
  id: 'dsh-omega',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useRef, useState } = React

    const API = '/dsh-omega/api'
    const EXTENSION_KEY = '-dshOmega'
    const PROFILE_COLORS = ['#99ccee', '#99dd99', '#eebb66', '#ee9999', '#99dddd', '#ccaaff', '#cccccc']

    const COPY = {
      en: {
        nav: 'Proxy',
        title: 'Proxy routing',
        subtitle: 'Choose a proxy profile, switch automatically by host, or bind one profile to a model provider. Configuration stays in the Zero Omega backup format.',
        current: 'Current profile',
        save: 'Save and apply',
        saving: 'Saving…',
        saved: 'Saved and applied',
        dirty: 'Unsaved changes',
        reset: 'Discard changes',
        error: 'Something went wrong',
        retry: 'Retry',
        loading: 'Loading configuration…',
        unavailable: 'The dsh-omega host is not reachable. Make sure the bundle is enabled and the GUI is connected.',
        profiles: 'Profiles',
        providers: 'Providers',
        tester: 'Rule tester',
        io: 'Import / export',
        builtin: 'Built-in',
        addProxy: 'Proxy server',
        addSwitch: 'Automatic switch',
        addRuleList: 'Rule list',
        addRule: 'Add rule',
        defaultProfile: 'Default profile',
        rules: 'Switching rules',
        noRules: 'No rules yet. Everything uses the default profile.',
        condition: 'Condition',
        pattern: 'Match',
        target: 'Profile',
        delete: 'Delete',
        confirmDelete: 'Click again to delete',
        up: 'Move up',
        down: 'Move down',
        rename: 'Name',
        nameTaken: 'Another profile already uses that name.',
        proxyServer: 'Proxy server',
        protocol: 'Protocol',
        host: 'Host',
        port: 'Port',
        username: 'Username (optional)',
        password: 'Password (optional)',
        bypass: 'Bypass list (one pattern per line)',
        bypassHint: 'Hosts, *.domain entries, IP/CIDR and <local> are accepted. Loopback is always direct.',
        unsupported: 'DSH cannot evaluate this profile type; requests fall back to direct.',
        ruleList: 'Rule list',
        ruleListHint: 'AutoProxy (GFWList) and SwitchyOmega rule-list text are supported.',
        ruleListUrl: 'Rule list URL',
        ruleListUrlHint: 'Download an AutoProxy or SwitchyOmega list from this URL. The download follows the current routing, so a GitHub-hosted list can go through the proxy.',
        updateNow: 'Update now',
        updating: 'Downloading…',
        sourceRequired: 'Enter a rule list URL first.',
        updateSuccess: 'Updated: {count} lines ({bytes} bytes). Save to apply.',
        lastUpdated: 'Last updated',
        neverUpdated: 'never',
        ruleListReadonly: 'This list has a source URL, so its text is read-only. Use Update now, or switch to manual editing.',
        clearSource: 'Edit manually',
        exportRuleList: 'Download list',
        copyRuleList: 'Copy list',
        publishHint: 'Host the downloaded list at any reachable URL to share it as a subscription.',
        autoUpdateInterval: 'Auto-update (minutes, 0 = off)',
        autoUpdateHint: 'A global setting shared by every rule-list profile. The host refreshes stale lists in the background; 0 disables it.',
        format: 'Format',
        matchProfile: 'Matched rules use',
        directNote: 'Direct connection. No proxy is used for requests resolved to this profile.',
        systemNote: 'DSH does not read the operating system proxy, so the system profile behaves as direct.',
        providersTitle: 'Model provider bindings',
        providersHint: 'A binding wins over the current profile for the hosts shown below. Empty means follow the current profile.',
        follow: 'Follow current profile',
        refresh: 'Detect again',
        detected: 'auto-detected',
        overridden: 'custom',
        noProviders: 'No model providers were detected. Configure a provider under Settings → Models first.',
        editHosts: 'Edit hosts',
        hostsEmpty: 'No hosts detected. Add the gateway hostname manually if this provider should use a binding.',
        hostsHint: 'One host per line. Subdomains are included.',
        bindHint: 'Bindings apply to the provider’s inference endpoint and its well-known authentication hosts.',
        testerTitle: 'Test a URL',
        testerHint: 'See which profile and proxy the host would pick right now.',
        testUrl: 'URL',
        runTest: 'Resolve',
        testing: 'Resolving…',
        resultDirect: 'Direct',
        resultProxy: 'Proxy',
        via: 'via',
        viaProvider: 'provider binding',
        viaCurrent: 'current profile',
        viaLoopback: 'loopback',
        trace: 'Decision path',
        ioTitle: 'Import and export',
        ioHint: 'The export is a Zero Omega / SwitchyOmega .bak document. Browser backups import directly, including rule lists and SOCKS profiles (reported as unsupported).',
        exportPreview: 'Current backup',
        exportSavedHint: 'Exports the saved configuration. Save your changes first to include them.',
        refreshPreview: 'Refresh preview',
        download: 'Download .bak',
        copy: 'Copy',
        copied: 'Copied',
        importTitle: 'Import a backup',
        importHint: 'Choose a .bak file or paste its JSON. Replace swaps the whole document; merge keeps profiles the backup does not mention.',
        chooseFile: 'Choose file',
        importText: 'Or paste backup JSON',
        replace: 'Replace everything',
        merge: 'Merge into current',
        import: 'Import',
        importing: 'Importing…',
        imported: 'Backup imported',
        summary: 'Imported summary',
        profilesCount: 'profiles',
        rulesCount: 'rules',
        warnings: 'Notes',
        file: 'Configuration file',
        version: 'Version',
        noDoc: 'No configuration loaded.',
        ruleCount: '{count} rules',
        profileCount: '{count} profiles',
        yes: 'Yes',
        cancel: 'Cancel',
        currentProfile: 'Current profile',
        socksWarning: 'SOCKS proxies are not supported by DSH; this profile falls back to direct.',
        typeDirect: 'Direct',
        typeSystem: 'System proxy',
        typeProxy: 'Proxy server',
        typeSwitch: 'Automatic switch',
        typeRuleList: 'Rule list',
        typePac: 'PAC script',
        typeUnknown: 'Unknown type',
        condHostWildcard: 'Host wildcard',
        condHostRegex: 'Host regex',
        condUrlWildcard: 'URL wildcard',
        condUrlRegex: 'URL regex',
        condKeyword: 'URL keyword',
        condIp: 'IP / CIDR',
        condAlways: 'Always',
        condNever: 'Never',
        hostsLabel: 'Hosts',
        warnBuiltinDropped: 'Ignored built-in profile {name}; direct and system are implicit.',
        warnProfileInvalid: 'Profile {name} is not an object and was skipped.',
        warnTypeDefaulted: 'Profile {name} had no type; treated as a proxy server.',
        warnProxyDefaulted: 'Profile {name} had no proxy; a local HTTP proxy was assumed.',
        warnUnsupportedType: 'Profile {name} uses unsupported type {type}.',
        warnPac: 'Profile {name} is a PAC script; DSH cannot execute it and routes direct.',
        warnSocks: 'Profile {name} uses {scheme} for {prop}; DSH supports HTTP/HTTPS proxies only, so it routes direct.',
        warnProxyInvalid: 'Profile {name} has an empty host or an invalid port in {prop}; requests fall back to direct.',
        warnRuleInvalid: 'Rule {index} in {name} is invalid: {detail}',
        warnRuleNoTarget: 'Rule {index} in {name} has no target profile.',
        warnRuleListEmpty: 'Profile {name} has an empty rule list.',
        warnCurrentMissing: 'Current profile {name} does not exist; fell back to an automatic profile.',
        warnBindingMissing: 'Provider {provider} was bound to missing profile {binding}; the binding was ignored.',
        warnConfigUnreadable: 'The configuration file could not be read: {message}',
        traceLoopback: 'Loopback address: always direct',
        traceProvider: 'Provider {provider} is bound to {profile}',
        traceCurrent: 'Current profile: {profile}',
        traceRule: '{profile} matched a rule → {target}',
        traceListRule: '{profile} matched a rule-list entry → {target}',
        traceDefault: '{profile} fell back to {target}',
        traceProxy: 'Proxy {proxy} (via {profile})',
        traceBypass: '{profile} matched its bypass list: direct',
        traceCycle: 'Profile references cycle: direct',
        traceMissingProfile: 'Profile {profile} does not exist: direct',
        traceNoProfile: 'No profile was selected: direct',
        traceNoProxy: '{profile} has no proxy for this scheme: direct',
        traceInvalidProxy: '{profile} has an invalid proxy address: direct',
        traceSystem: '{profile} is a system profile: direct in DSH',
        traceDirect: '{profile}: direct',
        traceUnsupportedScheme: '{profile} uses {scheme}, which DSH cannot proxy: direct',
        tracePac: '{profile} is a PAC script: direct',
        traceUnsupportedType: '{profile} has unsupported type {type}: direct',
        addRuleHint: 'Rules are evaluated top to bottom; the first match wins.',
        manualRule: 'Quick add a host rule',
        quickHost: 'host, e.g. *.example.com',
        add: 'Add',
        saveFirst: 'Save the profile before adding rules.',
        invalidName: 'A profile name cannot be empty.',
        invalidRule: 'This rule is incomplete.',
        invalidRegex: 'This regular expression is invalid.',
        draftResult: 'draft, not applied',
        appliedResult: 'applied',
        draftHint: 'This result uses your unsaved edits. Save to apply it.',
        fileLoaded: 'File loaded. Review it below, then press Import.',
        useProfile: 'Use this profile',
        inUse: 'current',
        perSchemeNote: 'This profile has separate HTTP/HTTPS proxies. Editing here syncs them to one proxy; use the button to collapse them.',
        collapseSchemes: 'Use one proxy',
        clipboardError: 'Clipboard is unavailable.',
        resetConfirm: 'Discard all unsaved changes?',
      },
      zh: {
        nav: '代理',
        title: '代理分流',
        subtitle: '用 Zero Omega 的情景模式、按域名自动切换，或把某个情景模式绑定到某个模型提供商。配置始终保存为 Zero Omega 备份格式。',
        current: '当前情景模式',
        save: '保存并应用',
        saving: '正在保存…',
        saved: '已保存并生效',
        dirty: '有未保存的更改',
        reset: '放弃更改',
        error: '出错了',
        retry: '重试',
        loading: '正在读取配置…',
        unavailable: '连不上 dsh-omega 宿主。请确认插件已启用、页面连接正常。',
        profiles: '情景模式',
        providers: '模型提供商',
        tester: '规则测试',
        io: '导入 / 导出',
        builtin: '内置',
        addProxy: '新建代理服务器',
        addSwitch: '新建自动切换',
        addRuleList: '新建规则列表',
        addRule: '添加规则',
        defaultProfile: '默认情景模式',
        rules: '切换规则',
        noRules: '还没有规则，全部使用默认情景模式。',
        condition: '条件',
        pattern: '匹配内容',
        target: '情景模式',
        delete: '删除',
        confirmDelete: '再点一次删除',
        up: '上移',
        down: '下移',
        rename: '名称',
        nameTaken: '已有同名情景模式。',
        proxyServer: '代理服务器',
        protocol: '协议',
        host: '地址',
        port: '端口',
        username: '用户名（可选）',
        password: '密码（可选）',
        bypass: '不走代理的地址（每行一个）',
        bypassHint: '支持域名、*.domain、IP/CIDR 和 <local>；本机地址始终直连。',
        unsupported: 'DSH 无法执行这种情景模式，请求会按直连处理。',
        ruleList: '规则列表',
        ruleListHint: '支持 AutoProxy（GFWList）和 SwitchyOmega 规则列表文本。',
        ruleListUrl: '规则列表网址',
        ruleListUrlHint: '从这个 URL 下载 AutoProxy / SwitchyOmega 规则列表；下载遵循当前路由，GitHub 上的列表可以走代理。',
        updateNow: '立即更新',
        updating: '正在下载…',
        sourceRequired: '请先填写规则列表网址。',
        updateSuccess: '已更新：{count} 行（{bytes} 字节）。保存后生效。',
        lastUpdated: '上次更新',
        neverUpdated: '从未',
        ruleListReadonly: '已有来源网址，列表内容只读；用“立即更新”刷新，或改为手动编辑。',
        clearSource: '改为手动编辑',
        exportRuleList: '下载规则列表',
        copyRuleList: '复制规则列表',
        publishHint: '把下载/复制的列表放到任意可访问的 URL，就能作为订阅地址分享。',
        autoUpdateInterval: '自动更新间隔（分钟，0 关闭）',
        autoUpdateHint: '这是全局设置，所有规则列表共用；宿主会定期刷新过期列表，0 表示不自动刷新。',
        format: '格式',
        matchProfile: '命中的规则使用',
        directNote: '直接连接。命中此情景模式的请求不会走代理。',
        systemNote: 'DSH 不读取系统代理，因此 system 情景模式按直连处理。',
        providersTitle: '模型提供商绑定',
        providersHint: '绑定的优先级高于当前情景模式；留空表示跟随当前情景模式。',
        follow: '跟随当前情景模式',
        refresh: '重新检测',
        detected: '自动检测',
        overridden: '自定义',
        noProviders: '没有检测到模型提供商。请先在「设置 → 模型」里配置一个提供商。',
        editHosts: '编辑域名',
        hostsEmpty: '没有检测到域名。如果这个提供商需要绑定，请手动填写网关域名。',
        hostsHint: '每行一个域名，包含其子域。',
        bindHint: '绑定会作用于该提供商的推理端点和已知的认证域名。',
        testerTitle: '测试一个 URL',
        testerHint: '看看这个地址当前会命中哪个情景模式、走不走代理。',
        testUrl: 'URL',
        runTest: '解析',
        testing: '正在解析…',
        resultDirect: '直连',
        resultProxy: '代理',
        via: '来源',
        viaProvider: '提供商绑定',
        viaCurrent: '当前情景模式',
        viaLoopback: '本机地址',
        trace: '判定过程',
        ioTitle: '导入与导出',
        ioHint: '导出内容是 Zero Omega / SwitchyOmega 的 .bak 文档，浏览器备份可以直接导入（包括规则列表；SOCKS 情景模式会提示不受支持）。',
        exportPreview: '当前备份',
        exportSavedHint: '导出的是已保存的配置；想包含刚改的内容，请先保存。',
        refreshPreview: '刷新预览',
        download: '下载 .bak',
        copy: '复制',
        copied: '已复制',
        importTitle: '导入备份',
        importHint: '选择 .bak 文件或粘贴 JSON。覆盖会替换整个文档；合并会保留备份里没有的情景模式。',
        chooseFile: '选择文件',
        importText: '或粘贴备份 JSON',
        replace: '覆盖当前配置',
        merge: '合并到当前配置',
        import: '导入',
        importing: '正在导入…',
        imported: '备份已导入',
        summary: '导入摘要',
        profilesCount: '个情景模式',
        rulesCount: '条规则',
        warnings: '提示',
        file: '配置文件',
        version: '版本',
        noDoc: '没有读取到配置。',
        ruleCount: '{count} 条规则',
        profileCount: '{count} 个情景模式',
        yes: '是',
        cancel: '取消',
        currentProfile: '当前情景模式',
        socksWarning: 'DSH 不支持 SOCKS 代理，此情景模式会按直连处理。',
        typeDirect: '直接连接',
        typeSystem: '系统代理',
        typeProxy: '代理服务器',
        typeSwitch: '自动切换',
        typeRuleList: '规则列表',
        typePac: 'PAC 脚本',
        typeUnknown: '未知类型',
        condHostWildcard: '域名通配',
        condHostRegex: '域名正则',
        condUrlWildcard: 'URL 通配',
        condUrlRegex: 'URL 正则',
        condKeyword: 'URL 关键词',
        condIp: 'IP / CIDR',
        condAlways: '总是',
        condNever: '从不',
        hostsLabel: '域名',
        warnBuiltinDropped: '已忽略内置情景模式 {name}；direct 和 system 是内置的。',
        warnProfileInvalid: '情景模式 {name} 不是对象，已跳过。',
        warnTypeDefaulted: '情景模式 {name} 没有类型，按代理服务器处理。',
        warnProxyDefaulted: '情景模式 {name} 没有代理地址，已填入本机 HTTP 代理默认值。',
        warnUnsupportedType: '情景模式 {name} 使用了不支持的类型 {type}。',
        warnPac: '情景模式 {name} 是 PAC 脚本，DSH 无法执行，将按直连处理。',
        warnSocks: '情景模式 {name} 的 {prop} 使用 {scheme}；DSH 只支持 HTTP/HTTPS 代理，将按直连处理。',
        warnProxyInvalid: '情景模式 {name} 的 {prop} 地址为空或端口无效，将按直连处理。',
        warnRuleInvalid: '情景模式 {name} 的第 {index} 条规则无效：{detail}',
        warnRuleNoTarget: '情景模式 {name} 的第 {index} 条规则没有目标情景模式。',
        warnRuleListEmpty: '情景模式 {name} 的规则列表为空。',
        warnCurrentMissing: '当前情景模式 {name} 不存在，已回退到自动切换情景模式。',
        warnBindingMissing: '提供商 {provider} 绑定的情景模式 {binding} 不存在，已忽略该绑定。',
        warnConfigUnreadable: '配置文件读取失败：{message}',
        traceLoopback: '本机地址：始终直连',
        traceProvider: '提供商 {provider} 绑定到 {profile}',
        traceCurrent: '当前情景模式：{profile}',
        traceRule: '{profile} 命中规则 → {target}',
        traceListRule: '{profile} 命中规则列表 → {target}',
        traceDefault: '{profile} 默认 → {target}',
        traceProxy: '使用代理 {proxy}（来自 {profile}）',
        traceBypass: '{profile} 命中 bypassList：直连',
        traceCycle: '情景模式引用循环：直连',
        traceMissingProfile: '情景模式 {profile} 不存在：直连',
        traceNoProfile: '没有选择情景模式：直连',
        traceNoProxy: '{profile} 没有为这个协议配置代理：直连',
        traceInvalidProxy: '{profile} 的代理地址无效：直连',
        traceSystem: '{profile} 是系统代理情景模式：DSH 中按直连处理',
        traceDirect: '{profile}：直连',
        traceUnsupportedScheme: '{profile} 使用 {scheme}，DSH 无法代理：直连',
        tracePac: '{profile} 是 PAC 脚本：直连',
        traceUnsupportedType: '{profile} 的类型 {type} 不受支持：直连',
        addRuleHint: '规则从上到下匹配，命中第一条即停止。',
        manualRule: '快速添加域名规则',
        quickHost: '域名，例如 *.example.com',
        add: '添加',
        saveFirst: '请先保存情景模式，再添加规则。',
        invalidName: '情景模式名称不能为空。',
        invalidRule: '这条规则还不完整。',
        invalidRegex: '正则表达式无效。',
        draftResult: '草稿，未应用',
        appliedResult: '已应用',
        draftHint: '这个结果使用了未保存的修改；保存后才会真正生效。',
        fileLoaded: '文件已载入，确认内容后点“导入”。',
        useProfile: '使用此情景模式',
        inUse: '当前',
        perSchemeNote: '这个情景模式为 HTTP/HTTPS 分别配置了代理。在这里编辑会把它们同步成同一个；也可以收拢成单一代理。',
        collapseSchemes: '收拢成单一代理',
        clipboardError: '剪贴板不可用。',
        resetConfirm: '放弃所有未保存的修改？',
      },
    }

    const CONDITION_LABELS = {
      HostWildcardCondition: 'condHostWildcard',
      HostRegexCondition: 'condHostRegex',
      UrlWildcardCondition: 'condUrlWildcard',
      UrlRegexCondition: 'condUrlRegex',
      KeywordCondition: 'condKeyword',
      IpCondition: 'condIp',
      TrueCondition: 'condAlways',
      FalseCondition: 'condNever',
    }

    const TYPE_KEYS = {
      DirectProfile: 'typeDirect',
      SystemProfile: 'typeSystem',
      FixedProfile: 'typeProxy',
      SwitchProfile: 'typeSwitch',
      VirtualProfile: 'typeSwitch',
      RuleListProfile: 'typeRuleList',
      PacProfile: 'typePac',
    }

    const WARNING_KEYS = {
      'profile.builtin-dropped': 'warnBuiltinDropped',
      'profile.invalid': 'warnProfileInvalid',
      'profile.type-defaulted': 'warnTypeDefaulted',
      'profile.proxy-defaulted': 'warnProxyDefaulted',
      'profile.unsupported-type': 'warnUnsupportedType',
      'profile.pac': 'warnPac',
      'profile.socks': 'warnSocks',
      'profile.proxy-invalid': 'warnProxyInvalid',
      'profile.rule-invalid': 'warnRuleInvalid',
      'profile.rule-no-target': 'warnRuleNoTarget',
      'profile.rule-list-empty': 'warnRuleListEmpty',
      'current.missing': 'warnCurrentMissing',
      'provider.binding-missing': 'warnBindingMissing',
      'config.unreadable': 'warnConfigUnreadable',
    }

    const TRACE_KEYS = {
      loopback: 'traceLoopback',
      provider: 'traceProvider',
      current: 'traceCurrent',
      rule: 'traceRule',
      'list-rule': 'traceListRule',
      default: 'traceDefault',
      proxy: 'traceProxy',
      bypass: 'traceBypass',
      cycle: 'traceCycle',
      'missing-profile': 'traceMissingProfile',
      'no-profile': 'traceNoProfile',
      'no-proxy': 'traceNoProxy',
      'invalid-proxy': 'traceInvalidProxy',
      system: 'traceSystem',
    }

    const CSS = `
.omega-page { display:flex; flex-direction:column; gap:14px; color:var(--dsw-alias-label-primary); max-width:760px; }
.omega-head { display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.omega-headText { flex:1 1 280px; min-width:0; }
.omega-title { margin:0; font-size:16px; line-height:24px; font-weight:500; }
.omega-intro { margin:4px 0 0; font-size:13px; line-height:20px; color:var(--dsw-alias-label-tertiary); }
.omega-headActions { display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap; }
.omega-current { display:flex; flex-direction:column; gap:4px; font-size:12px; color:var(--dsw-alias-label-secondary); }
.omega-banner { border-radius:var(--dsw-radius-md); padding:8px 12px; font-size:12px; line-height:18px; }
.omega-banner.error { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-state-error-primary); }
.omega-banner.warn { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-state-warn-label); }
.omega-banner.ok { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-state-success-primary); }
.omega-banner ul { margin:4px 0 0; padding-left:18px; }
.omega-tabs { display:flex; gap:2px; border-bottom:0.5px solid var(--dsw-alias-border-l2); padding-bottom:2px; flex-wrap:wrap; }
.omega-tab { box-sizing:border-box; border:none; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:13px; line-height:20px; padding:6px 10px; border-radius:var(--dsw-radius-sm) var(--dsw-radius-sm) 0 0; cursor:pointer; }
.omega-tab:hover { background:var(--dsw-alias-interactive-bg-hover); }
.omega-tab:focus-visible { outline:2px solid var(--dsw-alias-border-selected); outline-offset:1px; }
.omega-tab.active { color:var(--dsw-alias-label-primary); font-weight:500; box-shadow:inset 0 -2px 0 var(--dsw-alias-brand-primary); }
.omega-profileBar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.omega-profileChip { box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; max-width:100%; border:0.5px solid var(--dsw-alias-border-l3); background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; padding:4px 9px; border-radius:var(--dsw-radius-sm); cursor:pointer; }
.omega-profileChip:hover { background:var(--dsw-alias-interactive-bg-hover); }
.omega-profileChip:focus-visible { outline:2px solid var(--dsw-alias-border-selected); outline-offset:1px; }
.omega-profileChip.active { background:var(--dsw-alias-bg-module-platform); border-color:var(--dsw-alias-border-selected); }
.omega-profileChipName { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.omega-addRow { display:inline-flex; gap:6px; flex-wrap:wrap; }
.omega-content { min-width:0; display:flex; flex-direction:column; gap:12px; }
.omega-card { border:0.5px solid var(--dsw-alias-settings-card-stroke); background:var(--dsw-alias-settings-card-fill); border-radius:var(--dsw-radius-xl); padding:14px; display:flex; flex-direction:column; gap:12px; }
.omega-cardHead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.omega-cardTitle { font-size:14px; line-height:22px; font-weight:500; flex:1; min-width:0; }
.omega-badge { font-size:11px; line-height:16px; padding:1px 7px; border:0.5px solid var(--dsw-alias-border-l3); border-radius:var(--dsw-radius-xs); color:var(--dsw-alias-label-secondary); }
.omega-badge.warn { color:var(--dsw-alias-state-warn-label); }
.omega-badge.ok { color:var(--dsw-alias-state-success-primary); }
.omega-muted { font-size:12px; line-height:18px; color:var(--dsw-alias-label-tertiary); margin:0; }
.omega-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
.omega-label { font-size:12px; line-height:18px; color:var(--dsw-alias-label-secondary); }
.omega-input, .omega-select, .omega-textarea { box-sizing:border-box; width:100%; font:inherit; font-size:13px; line-height:20px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-1); border:0.5px solid var(--dsw-alias-border-l3); border-radius:var(--dsw-radius-sm); padding:5px 8px; }
.omega-input.invalid, .omega-select.invalid { border-color:var(--dsw-alias-state-error-primary); }
.omega-input:focus, .omega-select:focus, .omega-textarea:focus { outline:2px solid var(--dsw-alias-border-selected); outline-offset:1px; }
.omega-textarea { min-height:72px; resize:vertical; font-family:ui-monospace, monospace; }
.omega-row { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:8px; }
.omega-col-3 { grid-column:span 3; } .omega-col-4 { grid-column:span 4; } .omega-col-5 { grid-column:span 5; } .omega-col-6 { grid-column:span 6; } .omega-col-8 { grid-column:span 8; } .omega-col-12 { grid-column:span 12; }
@media (max-width:640px){ .omega-col-3,.omega-col-4,.omega-col-5,.omega-col-6,.omega-col-8 { grid-column:span 12; } }
.omega-btn { box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; gap:4px; height:32px; padding:0 12px; border-radius:var(--dsw-radius-md); border:0.5px solid var(--dsw-alias-border-l3); background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:13px; line-height:20px; cursor:pointer; white-space:nowrap; }
.omega-btn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); }
.omega-btn:focus-visible { outline:2px solid var(--dsw-alias-border-selected); outline-offset:1px; }
.omega-btn:disabled { opacity:.5; cursor:default; }
.omega-btn.primary { background:var(--dsw-alias-button-primary-fill); border-color:transparent; color:var(--dsw-alias-label-primary-foreground); }
.omega-btn.primary:hover:not(:disabled) { background:var(--dsw-alias-button-primary-hover); }
.omega-btn.danger { color:var(--dsw-alias-state-error-primary); }
.omega-btn.small { height:26px; padding:0 8px; font-size:12px; line-height:18px; }
.omega-btn.icon { width:28px; padding:0; }
.omega-rules { display:flex; flex-direction:column; gap:8px; }
.omega-rule { display:flex; flex-direction:column; gap:6px; border:0.5px solid var(--dsw-alias-border-l2); border-radius:var(--dsw-radius-md); padding:8px; }
.omega-rule.invalid { border-color:var(--dsw-alias-state-error-primary); }
.omega-ruleCondition { display:grid; grid-template-columns:120px minmax(0,1fr); gap:6px; align-items:center; min-width:0; }
.omega-ruleFoot { display:flex; align-items:center; gap:6px; }
.omega-ruleTarget { flex:1 1 auto; min-width:0; }
.omega-ruleActions { display:inline-flex; gap:4px; flex:none; }
.omega-ruleError { font-size:11px; line-height:16px; color:var(--dsw-alias-state-error-primary); }
@media (max-width:520px){ .omega-ruleCondition { grid-template-columns:1fr; } }
.omega-table { display:flex; flex-direction:column; gap:8px; }
.omega-provider { border:0.5px solid var(--dsw-alias-border-l2); border-radius:var(--dsw-radius-md); padding:10px; display:flex; flex-direction:column; gap:8px; }
.omega-providerHead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.omega-chips { display:flex; flex-wrap:wrap; gap:4px; }
.omega-chip { font-size:11px; line-height:16px; padding:1px 6px; border-radius:var(--dsw-radius-xs); background:var(--dsw-alias-bg-module-platform); color:var(--dsw-alias-label-secondary); }
.omega-trace { display:flex; flex-direction:column; gap:4px; margin:0; padding:0; list-style:none; }
.omega-trace li { font-size:12px; line-height:18px; color:var(--dsw-alias-label-secondary); display:flex; gap:6px; }
.omega-trace .step { color:var(--dsw-alias-label-caption); }
.omega-result { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:10px; border-radius:var(--dsw-radius-md); background:var(--dsw-alias-bg-layer-1); }
.omega-result strong { font-size:14px; }
.omega-io { display:flex; flex-direction:column; gap:8px; }
.omega-radio { display:flex; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--dsw-alias-label-secondary); }
.omega-radio label { display:inline-flex; align-items:center; gap:4px; }
.omega-foot { font-size:11px; line-height:16px; color:var(--dsw-alias-label-caption); display:flex; gap:8px; flex-wrap:wrap; }
.omega-code { font-family:ui-monospace, monospace; font-size:11px; }
.omega-empty { font-size:13px; color:var(--dsw-alias-label-tertiary); }
.omega-subhead { font-size:13px; font-weight:500; margin:0; }
.omega-split { display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
.omega-split > * { min-width:0; }
.omega-grow { flex:1 1 160px; }
`

    async function api(path, init) {
      const response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(init?.headers ?? {}),
        },
      })
      let payload
      try {
        payload = await response.json()
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
      if (!response.ok || payload.ok !== true) throw new Error(payload.error ?? `HTTP ${response.status}`)
      return payload
    }

    function clone(value) {
      return JSON.parse(JSON.stringify(value))
    }

    function profileEntries(doc) {
      const rows = []
      for (const [key, value] of Object.entries(doc)) {
        if (!key.startsWith('+') || value === null || typeof value !== 'object') continue
        rows.push({ name: key.slice(1), profile: value })
      }
      const order = { FixedProfile: 0, SwitchProfile: 1, VirtualProfile: 1, RuleListProfile: 2 }
      rows.sort((left, right) => (order[left.profile.profileType] ?? 3) - (order[right.profile.profileType] ?? 3))
      return rows
    }

    function allProfileNames(doc) {
      return ['direct', 'system', ...profileEntries(doc).map(row => row.name)]
    }

    function extensionOf(doc) {
      const raw = doc?.[EXTENSION_KEY]
      const value = raw !== null && typeof raw === 'object' ? raw : {}
      return {
        version: 1,
        currentProfileName: typeof value.currentProfileName === 'string' ? value.currentProfileName : '',
        providerBindings: value.providerBindings !== null && typeof value.providerBindings === 'object' ? { ...value.providerBindings } : {},
        providerHosts: value.providerHosts !== null && typeof value.providerHosts === 'object' ? { ...value.providerHosts } : {},
      }
    }

    function setExtension(doc, extension) {
      doc[EXTENSION_KEY] = { version: 1, ...extension }
    }

    function renameProfile(doc, oldName, newName) {
      const next = clone(doc)
      const original = next[`+${oldName}`]
      if (original === undefined) return doc
      delete next[`+${oldName}`]
      next[`+${newName}`] = { ...original, name: newName }
      for (const [key, value] of Object.entries(next)) {
        if (!key.startsWith('+') || value === null || typeof value !== 'object') continue
        if (value.defaultProfileName === oldName) value.defaultProfileName = newName
        if (value.matchProfileName === oldName) value.matchProfileName = newName
        if (Array.isArray(value.rules)) {
          for (const rule of value.rules) if (rule.profileName === oldName) rule.profileName = newName
        }
      }
      const extension = extensionOf(next)
      if (extension.currentProfileName === oldName) extension.currentProfileName = newName
      for (const [provider, binding] of Object.entries(extension.providerBindings)) {
        if (binding === oldName) extension.providerBindings[provider] = newName
      }
      setExtension(next, extension)
      if (next['-startupProfileName'] === oldName) next['-startupProfileName'] = newName
      return next
    }

    function deleteProfile(doc, name) {
      const next = clone(doc)
      delete next[`+${name}`]
      for (const [key, value] of Object.entries(next)) {
        if (!key.startsWith('+') || value === null || typeof value !== 'object') continue
        if (value.defaultProfileName === name) value.defaultProfileName = 'direct'
        if (value.matchProfileName === name) value.matchProfileName = 'direct'
        if (Array.isArray(value.rules)) {
          for (const rule of value.rules) if (rule.profileName === name) rule.profileName = 'direct'
        }
      }
      const extension = extensionOf(next)
      if (extension.currentProfileName === name) extension.currentProfileName = 'direct'
      for (const [provider, binding] of Object.entries(extension.providerBindings)) {
        if (binding === name) extension.providerBindings[provider] = ''
      }
      setExtension(next, extension)
      if (next['-startupProfileName'] === name) next['-startupProfileName'] = 'direct'
      return next
    }

    function addProfile(doc, type) {
      const prefix = type === 'FixedProfile' ? 'proxy' : type === 'RuleListProfile' ? 'rule list' : 'auto switch'
      let index = 1
      let name = prefix
      while (doc[`+${name}`] !== undefined) {
        index += 1
        name = `${prefix} ${index}`
      }
      const next = clone(doc)
      const color = PROFILE_COLORS[(Object.keys(next).length + index) % PROFILE_COLORS.length]
      if (type === 'FixedProfile') {
        next[`+${name}`] = {
          name,
          profileType: 'FixedProfile',
          color,
          fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 1080 },
          bypassList: [],
        }
      } else if (type === 'RuleListProfile') {
        const proxy = Object.entries(next)
          .find(([key, value]) => key.startsWith('+') && value !== null && typeof value === 'object'
            && value.profileType === 'FixedProfile')
        next[`+${name}`] = {
          name,
          profileType: 'RuleListProfile',
          color,
          format: 'AutoProxy',
          matchProfileName: proxy === undefined ? 'direct' : proxy[0].slice(1),
          defaultProfileName: 'direct',
          ruleList: '',
        }
      } else {
        next[`+${name}`] = { name, profileType: 'SwitchProfile', color, defaultProfileName: 'direct', rules: [] }
      }
      return { doc: next, name }
    }

    function nextColor(doc) {
      return PROFILE_COLORS[Object.keys(doc).length % PROFILE_COLORS.length]
    }

    function withProfile(doc, name, mutate) {
      const next = clone(doc)
      const profile = next[`+${name}`]
      if (profile === undefined) return doc
      mutate(profile)
      return next
    }

    function historyOf(trace) {
      return Array.isArray(trace) ? trace : []
    }

    function message(t, warning) {
      const params = warning.params ?? {}
      const key = WARNING_KEYS[warning.code]
      if (key !== undefined) {
        return t(key, {
          name: params.name ?? '',
          type: params.type ?? '',
          scheme: params.scheme ?? '',
          prop: params.prop ?? '',
          provider: params.provider ?? '',
          binding: params.binding ?? '',
          index: params.index ?? '',
          detail: params.detail ?? '',
          message: params.message ?? '',
        })
      }
      return warning.message ?? warning.code ?? ''
    }

    function traceText(t, step) {
      const key = TRACE_KEYS[step.code]
      if (step.step === 'provider') return t('traceProvider', { provider: step.provider, profile: step.profile })
      if (step.step === 'current') return t('traceCurrent', { profile: step.profile })
      if (step.step === 'rule') return t('traceRule', { profile: step.profile, target: step.target })
      if (step.step === 'list-rule') return t('traceListRule', { profile: step.profile, target: step.target })
      if (step.step === 'default') return t('traceDefault', { profile: step.profile, target: step.target })
      if (step.step === 'proxy') return t('traceProxy', { proxy: step.proxy, profile: step.profile })
      if (step.step === 'unsupported') {
        if (step.code === 'scheme') return t('traceUnsupportedScheme', { profile: step.profile, scheme: step.scheme })
        if (step.code === 'pac') return t('tracePac', { profile: step.profile })
        return t('traceUnsupportedType', { profile: step.profile, type: step.type })
      }
      if (step.step === 'direct') {
        if (key !== undefined) return t(key, { profile: step.profile ?? '', name: step.profile ?? '' })
        return t('traceDirect', { profile: step.profile ?? '' })
      }
      return step.code ?? step.step ?? ''
    }

    function conditionLabel(t, type) {
      return t(CONDITION_LABELS[type] ?? 'condHostWildcard')
    }

    function Button({ children, onClick, variant, disabled, title, small, type = 'button', ...rest }) {
      const className = ['omega-btn', variant, small ? 'small' : ''].filter(Boolean).join(' ')
      return h('button', { type, className, onClick, disabled, title, ...rest }, children)
    }

    function Field({ label, children, className }) {
      return h('label', { className: `omega-field ${className ?? ''}` },
        h('span', { className: 'omega-label' }, label),
        children)
    }

    function ProfileDot({ color }) {
      return h('span', { className: 'omega-dot', style: { background: color ?? '#aaaaaa' } })
    }

    function WarningBanner({ t, warnings, variant = 'warn', limit = 6 }) {
      if (!Array.isArray(warnings) || warnings.length === 0) return null
      return h('div', { className: `omega-banner ${variant}`, role: variant === 'error' ? 'alert' : 'status' },
        h('div', null, `${t('warnings')} (${warnings.length})`),
        h('ul', null, warnings.slice(0, limit).map((warning, index) => h('li', { key: index }, message(t, warning)))),
        warnings.length > limit ? h('div', null, `+${warnings.length - limit}…`) : null)
    }

    function ProfileHeader({ t, row, profile, onRename, onDelete, canDelete }) {
      const [name, setName] = useState(row.name)
      const [confirming, setConfirming] = useState(false)
      useEffect(() => { setName(row.name); setConfirming(false) }, [row.name])
      const typeKey = TYPE_KEYS[profile.profileType] ?? 'typeUnknown'
      return h('div', { className: 'omega-cardHead' },
        h(ProfileDot, { color: profile.color }),
        row.builtin
          ? h('div', { className: 'omega-cardTitle' }, row.name, h('span', { className: 'omega-badge', style: { marginLeft: 8 } }, t('builtin')))
          : h('input', {
              className: 'omega-input',
              style: { maxWidth: 240 },
              value: name,
              'aria-label': t('rename'),
              onChange: event => setName(event.target.value),
              onBlur: () => {
                const next = name.trim()
                if (next === '' || next === row.name) { setName(row.name); return }
                const done = onRename(row.name, next)
                if (!done) setName(row.name)
              },
            }),
        h('span', { className: 'omega-badge' }, t(typeKey)),
        profile.profileType === 'FixedProfile' && profile.fallbackProxy?.scheme && profile.fallbackProxy.scheme !== 'http' && profile.fallbackProxy.scheme !== 'https'
          ? h('span', { className: 'omega-badge warn' }, profile.fallbackProxy.scheme.toUpperCase())
          : null,
        canDelete ? h(Button, {
          variant: confirming ? 'danger' : undefined,
          small: true,
          onClick: () => {
            if (confirming) { onDelete(row.name); setConfirming(false) } else setConfirming(true)
          },
          onBlur: () => setConfirming(false),
        }, confirming ? t('confirmDelete') : t('delete')) : null)
    }

    function FixedProfileEditor({ t, doc, row, update }) {
      const profile = row.profile
      const proxy = profile.proxyForHttps ?? profile.proxyForHttp ?? profile.fallbackProxy ?? {}
      const perScheme = profile.proxyForHttp !== undefined || profile.proxyForHttps !== undefined
      const auth = profile.auth?.all ?? profile.auth?.proxyForHttps ?? profile.auth?.proxyForHttp ?? {}
      const bypassSource = (profile.bypassList ?? [])
        .filter(condition => condition?.conditionType === 'BypassCondition')
        .map(condition => condition.pattern ?? '')
        .join('\n')
      const [bypassDraft, setBypassDraft] = useState(bypassSource)
      useEffect(() => { setBypassDraft(bypassSource) }, [row.name])
      const applyProxy = (patch) => update(doc, (draft) => {
        const target = draft[`+${row.name}`]
        const base = target.proxyForHttps ?? target.proxyForHttp ?? target.fallbackProxy ?? {}
        const next = { ...base, ...patch }
        target.fallbackProxy = { ...next }
        if (target.proxyForHttp !== undefined) target.proxyForHttp = { ...next }
        if (target.proxyForHttps !== undefined) target.proxyForHttps = { ...next }
      })
      const applyAuth = (patch) => update(doc, (draft) => {
        const target = draft[`+${row.name}`]
        const base = target.auth?.all ?? target.auth?.proxyForHttps ?? target.auth?.proxyForHttp ?? {}
        const next = { ...base, ...patch }
        if (next.username === '' && (next.password ?? '') === '') {
          delete target.auth
          return
        }
        const auth = { ...(target.auth ?? {}), all: next }
        if (target.auth?.proxyForHttp !== undefined) auth.proxyForHttp = { ...next }
        if (target.auth?.proxyForHttps !== undefined) auth.proxyForHttps = { ...next }
        target.auth = auth
      })
      const commitBypass = () => update(doc, (draft) => {
        const target = draft[`+${row.name}`]
        const others = (target.bypassList ?? []).filter(condition => condition?.conditionType !== 'BypassCondition')
        const patterns = bypassDraft.split('\n').map(line => line.trim()).filter(Boolean)
        target.bypassList = [
          ...patterns.map(pattern => ({ conditionType: 'BypassCondition', pattern })),
          ...others,
        ]
      })
      return h('div', { className: 'omega-card' },
        h('div', { className: 'omega-cardHead' },
          h('span', { className: 'omega-dot', style: { background: profile.color } }),
          h('span', { className: 'omega-cardTitle' }, t('proxyServer')),
          h('span', { className: 'omega-badge' }, t('typeProxy'))),
        (proxy.scheme !== undefined && proxy.scheme !== 'http' && proxy.scheme !== 'https')
          ? h('p', { className: 'omega-muted' }, t('socksWarning'))
          : null,
        perScheme
          ? h('div', { className: 'omega-split' },
              h('p', { className: 'omega-muted omega-grow' }, t('perSchemeNote')),
              h(Button, {
                small: true,
                onClick: () => update(doc, (draft) => {
                  delete draft[`+${row.name}`].proxyForHttp
                  delete draft[`+${row.name}`].proxyForHttps
                }),
              }, t('collapseSchemes')))
          : null,
        h('div', { className: 'omega-row' },
          h(Field, { label: t('protocol'), className: 'omega-col-3' },
            h('select', {
              className: 'omega-select', value: proxy.scheme ?? 'http',
              onChange: event => applyProxy({ scheme: event.target.value }),
            }, [...new Set(['http', 'https', ...(proxy.scheme === undefined ? [] : [proxy.scheme])])]
              .map(scheme => h('option', { key: scheme, value: scheme }, scheme.toUpperCase())))),
          h(Field, { label: t('host'), className: 'omega-col-5' },
            h('input', {
              className: 'omega-input', value: proxy.host ?? '', placeholder: '127.0.0.1',
              onChange: event => applyProxy({ host: event.target.value.trim() }),
            })),
          h(Field, { label: t('port'), className: 'omega-col-3' },
            h('input', {
              className: 'omega-input', type: 'number', min: 1, max: 65535, value: proxy.port ?? 1080,
              onChange: event => applyProxy({ port: event.target.value === '' ? 0 : Number(event.target.value) }),
            }))),
        h('div', { className: 'omega-row' },
          h(Field, { label: t('username'), className: 'omega-col-6' },
            h('input', {
              className: 'omega-input', value: auth.username ?? '', autoComplete: 'off',
              onChange: event => applyAuth({ username: event.target.value }),
            })),
          h(Field, { label: t('password'), className: 'omega-col-6' },
            h('input', {
              className: 'omega-input', type: 'password', value: auth.password ?? '', autoComplete: 'new-password',
              onChange: event => applyAuth({ password: event.target.value }),
            }))),
        h(Field, { label: t('bypass') },
          h('textarea', {
            className: 'omega-textarea', rows: 4, value: bypassDraft,
            onChange: event => setBypassDraft(event.target.value),
            onBlur: commitBypass,
          }),
          h('span', { className: 'omega-muted' }, t('bypassHint'))))
    }

    function ruleProblem(t, rule) {
      const condition = rule?.condition
      if (condition === null || typeof condition !== 'object') return t('invalidRule')
      const type = condition.conditionType
      if (type === 'TrueCondition' || type === 'FalseCondition') return ''
      if (type === 'IpCondition') return String(condition.ip ?? '').trim() === '' ? t('invalidRule') : ''
      const pattern = String(condition.pattern ?? '')
      if (pattern === '') return t('invalidRule')
      if (type === 'HostRegexCondition' || type === 'UrlRegexCondition') {
        try {
          new RegExp(pattern.replace(/^\//, '').replace(/\/$/, ''))
        } catch {
          return t('invalidRegex')
        }
      }
      return ''
    }

    function conditionEditor({ t, condition, onChange, invalid }) {
      const type = condition.conditionType ?? 'HostWildcardCondition'
      const needsPattern = type !== 'TrueCondition' && type !== 'FalseCondition' && type !== 'IpCondition'
      return h(React.Fragment, null,
        h('select', {
          className: `omega-select ${invalid ? 'invalid' : ''}`, value: type,
          'aria-label': t('condition'),
          onChange: (event) => {
            const nextType = event.target.value
            if (nextType === 'IpCondition') onChange({ conditionType: nextType, ip: '10.0.0.0', prefixLength: 8 })
            else if (nextType === 'TrueCondition' || nextType === 'FalseCondition') onChange({ conditionType: nextType })
            else onChange({ conditionType: nextType, pattern: condition.pattern ?? '' })
          },
        }, Object.keys(CONDITION_LABELS).map(key => h('option', { key, value: key }, conditionLabel(t, key)))),
        type === 'IpCondition'
          ? h('span', { className: 'omega-ip' },
              h('input', {
                className: `omega-input ${invalid ? 'invalid' : ''}`, value: condition.ip ?? '', 'aria-label': 'IP',
                onChange: event => onChange({ ...condition, ip: event.target.value }),
              }),
              h('input', {
                className: `omega-input ${invalid ? 'invalid' : ''}`, type: 'number', min: 0, max: 128, style: { maxWidth: 70 },
                value: condition.prefixLength ?? 32, 'aria-label': 'CIDR',
                onChange: event => onChange({ ...condition, prefixLength: Number(event.target.value) }),
              }))
          : needsPattern
            ? h('input', {
                className: `omega-input ${invalid ? 'invalid' : ''}`, value: condition.pattern ?? '',
                placeholder: type === 'HostWildcardCondition' ? '*.example.com' : type === 'HostRegexCondition' || type === 'UrlRegexCondition' ? '^api\\.' : '',
                'aria-label': t('pattern'),
                onChange: event => onChange({ ...condition, pattern: event.target.value }),
              })
            : h('span', { className: 'omega-muted' }, type === 'TrueCondition' ? '✓' : '—'))
    }

    function SwitchProfileEditor({ t, doc, row, update, setNotice }) {
      const profile = row.profile
      const rules = Array.isArray(profile.rules) ? profile.rules : []
      const names = allProfileNames(doc)
      const [quickHost, setQuickHost] = useState('')
      const setRules = (mutate) => update(doc, (draft) => {
        const target = draft[`+${row.name}`]
        if (!Array.isArray(target.rules)) target.rules = []
        mutate(target.rules, target)
      })
      return h('div', { className: 'omega-card' },
        h('div', { className: 'omega-cardHead' },
          h('span', { className: 'omega-dot', style: { background: profile.color } }),
          h('span', { className: 'omega-cardTitle' }, t('typeSwitch')),
          h('span', { className: 'omega-badge' }, t('ruleCount', { count: rules.length }))),
        h('div', { className: 'omega-split' },
          h(Field, { label: t('defaultProfile'), className: 'omega-grow' },
            h('select', {
              className: 'omega-select', value: profile.defaultProfileName ?? 'direct',
              onChange: event => update(doc, (draft) => { draft[`+${row.name}`].defaultProfileName = event.target.value }),
            }, names.map(name => h('option', { key: name, value: name }, name)))),
          h('span', { className: 'omega-muted' }, t('addRuleHint'))),
        rules.length === 0
          ? h('p', { className: 'omega-muted' }, t('noRules'))
          : h('div', { className: 'omega-rules' }, rules.map((rule, index) => {
              const problem = ruleProblem(t, rule)
              return h('div', { className: `omega-rule ${problem === '' ? '' : 'invalid'}`, key: index },
                h('div', { className: 'omega-ruleCondition' }, conditionEditor({
                  t,
                  condition: rule.condition ?? { conditionType: 'HostWildcardCondition', pattern: '' },
                  invalid: problem !== '',
                  onChange: (condition) => setRules(list => { list[index] = { ...list[index], condition } }),
                })),
                h('div', { className: 'omega-ruleFoot' },
                  h('select', {
                    className: 'omega-select omega-ruleTarget', value: rule.profileName ?? 'direct', 'aria-label': t('target'),
                    onChange: event => setRules(list => { list[index] = { ...list[index], profileName: event.target.value } }),
                  }, names.map(name => h('option', { key: name, value: name }, name))),
                  h('div', { className: 'omega-ruleActions' },
                    h(Button, {
                      small: true, disabled: index === 0, title: t('up'),
                      onClick: () => setRules((list) => { const [item] = list.splice(index, 1); list.splice(index - 1, 0, item) }),
                    }, '↑'),
                    h(Button, {
                      small: true, disabled: index === rules.length - 1, title: t('down'),
                      onClick: () => setRules((list) => { const [item] = list.splice(index, 1); list.splice(index + 1, 0, item) }),
                    }, '↓'),
                    h(Button, {
                      small: true, variant: 'danger', title: t('delete'),
                      onClick: () => setRules(list => { list.splice(index, 1) }),
                    }, '×'))),
                problem === '' ? null : h('span', { className: 'omega-ruleError' }, problem))
            })),
        h('div', { className: 'omega-split' },
          h(Field, { label: t('manualRule'), className: 'omega-grow' },
            h('input', {
              className: 'omega-input', value: quickHost, placeholder: t('quickHost'),
              onChange: event => setQuickHost(event.target.value),
            })),
          h(Button, {
            small: true,
            disabled: quickHost.trim() === '',
            onClick: () => {
              setRules((list) => {
                list.push({
                  condition: { conditionType: 'HostWildcardCondition', pattern: quickHost.trim() },
                  profileName: names.find(name => name !== 'direct' && name !== 'system' && doc[`+${name}`]?.profileType !== 'DirectProfile') ?? 'direct',
                })
              })
              setQuickHost('')
            },
          }, t('add')),
          h(Button, {
            small: true,
            onClick: () => setRules(list => {
              list.push({ condition: { conditionType: 'HostWildcardCondition', pattern: '' }, profileName: 'direct' })
            }),
          }, t('addRule'))))
    }

    function RuleListProfileEditor({ t, doc, row, update, setNotice }) {
      const profile = row.profile
      const names = allProfileNames(doc)
      const setProfile = (patch) => update(doc, (draft) => { Object.assign(draft[`+${row.name}`], patch) })
      const setIntervalMinutes = (value) => update(doc, (draft) => { draft['-downloadInterval'] = value })
      const [sourceDraft, setSourceDraft] = useState(profile.sourceUrl ?? '')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      useEffect(() => { setSourceDraft(profile.sourceUrl ?? ''); setError('') }, [row.name])
      const hasSource = typeof profile.sourceUrl === 'string' && profile.sourceUrl.trim() !== ''
      const lines = String(profile.ruleList ?? '').split('\n').filter((line) => {
        const value = line.trim()
        return value !== '' && value[0] !== ';' && value[0] !== '!' && value[0] !== '[' && !value.startsWith('@note')
      }).length
      const lastUpdate = typeof profile.lastUpdate === 'string' && profile.lastUpdate !== ''
        ? (() => { try { return new Date(profile.lastUpdate).toLocaleString() } catch { return profile.lastUpdate } })()
        : t('neverUpdated')
      const updateFromUrl = async () => {
        const target = sourceDraft.trim() || profile.sourceUrl || ''
        if (target === '') { setError(t('sourceRequired')); return }
        setBusy(true)
        setError('')
        try {
          const result = await api('/rulelist/fetch', { method: 'POST', body: JSON.stringify({ url: target }) })
          setSourceDraft(result.url)
          setProfile({ sourceUrl: result.url, ruleList: result.content, lastUpdate: result.lastUpdate })
          const count = String(result.content).split('\n').filter(line => line.trim() !== '').length
          setNotice?.(t('updateSuccess', { count, bytes: result.bytes }))
        } catch (failure) {
          setError(failure.message)
        } finally {
          setBusy(false)
        }
      }
      const download = () => {
        const blob = new Blob([profile.ruleList ?? ''], { type: 'text/plain;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${row.name}.txt`
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      }
      const copy = async () => {
        try { await navigator.clipboard.writeText(profile.ruleList ?? ''); setNotice?.(t('copied')) } catch { setError(t('clipboardError')) }
      }
      return h('div', { className: 'omega-card' },
        h('div', { className: 'omega-cardHead' },
          h('span', { className: 'omega-dot', style: { background: profile.color } }),
          h('span', { className: 'omega-cardTitle' }, t('typeRuleList')),
          h('span', { className: 'omega-badge' }, t('ruleCount', { count: lines }))),
        h('div', { className: 'omega-row' },
          h(Field, { label: t('format'), className: 'omega-col-4' },
            h('select', {
              className: 'omega-select', value: profile.format ?? 'AutoProxy',
              onChange: event => setProfile({ format: event.target.value }),
            }, h('option', { value: 'AutoProxy' }, 'AutoProxy'), h('option', { value: 'Switchy' }, 'Switchy'))),
          h(Field, { label: t('matchProfile'), className: 'omega-col-4' },
            h('select', {
              className: 'omega-select', value: profile.matchProfileName ?? 'direct',
              onChange: event => setProfile({ matchProfileName: event.target.value }),
            }, names.map(name => h('option', { key: name, value: name }, name)))),
          h(Field, { label: t('defaultProfile'), className: 'omega-col-4' },
            h('select', {
              className: 'omega-select', value: profile.defaultProfileName ?? 'direct',
              onChange: event => setProfile({ defaultProfileName: event.target.value }),
            }, names.map(name => h('option', { key: name, value: name }, name))))),
        h('div', { className: 'omega-io' },
          h(Field, { label: t('ruleListUrl') },
            h('div', { className: 'omega-split' },
              h('input', {
                className: 'omega-input omega-grow', type: 'url', value: sourceDraft,
                placeholder: 'https://example.com/rules.txt',
                onChange: event => setSourceDraft(event.target.value),
                onBlur: () => setProfile({ sourceUrl: sourceDraft.trim() }),
              }),
              h(Button, { onClick: updateFromUrl, disabled: busy }, busy ? t('updating') : t('updateNow')),
              hasSource ? h(Button, { onClick: () => { setSourceDraft(''); setProfile({ sourceUrl: '' }) } }, t('clearSource')) : null)),
            h('span', { className: 'omega-muted' }, t('ruleListUrlHint')),
            h('span', { className: 'omega-muted' }, `${t('lastUpdated')}: ${lastUpdate}`),
          error !== '' ? h('div', { className: 'omega-banner error', role: 'alert' }, error) : null),
        h(Field, { label: t('ruleList') },
          h('textarea', {
            className: 'omega-textarea', rows: 10, value: profile.ruleList ?? '', readOnly: hasSource,
            placeholder: '||example.com\n*.example.net',
            onChange: event => setProfile({ ruleList: event.target.value }),
          }),
          h('span', { className: 'omega-muted' }, hasSource ? t('ruleListReadonly') : t('ruleListHint'))),
        h('div', { className: 'omega-split' },
          h(Button, { small: true, onClick: download, disabled: lines === 0 }, t('exportRuleList')),
          h(Button, { small: true, onClick: copy, disabled: lines === 0 }, t('copyRuleList')),
          h('span', { className: 'omega-muted omega-grow' }, t('publishHint'))),
        h('div', { className: 'omega-row' },
          h(Field, { label: t('autoUpdateInterval'), className: 'omega-col-4' },
            h('input', {
              className: 'omega-input', type: 'number', min: 0, step: 1,
              value: doc['-downloadInterval'] ?? 0,
              onChange: event => setIntervalMinutes(event.target.value === '' ? 0 : Math.max(0, Number(event.target.value))),
            })),
          h('span', { className: 'omega-muted omega-col-8' }, t('autoUpdateHint'))))
    }

    function UnsupportedProfileEditor({ t, row }) {
      return h('div', { className: 'omega-card' },
        h('div', { className: 'omega-cardHead' },
          h('span', { className: 'omega-dot', style: { background: row.profile.color } }),
          h('span', { className: 'omega-cardTitle' }, row.name),
          h('span', { className: 'omega-badge warn' }, row.profile.profileType ?? 'unknown')),
        h('p', { className: 'omega-muted' }, t('unsupported')))
    }

    function ProvidersPanel({ t, snapshot, doc, setDoc, refresh, markDirty }) {
      const extension = extensionOf(doc)
      const providers = snapshot.providers ?? []
      const names = allProfileNames(doc)
      const [editing, setEditing] = useState({})
      const [hostsDraft, setHostsDraft] = useState({})
      const updateExtension = (mutate) => {
        markDirty?.()
        setDoc((current) => {
          const next = clone(current)
          const ext = extensionOf(next)
          mutate(ext)
          setExtension(next, ext)
          return next
        })
      }
      return h('div', { className: 'omega-card' },
        h('div', { className: 'omega-cardHead' },
          h('span', { className: 'omega-cardTitle' }, t('providersTitle')),
          h(Button, { small: true, onClick: refresh }, t('refresh'))),
        h('p', { className: 'omega-muted' }, t('providersHint')),
        h('p', { className: 'omega-muted' }, t('bindHint')),
        providers.length === 0
          ? h('p', { className: 'omega-muted' }, t('noProviders'))
          : h('div', { className: 'omega-table' }, providers.map((provider) => {
              const override = Array.isArray(extension.providerHosts[provider.id]) && extension.providerHosts[provider.id].length > 0
                ? extension.providerHosts[provider.id]
                : undefined
              const detected = Array.isArray(provider.detectedHosts) ? provider.detectedHosts : (provider.hosts ?? [])
              const hosts = override ?? detected
              const binding = extension.providerBindings[provider.id] ?? ''
              const open = editing[provider.id] === true
              const draft = hostsDraft[provider.id] ?? (override ?? detected).join('\n')
              return h('div', { className: 'omega-provider', key: provider.id },
                h('div', { className: 'omega-providerHead' },
                  h('span', { className: 'omega-cardTitle' }, provider.name),
                  h('span', { className: 'omega-badge' }, provider.id),
                  h('span', { className: 'omega-badge' }, override !== undefined ? t('overridden') : t('detected'))),
                h('div', { className: 'omega-chips' },
                  hosts.length === 0
                    ? h('span', { className: 'omega-badge warn' }, t('hostsEmpty'))
                    : hosts.map(host => h('span', { className: 'omega-chip', key: host }, host))),
                h('div', { className: 'omega-split' },
                  h(Field, { label: t('target'), className: 'omega-grow' },
                    h('select', {
                      className: 'omega-select', value: binding,
                      onChange: (event) => {
                        const value = event.target.value
                        updateExtension((ext) => { ext.providerBindings[provider.id] = value })
                      },
                    }, h('option', { value: '' }, t('follow')), names.map(name => h('option', { key: name, value: name }, name)))),
                  h(Button, {
                    small: true,
                    onClick: () => setEditing({ ...editing, [provider.id]: !open }),
                  }, t('editHosts'))),
                open
                  ? h('div', { className: 'omega-split' },
                      h(Field, { label: t('hostsLabel'), className: 'omega-grow' },
                        h('textarea', {
                          className: 'omega-textarea', rows: 3, value: draft,
                          onChange: event => setHostsDraft({ ...hostsDraft, [provider.id]: event.target.value }),
                          onBlur: () => {
                            const list = String(hostsDraft[provider.id] ?? draft)
                              .split(/\s|,|;/)
                              .map(value => value.trim().toLowerCase())
                              .filter(Boolean)
                            updateExtension((ext) => {
                              if (list.length === 0) delete ext.providerHosts[provider.id]
                              else ext.providerHosts[provider.id] = [...new Set(list)]
                            })
                          },
                        }),
                        h('span', { className: 'omega-muted' }, t('hostsHint'))))
                  : null)
            })))
    }



    function TestPanel({ t, doc }) {
      const [url, setUrl] = useState('https://github.com/')
      const [result, setResult] = useState(null)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      useEffect(() => { setResult(null) }, [url, doc])
      const run = async () => {
        if (busy) return
        setBusy(true)
        setError('')
        try {
          setResult(await api('/resolve', { method: 'POST', body: JSON.stringify({ url, doc }) }))
        } catch (failure) {
          setError(failure.message)
          setResult(null)
        } finally {
          setBusy(false)
        }
      }
      const samples = ['https://github.com/', 'https://api.individual.githubcopilot.com/v1/models', 'https://api.deepseek.com/']
      const decision = result?.kind === 'proxy' ? t('resultProxy') : t('resultDirect')
      const via = result?.via === 'provider' ? t('viaProvider') : result?.via === 'loopback' ? t('viaLoopback') : t('viaCurrent')
      return h('div', { className: 'omega-card' },
        h('span', { className: 'omega-cardTitle' }, t('testerTitle')),
        h('p', { className: 'omega-muted' }, t('testerHint')),
        h('div', { className: 'omega-split' },
          h(Field, { label: t('testUrl'), className: 'omega-grow' },
            h('input', { className: 'omega-input', value: url, onChange: event => setUrl(event.target.value), onKeyDown: event => { if (event.key === 'Enter') run() } })),
          h(Button, { variant: 'primary', onClick: run, disabled: busy }, busy ? t('testing') : t('runTest'))),
        h('div', { className: 'omega-chips' }, samples.map(sample => h(Button, {
          key: sample, small: true, onClick: () => { setUrl(sample); setResult(null) },
        }, sample.replace('https://', '')))),
        error !== '' ? h('div', { className: 'omega-banner error' }, error) : null,
        result !== null
          ? h(React.Fragment, null,
              h('div', { className: 'omega-result' },
                h('strong', null, decision),
                result.kind === 'proxy' ? h('span', { className: 'omega-code' }, result.proxy?.uri) : null,
                h('span', { className: 'omega-badge' }, `${t('via')}: ${via}`),
                h('span', { className: `omega-badge ${result.draft ? 'warn' : 'ok'}` }, result.draft ? t('draftResult') : t('appliedResult'))),
              result.draft ? h('p', { className: 'omega-muted' }, t('draftHint')) : null,
              h('ol', { className: 'omega-trace' },
                historyOf(result.trace).map((step, index) => h('li', { key: index },
                  h('span', { className: 'step' }, `${index + 1}.`),
                  h('span', null, traceText(t, step))))))
          : null)
    }

    function ImportExportPanel({ t, snapshot, onImported, setNotice }) {
      const [preview, setPreview] = useState('')
      const [text, setText] = useState('')
      const [mode, setMode] = useState('replace')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [summary, setSummary] = useState(null)
      const fileRef = useRef(null)
      const refreshPreview = async () => {
        try {
          const response = await fetch(`${API}/export`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          setPreview(await response.text())
        } catch (failure) {
          setError(failure.message)
        }
      }
      useEffect(() => { void refreshPreview() }, [])
      const download = () => {
        const blob = new Blob([preview], { type: 'application/json;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `dsh-omega-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      }
      const copy = async () => {
        try { await navigator.clipboard.writeText(preview); setNotice(t('copied')) } catch { setError(t('clipboardError')) }
      }
      const runImport = async (content) => {
        setBusy(true)
        setError('')
        try {
          const result = await api('/import', {
            method: 'POST',
            body: JSON.stringify({ content, mode }),
          })
          setSummary(result.summary ?? null)
          setNotice(t('imported'))
          await onImported(result)
          setText('')
          await refreshPreview()
        } catch (failure) {
          setError(failure.message)
        } finally {
          setBusy(false)
        }
      }
      const chooseFile = (event) => {
        const file = event.target.files?.[0]
        if (file === undefined) return
        const reader = new FileReader()
        reader.onload = () => {
          setText(String(reader.result ?? ''))
          setError('')
          setNotice(t('fileLoaded'))
        }
        reader.readAsText(file)
        event.target.value = ''
      }
      return h('div', { className: 'omega-card' },
        h('span', { className: 'omega-cardTitle' }, t('ioTitle')),
        h('p', { className: 'omega-muted' }, t('ioHint')),
        error !== '' ? h('div', { className: 'omega-banner error' }, error) : null,
        h('div', { className: 'omega-io' },
          h('div', { className: 'omega-split' },
            h('span', { className: 'omega-subhead' }, t('exportPreview')),
            h(Button, { small: true, onClick: refreshPreview }, t('refreshPreview')),
            h(Button, { small: true, onClick: download }, t('download')),
            h(Button, { small: true, onClick: copy }, t('copy'))),
          h('p', { className: 'omega-muted' }, t('exportSavedHint')),
          h('textarea', { className: 'omega-textarea', rows: 10, readOnly: true, value: preview })),
        h('div', { className: 'omega-io' },
          h('span', { className: 'omega-subhead' }, t('importTitle')),
          h('p', { className: 'omega-muted' }, t('importHint')),
          h('div', { className: 'omega-radio' },
            h('label', null, h('input', { type: 'radio', name: 'omega-import-mode', checked: mode === 'replace', onChange: () => setMode('replace') }), t('replace')),
            h('label', null, h('input', { type: 'radio', name: 'omega-import-mode', checked: mode === 'merge', onChange: () => setMode('merge') }), t('merge'))),
          h('div', { className: 'omega-split' },
            h(Button, { onClick: () => fileRef.current?.click(), disabled: busy }, t('chooseFile')),
            h('input', { ref: fileRef, type: 'file', accept: '.bak,.json,application/json,text/plain', style: { display: 'none' }, onChange: chooseFile }),
            h(Button, { variant: 'primary', disabled: busy || text.trim() === '', onClick: () => runImport(text) }, busy ? t('importing') : t('import'))),
          h(Field, { label: t('importText') },
            h('textarea', { className: 'omega-textarea', rows: 5, value: text, onChange: event => setText(event.target.value) })),
          summary !== null
            ? h('p', { className: 'omega-muted' },
                `${t('summary')}: ${summary.profiles} ${t('profilesCount')} · ${summary.rules} ${t('rulesCount')}`)
            : null))
    }

    function Page({ t }) {
      const [snapshot, setSnapshot] = useState(null)
      const [doc, setDoc] = useState(null)
      const [selection, setSelection] = useState({ kind: 'profile', name: '' })
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [busy, setBusy] = useState(false)

      useEffect(() => {
        let alive = true
        api('/state').then((data) => {
          if (!alive) return
          setSnapshot(data)
          setDoc(clone(data.doc))
          setSelection({ kind: 'profile', name: data.currentProfileName })
        }).catch((failure) => { if (alive) setError(failure.message) })
        return () => { alive = false }
      }, [])

      const dirty = useMemo(() => snapshot !== null && doc !== null && JSON.stringify(doc) !== JSON.stringify(snapshot.doc), [doc, snapshot])
      const names = useMemo(() => (doc === null ? [] : allProfileNames(doc)), [doc])
      const rows = useMemo(() => (doc === null ? [] : profileEntries(doc)), [doc])
      const extension = useMemo(() => (doc === null ? null : extensionOf(doc)), [doc])

      if (error !== '' && snapshot === null) {
        return h('div', { className: 'omega-page' }, h('style', null, CSS),
          h('div', { className: 'omega-banner error' }, t('error'), ': ', error),
          h(Button, { onClick: () => location.reload() }, t('retry')))
      }
      if (snapshot === null || doc === null) {
        return h('div', { className: 'omega-page' }, h('style', null, CSS), h('p', { className: 'omega-empty' }, t('loading')))
      }

      const updateProfile = (mutate) => {
        setDoc((current) => {
          const next = clone(current)
          mutate(next)
          return next
        })
        setNotice('')
      }
      const rename = (oldName, newName) => {
        if (newName === '') { setNotice(t('invalidName')); return false }
        if (names.includes(newName)) { setNotice(t('nameTaken')); return false }
        setNotice('')
        setDoc((current) => renameProfile(current, oldName, newName))
        if (selection.kind === 'profile' && selection.name === oldName) setSelection({ kind: 'profile', name: newName })
        return true
      }
      const remove = (name) => {
        setNotice('')
        setDoc((current) => deleteProfile(current, name))
        if (selection.kind === 'profile' && selection.name === name) setSelection({ kind: 'profile', name: 'direct' })
      }
      const create = (type) => {
        setNotice('')
        const result = addProfile(doc, type)
        setDoc(result.doc)
        setSelection({ kind: 'profile', name: result.name })
      }
      const setCurrent = (name) => {
        setNotice('')
        setDoc((current) => {
          const next = clone(current)
          const ext = extensionOf(next)
          ext.currentProfileName = name
          setExtension(next, ext)
          next['-startupProfileName'] = name
          return next
        })
      }
      const save = async () => {
        setBusy(true)
        setError('')
        setNotice('')
        try {
          const result = await api('/config', { method: 'POST', body: JSON.stringify({ doc }) })
          setSnapshot(result)
          setDoc(clone(result.doc))
          setNotice(t('saved'))
        } catch (failure) {
          setError(failure.message)
        } finally {
          setBusy(false)
        }
      }
      const refreshProviders = async () => {
        try {
          await api('/providers/refresh', { method: 'POST', body: JSON.stringify({}) })
          const data = await api('/state')
          setSnapshot(data)
        } catch (failure) {
          setError(failure.message)
        }
      }
      const onImported = async (result) => {
        setSnapshot(result)
        setDoc(clone(result.doc))
        setSelection({ kind: 'profile', name: result.currentProfileName })
      }

      const currentRow = rows.find(row => row.name === selection.name)
      const builtin = selection.name === 'direct' || selection.name === 'system'
      const profile = builtin
        ? { name: selection.name, profileType: selection.name === 'direct' ? 'DirectProfile' : 'SystemProfile', color: '#aaaaaa' }
        : currentRow?.profile

      const profileChip = (id, label, active, onClick, dot) => h('button', {
        key: id,
        type: 'button',
        className: `omega-profileChip ${active ? 'active' : ''}`,
        onClick,
        'aria-current': active ? 'true' : undefined,
      }, dot ?? null, h('span', { className: 'omega-profileChipName' }, label))

      const profileBar = h('div', { className: 'omega-profileBar', role: 'group', 'aria-label': t('profiles') },
        profileChip('direct', 'direct', selection.kind === 'profile' && selection.name === 'direct', () => setSelection({ kind: 'profile', name: 'direct' }), h(ProfileDot, { color: '#aaaaaa' })),
        profileChip('system', 'system', selection.kind === 'profile' && selection.name === 'system', () => setSelection({ kind: 'profile', name: 'system' }), h(ProfileDot, { color: 'var(--dsw-alias-label-tertiary)' })),
        rows.map(row => profileChip(`p-${row.name}`, row.name, selection.kind === 'profile' && selection.name === row.name, () => setSelection({ kind: 'profile', name: row.name }), h(ProfileDot, { color: row.profile.color }))),
        h('div', { className: 'omega-addRow' },
          h(Button, { small: true, onClick: () => create('FixedProfile') }, `+ ${t('addProxy')}`),
          h(Button, { small: true, onClick: () => create('SwitchProfile') }, `+ ${t('addSwitch')}`),
          h(Button, { small: true, onClick: () => create('RuleListProfile') }, `+ ${t('addRuleList')}`)))

      let profileContent
      if (profile === undefined || (!builtin && currentRow === undefined)) {
        profileContent = h('div', { className: 'omega-card' }, h('p', { className: 'omega-empty' }, t('noDoc')))
      } else if (builtin) {
        profileContent = h('div', { className: 'omega-card' },
          h('div', { className: 'omega-cardHead' },
            h(ProfileDot, { color: profile.color }),
            h('span', { className: 'omega-cardTitle' }, selection.name),
            h('span', { className: 'omega-badge' }, t(selection.name === 'direct' ? 'typeDirect' : 'typeSystem'))),
          h('p', { className: 'omega-muted' }, selection.name === 'direct' ? t('directNote') : t('systemNote')))
      } else if (profile.profileType === 'FixedProfile') {
        profileContent = h(React.Fragment, null,
          h('div', { className: 'omega-card' },
            h(ProfileHeader, {
              t, row: { name: selection.name, builtin: false }, profile,
              onRename: rename, onDelete: remove, canDelete: true,
            })),
          h(FixedProfileEditor, { t, doc, row: { name: selection.name, profile }, update: (_, mutate) => updateProfile(mutate) }))
      } else if (profile.profileType === 'SwitchProfile' || profile.profileType === 'VirtualProfile') {
        profileContent = h(React.Fragment, null,
          h('div', { className: 'omega-card' },
            h(ProfileHeader, {
              t, row: { name: selection.name, builtin: false }, profile,
              onRename: rename, onDelete: remove, canDelete: true,
            })),
          h(SwitchProfileEditor, { t, doc, row: { name: selection.name, profile }, update: (_, mutate) => updateProfile(mutate) }))
      } else if (profile.profileType === 'RuleListProfile') {
        profileContent = h(React.Fragment, null,
          h('div', { className: 'omega-card' },
            h(ProfileHeader, {
              t, row: { name: selection.name, builtin: false }, profile,
              onRename: rename, onDelete: remove, canDelete: true,
            })),
          h(RuleListProfileEditor, { t, doc, row: { name: selection.name, profile }, update: (_, mutate) => updateProfile(mutate), setNotice }))
      } else {
        profileContent = h(React.Fragment, null,
          h('div', { className: 'omega-card' },
            h(ProfileHeader, { t, row: { name: selection.name, builtin: false }, profile, onRename: rename, onDelete: remove, canDelete: true })),
          h(UnsupportedProfileEditor, { t, row: { name: selection.name, profile } }))
      }

      const activeTab = selection.kind === 'profile' ? 'profiles' : selection.kind
      const tabs = [
        { id: 'profiles', label: t('profiles') },
        { id: 'providers', label: t('providers') },
        { id: 'tester', label: t('tester') },
        { id: 'io', label: t('io') },
      ]
      const openTab = (id) => {
        if (id === 'profiles') {
          const name = selection.kind === 'profile' && selection.name !== ''
            ? selection.name
            : (extension.currentProfileName || 'direct')
          setSelection({ kind: 'profile', name })
          return
        }
        setSelection({ kind: id })
      }
      const tabBar = h('div', { className: 'omega-tabs', role: 'tablist', 'aria-label': t('title') },
        tabs.map(tab => h('button', {
          key: tab.id,
          type: 'button',
          role: 'tab',
          'aria-selected': activeTab === tab.id ? 'true' : 'false',
          className: `omega-tab ${activeTab === tab.id ? 'active' : ''}`,
          onClick: () => openTab(tab.id),
        }, tab.label)))

      const selectedWarnings = selection.kind === 'profile'
        ? snapshot.warnings.filter(warning => warning.params?.name === selection.name)
        : []

      let content
      if (activeTab === 'profiles') {
        const profileToolbar = selection.kind === 'profile'
          ? h('div', { className: 'omega-split' },
              h('span', { className: 'omega-muted omega-grow' }, `${t('current')}: ${extension.currentProfileName}`),
              extension.currentProfileName === selection.name
                ? h('span', { className: 'omega-badge ok' }, t('inUse'))
                : h(Button, { small: true, onClick: () => setCurrent(selection.name) }, t('useProfile')))
          : null
        content = h(React.Fragment, null,
          profileBar,
          profileToolbar,
          selectedWarnings.length > 0 ? h(WarningBanner, { t, warnings: selectedWarnings }) : null,
          profileContent)
      } else if (activeTab === 'providers') {
        content = h(ProvidersPanel, { t, snapshot, doc, setDoc, refresh: refreshProviders, markDirty: () => setNotice('') })
      } else if (activeTab === 'tester') {
        content = h(TestPanel, { t, doc })
      } else {
        content = h(ImportExportPanel, { t, snapshot, onImported, setNotice })
      }

      const summary = snapshot.summary ?? {}
      return h('div', { className: 'omega-page' },
        h('style', null, CSS),
        h('div', { className: 'omega-head' },
          h('div', { className: 'omega-headText' },
            h('h2', { className: 'omega-title' }, t('title')),
            h('p', { className: 'omega-intro' }, t('subtitle')),
            h('p', { className: 'omega-foot' },
              h('span', null, `${t('current')}: ${extension.currentProfileName}`),
              h('span', null, `${summary.profiles ?? 0} ${t('profilesCount')}`),
              h('span', null, `${summary.rules ?? 0} ${t('rulesCount')}`))),
          h('div', { className: 'omega-headActions' },
            h('label', { className: 'omega-current' },
              t('current'),
              h('select', {
                className: 'omega-select', value: extension.currentProfileName || 'direct',
                onChange: event => setCurrent(event.target.value),
              }, names.map(name => h('option', { key: name, value: name }, name)))),
            h(Button, { variant: 'primary', onClick: save, disabled: !dirty || busy }, busy ? t('saving') : t('save')),
            dirty ? h(Button, { onClick: () => { if (window.confirm(t('resetConfirm'))) setDoc(clone(snapshot.doc)) } }, t('reset')) : null)),
        error !== '' ? h('div', { className: 'omega-banner error', role: 'alert' }, t('error'), ': ', error) : null,
        dirty ? h('div', { className: 'omega-banner warn', role: 'status' }, t('dirty')) : null,
        notice !== '' ? h('div', { className: 'omega-banner ok', role: 'status' }, notice) : null,
        snapshot.warnings.length > 0 ? h(WarningBanner, { t, warnings: snapshot.warnings }) : null,
        tabBar,
        h('section', { className: 'omega-content', 'aria-label': t('title') }, content),
        h('div', { className: 'omega-foot' },
          h('span', null, `${t('file')}: `, h('span', { className: 'omega-code' }, snapshot.file ?? '')),
          h('span', null, `${t('version')} ${snapshot.version ?? ''}`),
          h('span', null, `${t('current')}: ${extension.currentProfileName}`)))
    }

    const Icon = ({ size = 16 }) => h('svg', {
      width: size, height: size, viewBox: '0 0 36 36', 'aria-hidden': true, focusable: false,
    }, h('rect', { x: 4, y: 4, width: 28, height: 28, rx: 8, fill: 'currentColor' }),
    h('path', { d: 'M11 14.5h13M20.5 11L24 14.5L20.5 18', fill: 'none', stroke: 'var(--dsw-alias-bg-layer-1)', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    h('path', { d: 'M25 21.5H12M15.5 18L12 21.5L15.5 25', fill: 'none', stroke: 'var(--dsw-alias-bg-layer-1)', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' }))

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('dsh-omega', { en: COPY.en, zh: COPY.zh }), 'dsh-omega: dictionaries')
        const t = ctx.locale.bind('dsh-omega')
        const page = () => h(Page, { t })
        ctx.slots.inject('settings.section', () => {
          let dispose = ctx.slots.register({
            name: 'settings.section', id: 'dsh-omega', order: 55, label: t('nav'),
          }, page)
          const off = ctx.on('locale/change', () => {
            dispose()
            dispose = ctx.slots.register({
              name: 'settings.section', id: 'dsh-omega', order: 55, label: t('nav'),
            }, page)
          })
          return () => { off(); dispose() }
        })
        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon', id: 'dsh-omega',
        }, props => h(Icon, { size: props?.size ?? 16 })))
      },
    }
  },
})
