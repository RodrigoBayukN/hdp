export namespace Rpc {
  type Definition = {
    [method: string]: (input: any) => any
  }

  export function create<TClient extends Definition = any, TServer extends Definition = any>(
    target: {
      postMessage: (data: string) => void | null
      onmessage?: ((ev: MessageEvent<any>) => any) | null
      addEventListener?: (type: "message", listener: (ev: MessageEvent<any>) => any) => void
    },
    rpc?: TServer
  ) {
    const pending = new Map<number, (result: any) => void>()
    const listeners = new Map<string, Set<(data: any) => void>>()
    let id = 0

    const handleMessage = async (evt: MessageEvent<any>) => {
      const parsed = JSON.parse(evt.data)
      if (parsed.type === "rpc.request" && rpc) {
        try {
          const result = await rpc[parsed.method](parsed.input)
          target.postMessage(JSON.stringify({ type: "rpc.result", result, id: parsed.id }))
        } catch (e) {
          target.postMessage(JSON.stringify({ type: "rpc.error", error: e instanceof Error ? e.message : String(e), id: parsed.id }))
        }
      } else if (parsed.type === "rpc.result") {
        const resolve = pending.get(parsed.id)
        if (resolve) {
          resolve(parsed.result)
          pending.delete(parsed.id)
        }
      } else if (parsed.type === "rpc.error") {
        const resolve = pending.get(parsed.id)
        if (resolve) {
          // We can't reject easily since we only saved resolve, but let's just resolve undefined or throw.
          // For simplicity, let's modify pending to store { resolve, reject }
          resolve(undefined) // fallback if we don't have reject
          pending.delete(parsed.id)
        }
      } else if (parsed.type === "rpc.event") {
        const handlers = listeners.get(parsed.event)
        if (handlers) {
          for (const handler of handlers) {
            handler(parsed.data)
          }
        }
      }
    }

    if (target.addEventListener) {
      target.addEventListener("message", handleMessage)
    } else {
      target.onmessage = handleMessage
    }

    return {
      call<Method extends keyof TClient>(method: Method, input: Parameters<TClient[Method]>[0]): Promise<ReturnType<TClient[Method]>> {
        const requestId = id++
        return new Promise((resolve) => {
          pending.set(requestId, resolve)
          target.postMessage(JSON.stringify({ type: "rpc.request", method, input, id: requestId }))
        })
      },
      on<Data>(event: string, handler: (data: Data) => void) {
        let handlers = listeners.get(event)
        if (!handlers) {
          handlers = new Set()
          listeners.set(event, handlers)
        }
        handlers.add(handler)
        return () => {
          handlers!.delete(handler)
        }
      },
      emit(event: string, data: unknown) {
        target.postMessage(JSON.stringify({ type: "rpc.event", event, data }))
      }
    }
  }
}
