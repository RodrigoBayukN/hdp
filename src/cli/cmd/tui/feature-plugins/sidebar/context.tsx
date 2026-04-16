import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"

const id = "internal:sidebar-context"

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_title(_ctx, _props) {
        const theme = () => api.theme.current
        const project = () => api.state.project || "Unknown"

        return (
          <box paddingRight={1}>
            <text fg={theme().text}>
              <b>Proyecto: {project()}</b>
            </text>
          </box>
        )
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
