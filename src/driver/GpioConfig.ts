import { spawnSync, execSync } from 'child_process'
import * as fs from 'fs'

type GpioConfig = {
  interrupt: number
  fault: number
  status: number
  mostStatus: number
  reset: number
}

const getGpioBase = (): number => {
  // Check for gpiochip with base > 0 (RPi4 kernel 6.6+ uses base 512)
  try {
    const chips = fs.readdirSync('/sys/class/gpio/')
      .filter(f => f.startsWith('gpiochip'))
      .map(f => parseInt(fs.readFileSync('/sys/class/gpio/' + f + '/base', 'utf8').trim()))
      .filter(b => !isNaN(b))
      .sort((a, b) => a - b)
    return chips.length > 0 ? chips[0] : 0
  } catch {
    return 0
  }
}

export const getPiGpioConfig = (): GpioConfig => {
  const piCheckResult = spawnSync('cat', [
    '/sys/firmware/devicetree/base/model',
  ])
  const isPi5 = piCheckResult.stdout.toString().includes('Pi 5')

  if (isPi5) {
    return {
      interrupt: 576,
      fault: 577,
      status: 587,
      mostStatus: 597,
      reset: 588,
    }
  }

  const base = getGpioBase()
  return {
    interrupt: base + 5,
    fault: base + 6,
    status: base + 16,
    mostStatus: base + 26,
    reset: base + 17,
  }
}
