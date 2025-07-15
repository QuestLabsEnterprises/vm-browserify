import vm from '../vm-browserify.js'

export class VMStudio {
  constructor() {
    this.currentContext = {}
    this.executionHistory = []
    this.isExecuting = false
  }

  mount(selector) {
    this.container = document.querySelector(selector)
    this.render()
    this.bindEvents()
    this.initializeDefaultContext()
  }

  initializeDefaultContext() {
    this.currentContext = {
      console: {
        log: (...args) => this.addOutput('info', `Console: ${args.join(' ')}`),
        error: (...args) => this.addOutput('error', `Console Error: ${args.join(' ')}`),
        warn: (...args) => this.addOutput('info', `Console Warning: ${args.join(' ')}`)
      },
      Math: Math,
      Date: Date,
      JSON: JSON
    }
    this.updateContextDisplay()
  }

  render() {
    this.container.innerHTML = `
      <div class="vm-studio">
        <header class="header">
          <h1>VM Studio</h1>
          <p>Execute JavaScript code in isolated virtual machine contexts</p>
        </header>
        
        <div class="main-content">
          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">
                ${this.createIcon('code')}
                Code Editor
              </div>
            </div>
            <div class="panel-content">
              <div class="controls">
                <button class="btn btn-primary" id="execute-btn">
                  ${this.createIcon('play')}
                  Execute
                </button>
                <button class="btn btn-secondary" id="clear-code-btn">
                  ${this.createIcon('trash-2')}
                  Clear Code
                </button>
              </div>
              <div class="editor-container">
                <textarea 
                  class="simple-editor" 
                  id="code-editor" 
                  placeholder="// Enter your JavaScript code here
const greeting = 'Hello, VM World!';
const result = greeting.toUpperCase();
console.log(result);
result;"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">
                ${this.createIcon('terminal')}
                Output & Context
              </div>
              <button class="btn btn-secondary" id="clear-output-btn">
                ${this.createIcon('x')}
                Clear Output
              </button>
            </div>
            <div class="panel-content">
              <div class="output-container" id="output-container">
                <div class="output-item output-info fade-in">
                  <div class="output-timestamp">${new Date().toLocaleTimeString()}</div>
                  Welcome to VM Studio! Enter JavaScript code and click Execute to run it in an isolated context.
                </div>
              </div>
              <div class="context-display" id="context-display"></div>
            </div>
            <div class="status-bar">
              <span id="status-text">Ready</span>
              <span id="execution-count">Executions: 0</span>
            </div>
          </div>
        </div>
        
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">
              ${this.createIcon('settings')}
              Context Manager
            </div>
            <div>
              <button class="btn btn-secondary" id="reset-context-btn">
                ${this.createIcon('refresh-cw')}
                Reset Context
              </button>
              <button class="btn btn-secondary" id="add-context-btn">
                ${this.createIcon('plus')}
                Add Variable
              </button>
            </div>
          </div>
          <div class="panel-content">
            <textarea 
              class="simple-editor context-editor" 
              id="context-editor" 
              placeholder="// Define context variables (JSON format)
{
  &quot;myVariable&quot;: 42,
  &quot;myArray&quot;: [1, 2, 3],
  &quot;myObject&quot;: { &quot;key&quot;: &quot;value&quot; }
}"
            ></textarea>
            <div class="controls">
              <button class="btn btn-primary" id="update-context-btn">
                ${this.createIcon('save')}
                Update Context
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  createIcon(name) {
    const icons = {
      'code': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
      'play': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 12l4-4 4 4-4 4-4-4z"/></svg>',
      'terminal': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
      'settings': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
      'trash-2': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
      'x': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
      'refresh-cw': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M1 4v6h6M23 20v-6h-6"/><path stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
      'plus': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>',
      'save': '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3-3-3m3-3v12"/></svg>'
    }
    return icons[name] || ''
  }

  bindEvents() {
    // Execute button
    document.getElementById('execute-btn').addEventListener('click', () => {
      this.executeCode()
    })

    // Clear code button
    document.getElementById('clear-code-btn').addEventListener('click', () => {
      document.getElementById('code-editor').value = ''
    })

    // Clear output button
    document.getElementById('clear-output-btn').addEventListener('click', () => {
      this.clearOutput()
    })

    // Reset context button
    document.getElementById('reset-context-btn').addEventListener('click', () => {
      this.resetContext()
    })

    // Update context button
    document.getElementById('update-context-btn').addEventListener('click', () => {
      this.updateContext()
    })

    // Add context button
    document.getElementById('add-context-btn').addEventListener('click', () => {
      this.addContextVariable()
    })

    // Keyboard shortcuts
    document.getElementById('code-editor').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        this.executeCode()
      }
    })
  }

  async executeCode() {
    if (this.isExecuting) return

    const codeEditor = document.getElementById('code-editor')
    const executeBtn = document.getElementById('execute-btn')
    const statusText = document.getElementById('status-text')
    const executionCount = document.getElementById('execution-count')

    const code = codeEditor.value.trim()
    if (!code) {
      this.addOutput('error', 'No code to execute')
      return
    }

    this.isExecuting = true
    executeBtn.disabled = true
    executeBtn.innerHTML = `<div class="loading"></div> Executing...`
    statusText.textContent = 'Executing...'

    try {
      // Create a copy of the current context for execution
      const executionContext = { ...this.currentContext }
      
      // Execute the code using vm-browserify
      const result = vm.runInNewContext(code, executionContext)
      
      // Update the current context with any changes
      this.currentContext = executionContext
      
      // Add successful execution to output
      this.addOutput('success', `Result: ${this.formatValue(result)}`)
      
      // Update execution history
      this.executionHistory.push({
        code,
        result,
        timestamp: new Date(),
        success: true
      })

      // Update context display
      this.updateContextDisplay()
      
      statusText.textContent = 'Execution completed'
      
    } catch (error) {
      this.addOutput('error', `Error: ${error.message}`)
      
      this.executionHistory.push({
        code,
        error: error.message,
        timestamp: new Date(),
        success: false
      })
      
      statusText.textContent = 'Execution failed'
    } finally {
      this.isExecuting = false
      executeBtn.disabled = false
      executeBtn.innerHTML = `${this.createIcon('play')} Execute`
      
      // Update execution counter
      executionCount.textContent = `Executions: ${this.executionHistory.length}`
      
      // Reset status after 3 seconds
      setTimeout(() => {
        statusText.textContent = 'Ready'
      }, 3000)
    }
  }

  addOutput(type, message) {
    const outputContainer = document.getElementById('output-container')
    const outputItem = document.createElement('div')
    outputItem.className = `output-item output-${type} fade-in`
    
    const timestamp = new Date().toLocaleTimeString()
    outputItem.innerHTML = `
      <div class="output-timestamp">${timestamp}</div>
      ${message}
    `
    
    outputContainer.appendChild(outputItem)
    outputContainer.scrollTop = outputContainer.scrollHeight
  }

  clearOutput() {
    const outputContainer = document.getElementById('output-container')
    outputContainer.innerHTML = `
      <div class="output-item output-info fade-in">
        <div class="output-timestamp">${new Date().toLocaleTimeString()}</div>
        Output cleared. Ready for new executions.
      </div>
    `
  }

  resetContext() {
    this.initializeDefaultContext()
    document.getElementById('context-editor').value = ''
    this.addOutput('info', 'Context reset to default state')
  }

  updateContext() {
    const contextEditor = document.getElementById('context-editor')
    const contextJson = contextEditor.value.trim()
    
    if (!contextJson) {
      this.addOutput('error', 'No context data provided')
      return
    }

    try {
      const newContext = JSON.parse(contextJson)
      
      // Merge with existing context (preserve console and built-ins)
      this.currentContext = {
        ...this.currentContext,
        ...newContext
      }
      
      this.updateContextDisplay()
      this.addOutput('success', 'Context updated successfully')
      
    } catch (error) {
      this.addOutput('error', `Invalid JSON: ${error.message}`)
    }
  }

  addContextVariable() {
    const varName = prompt('Variable name:')
    if (!varName) return
    
    const varValue = prompt('Variable value (will be parsed as JSON):')
    if (varValue === null) return
    
    try {
      const parsedValue = varValue === '' ? '' : JSON.parse(varValue)
      this.currentContext[varName] = parsedValue
      this.updateContextDisplay()
      this.addOutput('success', `Added variable: ${varName} = ${this.formatValue(parsedValue)}`)
    } catch (error) {
      // If JSON parsing fails, treat as string
      this.currentContext[varName] = varValue
      this.updateContextDisplay()
      this.addOutput('success', `Added variable: ${varName} = "${varValue}"`)
    }
  }

  updateContextDisplay() {
    const contextDisplay = document.getElementById('context-display')
    const displayContext = { ...this.currentContext }
    
    // Remove console object for cleaner display
    delete displayContext.console
    
    contextDisplay.textContent = JSON.stringify(displayContext, null, 2)
  }

  formatValue(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }
}