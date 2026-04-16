import { Layer, ManagedRuntime } from "effect"
import { memoMap } from "./run-service"

import { FileWatcher } from "@/file/watcher"
import { Format } from "@/format"

export const BootstrapLayer = Layer.mergeAll(Format.defaultLayer, FileWatcher.defaultLayer)

export const BootstrapRuntime = ManagedRuntime.make(BootstrapLayer, { memoMap })
