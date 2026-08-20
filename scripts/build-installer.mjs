import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const outputFlagIndex = args.indexOf('--output')
const outputPath = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : undefined

const buildDir = resolve(process.cwd(), 'build')
const sourceIconPath = resolve(process.cwd(), 'resources', 'icon.png')
const stagedIconPath = join(buildDir, 'icon.png')
const sourceIcoPath = resolve(process.cwd(), 'resources', 'icon.ico')
const stagedIcoPath = join(buildDir, 'icon.ico')
const rceditSourceDir = resolve(process.cwd(), 'node_modules', 'rcedit', 'bin')
const rceditStageDir = join(buildDir, 'rcedit-bin')

mkdirSync(buildDir, { recursive: true })
copyFileSync(sourceIconPath, stagedIconPath)
copyFileSync(sourceIcoPath, stagedIcoPath)

mkdirSync(rceditStageDir, { recursive: true })
copyFileSync(join(rceditSourceDir, 'rcedit-x64.exe'), join(rceditStageDir, 'rcedit-x64.exe'))
copyFileSync(join(rceditSourceDir, 'rcedit-x64.exe'), join(rceditStageDir, 'rcedit-x86.exe'))

process.env.ELECTRON_BUILDER_RCEDIT_PATH = rceditStageDir

execSync('npm run build:win', { stdio: 'inherit' })

const distDir = resolve(process.cwd(), 'dist')
const installerName = readdirSync(distDir).find((fileName) => fileName.endsWith('-setup.exe'))

if (!installerName) {
  throw new Error(`Could not find a Windows installer in ${distDir}`)
}

if (!outputPath) {
  console.log(`Installer created at ${join(distDir, installerName)}`)
  process.exit(0)
}

const resolvedOutputPath = resolve(process.cwd(), outputPath)
const outputIsFile = extname(resolvedOutputPath).toLowerCase() === '.exe'
const finalOutputPath = outputIsFile ? resolvedOutputPath : join(resolvedOutputPath, installerName)

mkdirSync(dirname(finalOutputPath), { recursive: true })
copyFileSync(join(distDir, installerName), finalOutputPath)

if (!existsSync(finalOutputPath)) {
  throw new Error(`Failed to copy installer to ${finalOutputPath}`)
}

console.log(`Installer copied to ${finalOutputPath}`)
