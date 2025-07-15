import './style.css'
import { VMStudio } from './components/VMStudio.js'

document.querySelector('#app').innerHTML = `
  <div id="vm-studio"></div>
`

const vmStudio = new VMStudio()
vmStudio.mount('#vm-studio')