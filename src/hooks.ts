import { T, applyTo, cond, ifElse } from 'ramda'
import { useCallback, useEffect, useState } from 'react'
import { Observable, identity } from 'rxjs'

import { Stateful } from './atom'
import { isFunction } from './util'

export const useObservableValue = <T>(observable: Observable<T>, initialValue?: T): T => {
  const [value, setValue] = useState<T>(initialValue as T)

  useEffect(() => {
    const subscription = observable.subscribe((value) => setValue(value))
    return () => subscription.unsubscribe()
  }, [observable])

  return value
}

export const useStatefulValue = <T>(stateful: Stateful<T>): T => {
  return useObservableValue(stateful, stateful.value)
}

type StateUpdater<T> = T | ((value: T) => T)

export const useStateful = <T>(
  stateful: Stateful<T>
): [T, (value: T | StateUpdater<T>) => void] => {
  const value = useStatefulValue(stateful)
  const setter = useCallback(
    (valueOrUpdater: StateUpdater<T>) => {
      const newValue = ifElse(isFunction, applyTo(value), identity)(valueOrUpdater)

      stateful.next(newValue)
    },
    [value, stateful]
  )

  return [value, setter]
}
