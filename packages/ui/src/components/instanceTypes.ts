import type * as components from './index'

type ComponentInstanceMap = {
  [ K in keyof typeof components]: InstanceType<typeof components[K]>
}

export type XxButtonInstance = ComponentInstanceMap['XxButton']
