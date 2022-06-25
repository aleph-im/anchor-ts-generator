import { PathLike } from 'fs'
import path from 'path'

export class Paths {
  constructor(readonly root: PathLike, readonly project: string) {}

  get rootDir() {
    return this.root.toString()
  }

  get idlDir() {
    return path.join(this.rootDir.toString(), 'idl')
  }
  idlFile(name: string) {
    return path.join(this.idlDir, `${name}.json`)
  }

  get outputDir() {
    return path.join(this.rootDir.toString(), 'output')
  }

  get projectDir() {
    return path.join(this.outputDir.toString(), this.project)
  }

  get indexerDir() {
    return path.join(this.projectDir.toString(), 'indexer')
  }
  indexerFile(name: string) {
    return path.join(this.indexerDir, name)
  }

  get srcDir() {
    return path.join(this.indexerDir.toString(), 'src')
  }
  srcFile(name: string) {
    return path.join(this.srcDir, `${name}.ts`)
  }

  get dalDir() {
    return path.join(this.srcDir.toString(), 'dal')
  }
  get relDalDir() {
    return path.relative(process.cwd(), this.dalDir)
  }
  dalFile(name: string) {
    return path.join(this.dalDir, `${name}.ts`)
  }

  get domainDir() {
    return path.join(this.srcDir.toString(), 'domain')
  }
  get relDomainDir() {
    return path.relative(process.cwd(), this.domainDir)
  }
  domainFile(name: string) {
    return path.join(this.domainDir, `${name}.ts`)
  }

  get graphqlDir() {
    return path.join(this.srcDir.toString(), 'graphql')
  }
  get relGraphqlDir() {
    return path.relative(process.cwd(), this.graphqlDir)
  }
  graphqlFile(name: string) {
    return path.join(this.graphqlDir, `${name}.ts`)
  }
  get graphSchemaDir() {
    return path.join(this.graphqlDir.toString(), 'schema')
  }


  get indexersDir() {
    return path.join(this.srcDir.toString(), 'indexers')
  }
  get relIndexersDir() {
    return path.relative(process.cwd(), this.indexersDir)
  }
  indexersFile(name: string) {
    return path.join(this.indexersDir, `${name}.ts`)
  }

  get layaoutsDir() {
    return path.join(this.srcDir.toString(), 'layouts')
  }
  get relLayaoutsDir() {
    return path.relative(process.cwd(), this.layaoutsDir)
  }
  layoutsFile(name: string) {
    return path.join(this.layaoutsDir, `${name}.ts`)
  }

  get tsDir() {
    return path.join(this.layaoutsDir.toString(), 'ts')
  }
  tsFile(name: string) {
    return path.join(this.tsDir, `${name}.ts`)
  }

  get tsSolitaDir() {
    return path.join(this.layaoutsDir.toString(), 'solita')
  }

  get parsersDir() {
    return path.join(this.srcDir.toString(), 'parsers')
  }
  get relParsersDir() {
    return path.relative(process.cwd(), this.parsersDir)
  }
  parsersFile(name: string) {
    return path.join(this.parsersDir, `${name}.ts`)
  }

  get utilsDir() {
    return path.join(this.srcDir.toString(), 'utils')
  }
  get relUtilsDir() {
    return path.relative(process.cwd(), this.utilsDir)
  }
  utilsFile(name: string) {
    return path.join(this.utilsDir, `${name}.ts`)
  }
}
