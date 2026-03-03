import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'tuner-data.json')

export function loadTotalTunes(): number {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
      return typeof data.totalTunes === 'number' ? data.totalTunes : 0
    }
  } catch (error) {
    console.error('[persistence] Error loading:', error)
  }
  return 0
}

export function saveTotalTunes(totalTunes: number): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ totalTunes }, null, 2))
  } catch (error) {
    console.error('[persistence] Error saving:', error)
  }
}
