import { createHDPClient } from "@hdp/sdk/v2"
import type { GlobalEvent, HDPClient } from "@hdp/sdk/v2"
import { createSimpleContext } from "./helper"
import { createGlobalEmitter } from "@solid-primitives/event-bus"
import { batch, onCleanup, onMount, createSignal, createEffect } from "solid-js"

export type EventSource = {
  subscribe: (handler: (event: GlobalEvent) => void) => Promise<() => void>
}

export const { use: useSDK, provider: SDKProvider } = createSimpleContext({
  name: "SDK",
  init: (props: {
    url: string
    directory?: string
    fetch?: typeof fetch
    headers?: RequestInit["headers"]
    events?: EventSource
  }) => {
    const abort = new AbortController()
    let sse: AbortController | undefined
    const [directory, setDirectory] = createSignal(props.directory)

    function createSDK(dir?: string) {
      return createHDPClient({
        baseUrl: props.url,
        signal: abort.signal,
        directory: dir,
        fetch: props.fetch,
        headers: props.headers,
      })
    }

    const [sdk, setSDK] = createSignal<HDPClient>(createSDK(directory()))

    const emitter = createGlobalEmitter<{
      event: GlobalEvent
    }>()

    let queue: GlobalEvent[] = []
    let timer: Timer | undefined
    let last = 0

    const flush = () => {
      if (queue.length === 0) return
      const events = queue
      queue = []
      timer = undefined
      last = Date.now()
      batch(() => {
        for (const event of events) {
          emitter.emit("event", event)
        }
      })
    }

    const handleEvent = (event: GlobalEvent) => {
      queue.push(event)
      const elapsed = Date.now() - last
      if (timer) return
      if (elapsed < 16) {
        timer = setTimeout(flush, 16)
        return
      }
      flush()
    }

    function startSSE() {
      sse?.abort()
      const ctrl = new AbortController()
      sse = ctrl
      const currentSDK = sdk()
      ;(async () => {
        while (true) {
          if (abort.signal.aborted || ctrl.signal.aborted) break
          const events = await currentSDK.global.event({ signal: ctrl.signal })

          for await (const event of events.stream) {
            if (ctrl.signal.aborted) break
            handleEvent(event)
          }

          if (timer) clearTimeout(timer)
          if (queue.length > 0) flush()
        }
      })().catch(() => {})
    }

    createEffect(() => {
      const dir = directory()
      setSDK(createSDK(dir))
      if (!props.events) {
        startSSE()
      }
    })

    onMount(async () => {
      if (props.events) {
        const unsub = await props.events.subscribe(handleEvent)
        onCleanup(unsub)
      } else {
        startSSE()
      }
    })

    onCleanup(() => {
      abort.abort()
      sse?.abort()
      if (timer) clearTimeout(timer)
    })

    return {
      get client() {
        return sdk()
      },
      get directory() {
        return directory()
      },
      setDirectory(dir?: string) {
        setDirectory(dir)
      },
      event: emitter,
      fetch: props.fetch ?? fetch,
      url: props.url,
    }
  },
})
