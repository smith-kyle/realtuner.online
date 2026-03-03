import { spawn, ChildProcess } from 'child_process'

let ffplayProcess: ChildProcess | null = null

export function initFfplay(): void {
  if (ffplayProcess && !ffplayProcess.killed) return

  const startTime = Date.now()
  console.log(`[audio] Starting ffplay at ${startTime}`)

  ffplayProcess = spawn('ffplay', [
    '-fflags', 'nobuffer',
    '-analyzeduration', '0',
    '-probesize', '32',
    '-f', 's16le',       // 16-bit signed little-endian PCM
    '-ar', '44100',      // sample rate
    '-ch_layout', 'mono',
    '-nodisp',
    '-autoexit',
    'pipe:0',
  ])

  ffplayProcess.on('spawn', () => {
    console.log(`[audio] ffplay spawned in ${Date.now() - startTime}ms`)
  })

  ffplayProcess.stdin?.on('error', (error) => {
    if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
      console.error('[audio] ffplay stdin error:', error)
    }
  })

  ffplayProcess.stderr?.on('data', () => {
    // suppress ffplay info output
  })

  ffplayProcess.on('error', (error) => {
    console.error('[audio] ffplay process error:', error)
  })

  ffplayProcess.on('exit', (code) => {
    console.log(`[audio] ffplay exited with code: ${code}`)
    ffplayProcess = null
  })
}

export function writeToFfplay(buffer: Buffer): void {
  if (!ffplayProcess || ffplayProcess.killed) {
    initFfplay()
  }
  if (ffplayProcess?.stdin && !ffplayProcess.stdin.destroyed) {
    try {
      ffplayProcess.stdin.write(buffer)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
        console.error('[audio] Error writing to ffplay:', error)
      }
    }
  }
}

export function closeFfplay(): void {
  if (!ffplayProcess || ffplayProcess.killed) return
  console.log('[audio] Closing ffplay')
  if (ffplayProcess.stdin && !ffplayProcess.stdin.destroyed) {
    ffplayProcess.stdin.end()
  }
  const proc = ffplayProcess
  setTimeout(() => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM')
    }
  }, 100)
  ffplayProcess = null
}
